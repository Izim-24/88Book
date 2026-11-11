// VectorIndex (component diagram): visual features of catalog covers, used by
// findSimilarProducts(features). Only covers stored under /uploads/covers are
// indexed; external image URLs are not downloaded.
import { readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { computeVisualFeatures, detectObjects, preprocessImage, visualSimilarity } from "./imageAnalysisService.js";

const coversPath = join(dirname(fileURLToPath(import.meta.url)), "../uploads/covers");
const LOCAL_COVER = /^\/uploads\/covers\/([\w.-]+\.(?:jpe?g|png|webp))$/i;

// filename -> { mtimeMs, features }
const cache = new Map();

const featuresForCover = async (filename) => {
  const path = join(coversPath, filename);
  const info = await stat(path);
  const cached = cache.get(filename);
  if (cached && cached.mtimeMs === info.mtimeMs) return cached.features;
  // Same preprocessing as uploads: many cover files are a book on a plain
  // background, while a customer's photo is trimmed to the book itself.
  const object = await detectObjects(await preprocessImage(await readFile(path)));
  const features = await computeVisualFeatures(object);
  cache.set(filename, { mtimeMs: info.mtimeMs, features });
  return features;
};

export const vectorIndex = {
  // Returns [{ book, similarity }] for books whose local cover could be read.
  async findSimilar(features, books) {
    const scored = await Promise.all(books.map(async (book) => {
      const filename = String(book.image_url || "").match(LOCAL_COVER)?.[1];
      if (!filename) return null;
      try {
        return { book, similarity: visualSimilarity(features, await featuresForCover(filename)) };
      } catch {
        return null; // Missing or unreadable cover file.
      }
    }));
    return scored.filter(Boolean).sort((a, b) => b.similarity - a.similarity);
  },

  clear() {
    cache.clear();
  },
};
