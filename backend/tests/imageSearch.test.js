import test from "node:test";
import assert from "node:assert/strict";
import { rankBooks } from "../controllers/imageSearchController.js";

const books = [
  { id: 1, title: "Atomic Habits", author: "James Clear", isbn: "9780735211292" },
  { id: 2, title: "The Hobbit", author: "J. R. R. Tolkien", isbn: "9780547928227" },
];

test("matches a recognized cover title and author against catalog books", () => {
  const result = rankBooks(books, "Atomic Habits\nJames Clear");
  assert.equal(result[0].id, 1);
  assert.equal(result.length, 1);
});

test("ISBN takes priority even when OCR also reads other words", () => {
  const result = rankBooks(books, "978-0547928227\nThe Hobbit");
  assert.equal(result[0].id, 2);
  assert.equal(result[0].matchReason, "ISBN");
});

test("unrelated image text does not invent a book", () => {
  assert.deepEqual(rankBooks(books, "A street and a bicycle"), []);
});
