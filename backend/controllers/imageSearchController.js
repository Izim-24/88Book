import { createWorker } from "tesseract.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { productRepository } from "../repositories/productRepository.js";
import { searchHistoryRepository } from "../repositories/searchHistoryRepository.js";
import { extractFeatures, parseSelection } from "../services/imageAnalysisService.js";
import { rankImageResults } from "../services/rankingService.js";
import { vectorIndex } from "../services/vectorIndex.js";

const ocrCachePath = process.env.OCR_CACHE_PATH || join(dirname(fileURLToPath(import.meta.url)), "../ocr-data");
const coversPath = join(dirname(fileURLToPath(import.meta.url)), "../uploads/covers");
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const FILE_ERROR_MESSAGE = "Only JPG, PNG or WebP images up to 10 MB";
const NO_MATCH_MESSAGE = "No matching products found";

const normalize = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[đĐ]/g, "d")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const commonWords = new Set(["the", "and", "with", "for", "from", "book", "by", "it", "us", "of", "an", "a"]);
const tokens = (value) => normalize(value).split(" ").filter((word) => word.length > 1 && !commonWords.has(word));

const closeOcrWord = (expected, actual, minLength = 5) => {
  if (expected === actual) return true;
  if (expected.length < minLength || Math.abs(expected.length - actual.length) > 1) return false;
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
    // OCR often misreads one letter of a cover title ("biee" for "biec").
    const titleHits = titleWords.filter((word) =>
      words.has(word) || [...words].some((ocrWord) => closeOcrWord(word, ocrWord, 4))
    ).length;
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

const findIsbn = (text) =>
  text.replace(/[^0-9X]/gi, "").match(/97[89][0-9]{10}|[0-9]{9}[0-9X]/i)?.[0] || null;

// Text the customer corrected after OCR ("Search by image" alternative path).
export const searchBooksByRecognizedText = async (req, res) => {
  const recognizedText = String(req.body?.text || "").trim();
  if (!recognizedText || recognizedText.length > 2000) {
    return res.status(400).json({ success: false, message: "Enter up to 2000 characters from the cover." });
  }
  try {
    const catalog = await productRepository.findAllForSearch();
    const results = rankImageResults({ textMatches: rankBooks(catalog, recognizedText) });
    return res.json({
      success: true,
      recognizedText,
      isbn: findIsbn(recognizedText),
      results,
      message: results.length ? null : NO_MATCH_MESSAGE,
    });
  } catch (error) {
    console.error("Cover text search failed:", error);
    return res.status(503).json({ success: false, message: "Book search is unavailable." });
  }
};

// detectObjects() text step: OCR is CPU-heavy, so only one runs at a time. When
// it is busy the search continues with visual features alone.
let ocrBusy = false;
const recognizeCoverText = async (image) => {
  if (ocrBusy) return { text: "", skipped: true };
  ocrBusy = true;
  let worker;
  try {
    const languages = (process.env.OCR_LANGS || "eng,vie")
      .split(/[,+]/).map((lang) => lang.trim()).filter(Boolean);
    worker = await createWorker(languages, 1, { cachePath: ocrCachePath });
    const { data } = await worker.recognize(image);
    return { text: String(data.text || "").trim().slice(0, 2000), skipped: false };
  } catch (error) {
    console.warn("Cover text recognition failed:", error.message);
    return { text: "", skipped: true };
  } finally {
    ocrBusy = false;
    if (worker) await worker.terminate().catch(() => {});
  }
};

// "Search by image" sequence diagram:
//   3   submitImage(image) -> 3.1 validateFileFormat -> 3.2 showFileError
//   3.3 extractFeatures(image)  (preprocessImage, detectObjects, visualFeatures)
//   4/5 markTargetObject + confirmSelection (selection sent with the upload)
//   5.1 searchSimilar(features) -> findSimilarProducts -> matchByFeatures
//   5.1.3 saveSearchHistory(customerId, image, features)
//   5.1.5 searchResult / 5.2 showNoMatchMessage
export const searchBooksByImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: FILE_ERROR_MESSAGE });
  if (!validImage(req.file)) return res.status(415).json({ success: false, message: FILE_ERROR_MESSAGE });

  try {
    const selection = parseSelection(req.body?.selection);
    const catalog = await productRepository.findAllForSearch();

    // An unedited catalog cover file is recognised directly.
    const exactCover = selection ? null : await matchLocalCover(catalog, req.file.buffer);

    let image;
    let features;
    try {
      ({ image, features } = await extractFeatures(req.file.buffer, selection));
    } catch (error) {
      console.warn("Image could not be decoded:", error.message);
      return res.status(415).json({ success: false, message: FILE_ERROR_MESSAGE });
    }

    const ocr = exactCover ? { text: "", skipped: true } : await recognizeCoverText(image);
    const visualMatches = await vectorIndex.findSimilar(features, catalog);
    const results = rankImageResults({
      textMatches: ocr.text ? rankBooks(catalog, ocr.text) : [],
      visualMatches,
      exactCover,
    });

    const customerId = req.user?.userId || null;
    try {
      const searchId = customerId
        ? await searchHistoryRepository.save({
          customerId,
          searchType: "image",
          // Raw OCR text is noisy; it is kept in image_search_queries instead.
          queryText: "[image]",
        })
        : null;
      await searchHistoryRepository.saveImageQuery({
        searchId,
        customerId,
        recognizedText: ocr.text,
        features: {
          ...features,
          selection,
          resultIds: results.map((book) => book.id),
        },
      });
    } catch (error) {
      console.warn("Image search history was not saved:", error.message);
    }

    return res.json({
      success: true,
      recognizedText: ocr.text,
      textRecognitionSkipped: ocr.skipped && !exactCover,
      isbn: findIsbn(ocr.text),
      results,
      message: results.length ? null : NO_MATCH_MESSAGE,
    });
  } catch (error) {
    console.error("Image search failed:", error);
    return res.status(503).json({ success: false, message: "Image search is unavailable. Please try again." });
  }
};
