import { createWorker } from "tesseract.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import pool from "../config/database.js";

const ocrCachePath = process.env.OCR_CACHE_PATH || join(dirname(fileURLToPath(import.meta.url)), "../ocr-data");
const coversPath = join(dirname(fileURLToPath(import.meta.url)), "../uploads/covers");
const catalogSql = "SELECT id, title, author, description, price, category, isbn, quantity, image_url, rating FROM books";

const normalize = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[đĐ]/g, "d")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const commonWords = new Set(["the", "and", "with", "for", "from", "book", "by", "it", "us", "of", "an", "a"]);
const tokens = (value) => normalize(value).split(" ").filter((word) => word.length > 1 && !commonWords.has(word));

const closeOcrWord = (expected, actual) => {
  if (expected === actual) return true;
  if (expected.length < 5 || Math.abs(expected.length - actual.length) > 1) return false;
  let previous = Array.from({ length: actual.length + 1 }, (_, index) => index);
  for (let row = 1; row <= expected.length; row++) {
    const current = [row];
    for (let col = 1; col <= actual.length; col++) {
      current[col] = Math.min(
        previous[col] + 1,
        current[col - 1] + 1,
        previous[col - 1] + (expected[row - 1] === actual[col - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[actual.length] <= 1;
};

export const rankBooks = (books, recognizedText) => {
  const normalizedText = normalize(recognizedText);
  const words = new Set(normalizedText.split(" "));
  const compactText = normalizedText.replace(/ /g, "");

  return books.map((book) => {
    const isbn = String(book.isbn || "").replace(/[^0-9X]/gi, "").toUpperCase();
    const isbnMatch = isbn.length >= 10 && compactText.toUpperCase().includes(isbn);
    const title = normalize(book.title);
    const titleWords = tokens(book.title);
    const authorWords = tokens(book.author);
    const titleHits = titleWords.filter((word) => words.has(word)).length;
    const authorHits = authorWords.filter((word) =>
      [...words].some((ocrWord) => closeOcrWord(word, ocrWord))
    ).length;
    const titleCoverage = titleWords.length ? titleHits / titleWords.length : 0;
    const authorCoverage = authorWords.length ? authorHits / authorWords.length : 0;
    const fullTitleMatch = title.length > 3 && normalizedText.includes(title);
    const authorOnlyMatch = authorWords.length >= 2 && authorCoverage === 1;
    const score = isbnMatch ? 1 : Math.min(0.99,
      (fullTitleMatch ? 0.7 : titleCoverage * 0.7) + authorCoverage * (authorOnlyMatch ? 0.4 : 0.2));
    return { ...book, score: Number(score.toFixed(2)), matchReason: isbnMatch ? "ISBN" : fullTitleMatch ? "Title" : authorOnlyMatch && !titleHits ? "Author" : "Cover text" };
  }).filter((book) => book.score >= 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
};

const validImage = (file) => {
  if (!file?.buffer) return false;
  const buffer = file.buffer;
  const jpeg = file.mimetype === "image/jpeg" && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  const png = file.mimetype === "image/png" && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const webp = file.mimetype === "image/webp" && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  return jpeg || png || webp;
};

const findCatalogMatches = async (recognizedText, books) => {
  const catalog = books || (await pool.query(catalogSql)).rows;
  const isbn = recognizedText.replace(/[^0-9X]/gi, "").match(/97[89][0-9]{10}|[0-9]{9}[0-9X]/i)?.[0] || null;
  return { isbn, results: recognizedText ? rankBooks(catalog, recognizedText) : [] };
};

const digest = (buffer) => createHash("sha256").update(buffer).digest("hex");

export const matchLocalCover = async (books, uploadedBuffer) => {
  const uploadedDigest = digest(uploadedBuffer);
  const candidates = books.filter((book) =>
    /^\/uploads\/covers\/book_\d+\.(?:jpg|webp)$/.test(book.image_url || "")
  );
  const matches = await Promise.all(candidates.map(async (book) => {
    try {
      const filename = book.image_url.split("/").pop();
      const file = await readFile(join(coversPath, filename));
      return digest(file) === uploadedDigest ? book : null;
    } catch {
      return null;
    }
  }));
  const book = matches.find(Boolean);
  return book ? { ...book, score: 1, matchReason: "Cover image" } : null;
};

export const searchBooksByRecognizedText = async (req, res) => {
  const recognizedText = String(req.body?.text || "").trim();
  if (!recognizedText || recognizedText.length > 2000) {
    return res.status(400).json({ success: false, message: "Enter up to 2000 characters from the cover." });
  }
  try {
    const matches = await findCatalogMatches(recognizedText);
    return res.json({ success: true, recognizedText, ...matches });
  } catch (error) {
    console.error("Cover text search failed:", error);
    return res.status(503).json({ success: false, message: "Book search is unavailable." });
  }
};

let ocrBusy = false;

export const searchBooksByImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "Choose a JPEG, PNG or WebP image." });
  if (!validImage(req.file)) return res.status(415).json({ success: false, message: "The uploaded file is not a valid image." });

  let claimedWorker = false;
  let worker;
  try {
    const catalog = (await pool.query(catalogSql)).rows;
    const exactCover = await matchLocalCover(catalog, req.file.buffer);
    if (exactCover) {
      return res.json({ success: true, recognizedText: "", isbn: exactCover.isbn || null, results: [exactCover] });
    }
    if (ocrBusy) return res.status(429).json({ success: false, message: "Image recognition is busy. Please try again." });
    ocrBusy = true;
    claimedWorker = true;
    const languages = (process.env.OCR_LANGS || "eng,vie")
      .split(/[,+]/).map((lang) => lang.trim()).filter(Boolean);
    worker = await createWorker(languages, 1, { cachePath: ocrCachePath });
    const { data } = await worker.recognize(req.file.buffer);
    const recognizedText = String(data.text || "").trim().slice(0, 2000);
    const matches = await findCatalogMatches(recognizedText, catalog);
    return res.json({ success: true, recognizedText, ...matches });
  } catch (error) {
    console.error("Image search failed:", error);
    return res.status(503).json({ success: false, message: "Image recognition is unavailable. Check the OCR language data connection and try again." });
  } finally {
    if (claimedWorker) ocrBusy = false;
    if (worker) await worker.terminate().catch(() => {});
  }
};
