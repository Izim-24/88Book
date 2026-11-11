import test from "node:test";
import assert from "node:assert/strict";
import {
  createSearchService,
  INVALID_KEYWORD_MESSAGE,
  normalizeKeyword,
  SearchValidationError,
  validateKeywordFormat,
} from "../services/searchService.js";
import { createSearchController } from "../controllers/searchController.js";
import { rankByKeyword } from "../services/rankingService.js";

const catalog = [
  { id: 1, title: "Atomic Habits", author: "James Clear", category: "Self-Help" },
  { id: 2, title: "Mắt Biếc", author: "Nguyễn Nhật Ánh", category: "Tiểu thuyết" },
  { id: 3, title: "Cho Tôi Xin Một Vé Đi Tuổi Thơ", author: "Nguyễn Nhật Ánh", category: "Tiểu thuyết" },
  { id: 4, title: "Sherlock Holmes", author: "Arthur Conan Doyle", category: "Trinh thám" },
];

const fakeHistory = () => {
  const calls = [];
  return {
    calls,
    async save(entry) { calls.push(["save", entry]); return 77; },
    async saveVoiceQuery(entry) { calls.push(["voice", entry]); },
    async getRecentSearches(customerId) { calls.push(["recent", customerId]); return ["mắt biếc", "sherlock"]; },
    async getTrendingKeywords() { return ["Sherlock", "atomic habits", "tiểu thuyết"]; },
  };
};
const fakeProducts = { async findAllForSearch() { return catalog; } };

test("keywords are normalised and must be 2-50 characters", () => {
  assert.equal(normalizeKeyword("  Mắt   Biếc \n"), "Mắt Biếc");
  assert.ok(validateKeywordFormat("ab"));
  assert.ok(!validateKeywordFormat(" a "));
  assert.ok(!validateKeywordFormat("x".repeat(51)));
  assert.ok(!validateKeywordFormat(42));
});

test("keyword search ranks products and saves history only for customers", async () => {
  const history = fakeHistory();
  const service = createSearchService({ products: fakeProducts, history });

  const result = await service.searchByKeyword("  tìm sách Atomic Habits ", { customerId: 5 });
  assert.deepEqual(result.products.map((book) => book.id), [1]);
  assert.equal(result.message, null);
  assert.deepEqual(history.calls, [["save", { customerId: 5, searchType: "keyword", queryText: "tìm sách Atomic Habits" }]]);

  const guest = await service.searchByKeyword("xyz qwerty");
  assert.deepEqual(guest.products, []);
  assert.equal(guest.message, "No products found");
  assert.equal(history.calls.length, 1);

  await assert.rejects(service.searchByKeyword("a"), (error) =>
    error instanceof SearchValidationError && error.message === INVALID_KEYWORD_MESSAGE);
});

test("voice search reuses keyword search and records a voice query without audio", async () => {
  const history = fakeHistory();
  const service = createSearchService({ products: fakeProducts, history });

  const result = await service.searchByVoice("sách của nguyen nhat anh", { customerId: 9, lang: "vi-VN" });
  assert.deepEqual(result.products.map((book) => book.id).sort(), [2, 3]);
  assert.deepEqual(history.calls, [
    ["save", { customerId: 9, searchType: "voice", queryText: "sách của nguyen nhat anh" }],
    ["voice", { searchId: 77, customerId: 9, recognizedText: "sách của nguyen nhat anh", lang: "vi-VN" }],
  ]);

  const guestHistory = fakeHistory();
  await createSearchService({ products: fakeProducts, history: guestHistory }).searchByVoice("Sherlock");
  assert.deepEqual(guestHistory.calls.map(([kind]) => kind), ["voice"]);
  assert.equal(guestHistory.calls[0][1].searchId, null);
});

test("search results survive a history failure", async () => {
  const history = { ...fakeHistory(), async save() { throw new Error("history table unavailable"); } };
  const service = createSearchService({ products: fakeProducts, history });
  const oldWarn = console.warn;
  console.warn = () => {};
  try {
    const result = await service.searchByKeyword("Sherlock", { customerId: 1 });
    assert.deepEqual(result.products.map((book) => book.id), [4]);
  } finally {
    console.warn = oldWarn;
  }
});

test("suggestions combine recent searches with trending keywords without duplicates", async () => {
  const service = createSearchService({ products: fakeProducts, history: fakeHistory() });
  assert.deepEqual(await service.getSuggestedKeywords(3), {
    recent: ["mắt biếc", "sherlock"],
    trending: ["atomic habits", "tiểu thuyết"],
  });
  const guest = await service.getSuggestedKeywords(null);
  assert.deepEqual(guest.recent, []);
});

test("controller maps invalid keywords to 400 and keeps the voice response shape", async () => {
  const controller = createSearchController(createSearchService({ products: fakeProducts, history: fakeHistory() }));
  const response = () => {
    const res = { statusCode: 200 };
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (body) => { res.body = body; return res; };
    return res;
  };

  const invalid = response();
  await controller.keyword({ body: { keyword: "a" } }, invalid);
  assert.equal(invalid.statusCode, 400);
  assert.equal(invalid.body.message, INVALID_KEYWORD_MESSAGE);

  const voice = response();
  await controller.voice({ body: { text: "Atomic Habits" }, user: { userId: 2 } }, voice);
  assert.equal(voice.statusCode, 200);
  assert.equal(voice.body.recognizedText, "Atomic Habits");
  assert.deepEqual(voice.body.results.map((book) => book.id), [1]);
});

test("spoken sentences match by words, ignoring accents and filler words", () => {
  const ids = (text) => rankByKeyword(catalog, text).map((book) => book.id);
  assert.deepEqual(ids("tìm sách Atomic Habits"), [1]);
  assert.deepEqual(ids("atomic habit"), [1]);
  assert.deepEqual(ids("sách của nguyen nhat anh").sort(), [2, 3]);
  assert.deepEqual(ids("tìm cuốn mắt biếc"), [2]);
  assert.deepEqual(ids("trinh thám"), [4]);
  assert.deepEqual(ids("tìm sách"), []);
});
