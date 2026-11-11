import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { extractFeatures, parseSelection, visualSimilarity } from "../services/imageAnalysisService.js";
import { rankImageResults } from "../services/rankingService.js";
import { vectorIndex } from "../services/vectorIndex.js";

const coversDir = fileURLToPath(new URL("../uploads/covers/", import.meta.url));

test("selection must be a sensible fraction of the image", () => {
  assert.deepEqual(parseSelection('{"x":0.1,"y":0.2,"width":0.5,"height":0.6}'), { x: 0.1, y: 0.2, width: 0.5, height: 0.6 });
  const clamped = parseSelection({ x: 0.8, y: 0.8, width: 0.5, height: 0.5 });
  assert.equal(clamped.x, 0.8);
  assert.ok(Math.abs(clamped.width - 0.2) < 1e-9 && Math.abs(clamped.height - 0.2) < 1e-9);
  assert.equal(parseSelection({ x: 0, y: 0, width: 0.01, height: 0.5 }), null);
  assert.equal(parseSelection("not json"), null);
  assert.equal(parseSelection(null), null);
});

test("a phone-style photo of a catalog cover finds that cover first", async () => {
  const covers = (await readdir(coversDir)).filter((name) => /\.(jpe?g|webp)$/i.test(name)).sort();
  const books = covers.map((name, index) => ({ id: index + 1, title: name, image_url: `/uploads/covers/${name}` }));
  const target = books.find((book) => book.title === "book_1.jpg");
  const meta = await sharp(coversDir + target.title).metadata();
  // Crop, re-light, re-compress and place on a table-coloured background.
  const photo = await sharp(coversDir + target.title)
    .extract({ left: 30, top: 30, width: meta.width - 60, height: meta.height - 60 })
    .resize(480).modulate({ brightness: 1.1 }).jpeg({ quality: 60 })
    .extend({ top: 40, bottom: 40, left: 40, right: 40, background: { r: 235, g: 235, b: 230 } })
    .toBuffer();

  const { features } = await extractFeatures(photo);
  const matches = await vectorIndex.findSimilar(features, books);
  assert.equal(matches[0].book.id, target.id);
  // Without any cover text, the clear visual lead alone puts it in the results.
  const ranked = rankImageResults({ visualMatches: matches });
  assert.equal(ranked[0].id, target.id);
  assert.equal(ranked[0].matchReason, "Similar cover image");
  assert.equal(visualSimilarity(features, features), 1);
});

test("the marked selection is what gets analysed", async () => {
  // Left half red, right half blue: selecting the right half must look blue.
  const image = await sharp({ create: { width: 200, height: 100, channels: 3, background: "#ff0000" } })
    .composite([{ input: { create: { width: 100, height: 100, channels: 3, background: "#0000ff" } }, left: 100, top: 0 }])
    .png().toBuffer();
  const { features } = await extractFeatures(image, { x: 0.5, y: 0, width: 0.5, height: 1 });
  const blueBin = 3; // r=0, g=0, b=3 in a 4x4x4 histogram
  assert.ok(features.histogram[blueBin] > 0.9, `blue share ${features.histogram[blueBin]}`);
});

test("image ranking lets cover text separate look-alike covers", () => {
  const twinA = { id: 4, title: "Mắt Biếc" };
  const twinB = { id: 27, title: "Cô Gái Đến Từ Hôm Qua" };
  const ranked = rankImageResults({
    textMatches: [{ ...twinA, score: 0.7 }],
    visualMatches: [{ book: twinB, similarity: 0.63 }, { book: twinA, similarity: 0.52 }],
  });
  assert.equal(ranked[0].id, 4);
  assert.equal(ranked[0].matchReason, "Cover text");

  const visualOnly = rankImageResults({ visualMatches: [{ book: twinB, similarity: 0.8 }, { book: twinA, similarity: 0.5 }] });
  assert.deepEqual(visualOnly.map((book) => book.id), [27]);
  assert.equal(visualOnly[0].matchReason, "Similar cover image");

  const exact = rankImageResults({ exactCover: twinA, visualMatches: [{ book: twinA, similarity: 0.9 }] });
  assert.deepEqual(exact.map((book) => [book.id, book.score]), [[4, 1]]);

  // A confident match hides weak OCR-noise matches; without one they stay.
  const noise = { id: 9, title: "Kafka Bên Bờ Biển", score: 0.35 };
  const confident = rankImageResults({ textMatches: [{ ...twinA, score: 0.9 }, noise] });
  assert.deepEqual(confident.map((book) => book.id), [4]);
  const unsure = rankImageResults({ textMatches: [{ ...twinA, score: 0.6 }, noise] });
  assert.deepEqual(unsure.map((book) => book.id), [4, 9]);
});
