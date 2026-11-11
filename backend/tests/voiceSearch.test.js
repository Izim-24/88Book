import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";
import { identifyOptionalUser } from "../middleware/auth.js";
import { searchBooksByVoice } from "../controllers/voiceSearchController.js";

test("voice search identifies the JWT user and still returns books if history fails", async () => {
  const oldSecret = process.env.JWT_SECRET;
  const oldQuery = pool.query;
  process.env.JWT_SECRET = "voice-search-test-secret";
  const calls = [];
  pool.query = async (sql, params) => {
    calls.push({ sql, params });
    if (sql.startsWith("SELECT")) return { rows: [{ id: 1, title: "Atomic Habits" }] };
    throw new Error("history table unavailable");
  };
  const oldWarn = console.warn;
  console.warn = () => {};

  try {
    const token = jwt.sign({ userId: 42, role: "buyer" }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` }, body: { text: "Atomic Habits" } };
    identifyOptionalUser(req, {}, () => {});
    let response;
    const res = { json: (body) => { response = body; return res; } };
    await searchBooksByVoice(req, res);
    assert.equal(req.user.userId, 42);
    assert.equal(response.success, true);
    assert.equal(response.results[0].id, 1);
    assert.deepEqual(calls[1].params, [42, "Atomic Habits", "vi-VN"]);
  } finally {
    pool.query = oldQuery;
    console.warn = oldWarn;
    if (oldSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = oldSecret;
  }
});

test("voice search saves an authenticated query for personalized recommendations", async () => {
  const oldQuery = pool.query;
  const calls = [];
  pool.query = async (sql, params) => {
    calls.push({ sql, params });
    return { rows: [] };
  };
  try {
    let response;
    const res = { json: (body) => { response = body; return res; } };
    await searchBooksByVoice({ body: { text: "Manga" }, user: { userId: 7 } }, res);
    assert.equal(response.success, true);
    assert.match(calls[2].sql, /book_search_history/);
    assert.deepEqual(calls[2].params, [7, "Manga"]);
  } finally {
    pool.query = oldQuery;
  }
});

test("spoken sentences match by words, ignoring accents and filler words", async () => {
  const { rankVoiceResults } = await import("../services/voiceSearch.js");
  const books = [
    { id: 1, title: "Atomic Habits", author: "James Clear", category: "Self-Help" },
    { id: 2, title: "Mắt Biếc", author: "Nguyễn Nhật Ánh", category: "Tiểu thuyết" },
    { id: 3, title: "Cho Tôi Xin Một Vé Đi Tuổi Thơ", author: "Nguyễn Nhật Ánh", category: "Tiểu thuyết" },
    { id: 4, title: "Sherlock Holmes", author: "Arthur Conan Doyle", category: "Trinh thám" },
  ];
  const ids = (text) => rankVoiceResults(books, text).map((book) => book.id);

  assert.deepEqual(ids("tìm sách Atomic Habits"), [1]);
  assert.deepEqual(ids("atomic habit"), [1]);
  assert.deepEqual(ids("sách của nguyen nhat anh").sort(), [2, 3]);
  assert.deepEqual(ids("tìm cuốn mắt biếc"), [2]);
  assert.deepEqual(ids("trinh thám"), [4]);
  assert.deepEqual(ids("tìm sách"), []);
  assert.deepEqual(ids("xyz qwerty"), []);
});
