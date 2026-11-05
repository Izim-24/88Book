import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { rankBooks, matchLocalCover } from "../controllers/imageSearchController.js";

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

test("matches a full author name when OCR misses the title and one letter", () => {
  const result = rankBooks(books, "JAMES CLER");
  assert.equal(result[0].id, 1);
  assert.equal(result[0].matchReason, "Author");
});

test("matches Vietnamese title after normalizing đ and accents", () => {
  const result = rankBooks(
    [{ id: 3, title: "Đắc Nhân Tâm", author: "Dale Carnegie" }],
    "DAC NHAN TAM",
  );
  assert.equal(result[0].id, 3);
  assert.equal(result[0].matchReason, "Title");
});

test("matches a catalog cover file even when OCR cannot read its title", async () => {
  const file = await readFile(new URL("../uploads/covers/book_2.jpg", import.meta.url));
  const result = await matchLocalCover(
    [{ id: 12, title: "Đắc Nhân Tâm", image_url: "/uploads/covers/book_2.jpg" }],
    file,
  );
  assert.equal(result?.id, 12);
  assert.equal(result?.matchReason, "Cover image");
  assert.equal(await matchLocalCover([], file), null);
});

test("matches WebP cover files by their actual format and path", async () => {
  const file = await readFile(new URL("../uploads/covers/book_3.webp", import.meta.url));
  const result = await matchLocalCover(
    [{ id: 13, title: "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", image_url: "/uploads/covers/book_3.webp" }],
    file,
  );
  assert.equal(result?.id, 13);
});
