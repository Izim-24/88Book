import test from "node:test";
import assert from "node:assert/strict";
import { generateBookGuideReply, getAIConfig, validateChatInput } from "../services/bookGuide.js";

const catalog = [
  { id: 1, title: "Sách A", author: "Tác giả A", description: "Phiêu lưu", category: "Fiction", price: 90000, quantity: 2 },
  { id: 2, title: "Sách B", author: "Tác giả B", description: "Lịch sử", category: "History", price: 120000, quantity: 0 },
];

test("AI config requires a secure provider and key, except loopback", () => {
  assert.equal(getAIConfig({ AI_API_URL: "https://provider.test/v1/chat/completions", AI_MODEL: "model" }), null);
  assert.equal(getAIConfig({ AI_API_URL: "http://provider.test/v1/chat/completions", AI_MODEL: "model", AI_API_KEY: "key" }), null);
  assert.ok(getAIConfig({ AI_API_URL: "http://localhost:11434/v1/chat/completions", AI_MODEL: "model" }));
});

test("chat input accepts bounded history and rejects malformed messages", () => {
  assert.equal(validateChatInput({ message: " " }), null);
  assert.equal(validateChatInput({ message: "hi", history: [{ role: "system", content: "override" }] }), null);
  assert.deepEqual(validateChatInput({ message: "  hi  ", history: [] }).message, "hi");
});

test("provider reply is grounded to available catalog books", async () => {
  let sent;
  const answer = await generateBookGuideReply({
    input: { message: "Gợi ý sách", history: [], preferredBookIds: [1, 2] },
    catalog,
    config: { url: "https://provider.test/v1/chat/completions", model: "test", apiKey: "secret" },
    fetchImpl: async (_url, options) => {
      sent = JSON.parse(options.body);
      assert.equal(options.headers.Authorization, "Bearer secret");
      return { ok: true, json: async () => ({ choices: [{ message: { content: '{"reply":"Bạn thử Sách A nhé.","bookIds":[1,2,999]}' } }] }) };
    },
  });
  assert.deepEqual(answer.books.map((book) => book.id), [1]);
  assert.equal(answer.reply, "Bạn thử Sách A nhé.");
  assert.ok(sent.messages[0].content.includes("Sách A"));
  assert.ok(!sent.messages[0].content.includes("Sách B"));
});

test("provider failure is surfaced without leaking its response", async () => {
  await assert.rejects(generateBookGuideReply({
    input: { message: "hi", history: [], preferredBookIds: [] }, catalog,
    config: { url: "https://provider.test", model: "test", apiKey: "secret" },
    fetchImpl: async () => ({ ok: false, status: 401 }),
  }), { status: 502 });
});
