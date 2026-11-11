const MAX_HISTORY = 8;

export function getAIConfig(env = process.env) {
  const apiUrl = env.AI_API_URL?.trim();
  const model = env.AI_MODEL?.trim();
  const apiKey = env.AI_API_KEY?.trim();
  if (!apiUrl || !model) return null;

  let url;
  try {
    url = new URL(apiUrl);
  } catch {
    return null;
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) return null;
  if (!local && !apiKey) return null;
  const requestedTokens = Number(env.AI_MAX_TOKENS);
  const maxTokens = Number.isInteger(requestedTokens) && requestedTokens >= 100 && requestedTokens <= 8000
    ? requestedTokens
    : 2000;
  // Optional comma-separated backups, tried when the main model is busy or retired.
  const fallbackModels = String(env.AI_FALLBACK_MODELS || "")
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name && name !== model)
    .slice(0, 3);
  return { url: url.toString(), model, fallbackModels, apiKey, maxTokens };
}

// Overloaded (503), rate-limited (429), retired (404) or timed-out models are worth
// retrying with a backup; a bad key (401/403) or bad request (400) is not.
const RETRYABLE_PROVIDER_STATUSES = new Set([404, 408, 429, 500, 502, 503, 504]);

export function validateChatInput(body) {
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 1000) return null;
  if (body.history !== undefined && !Array.isArray(body.history)) return null;
  const history = (body.history || []).slice(-MAX_HISTORY);
  if (history.some((item) =>
    !item || !["user", "assistant"].includes(item.role) ||
    typeof item.content !== "string" || !item.content.trim() || item.content.length > 1000
  )) return null;
  const preferredBookIds = Array.isArray(body.preferredBookIds)
    ? body.preferredBookIds.slice(0, 8).map(Number).filter(Number.isSafeInteger)
    : [];
  return { message, history: history.map(({ role, content }) => ({ role, content: content.trim() })), preferredBookIds };
}

export async function generateBookGuideReply({ input, catalog, config, fetchImpl = fetch }) {
  const available = catalog.filter((book) => Number(book.quantity) > 0);
  const catalogForModel = available.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    category: book.category,
    priceVND: Number(book.price),
    description: String(book.description || "").slice(0, 180),
  }));
  const preferred = input.preferredBookIds.filter((id) => available.some((book) => Number(book.id) === id));
  const system = [
    "Bạn là Book guide của cửa hàng sách. Trò chuyện tự nhiên bằng tiếng Việt và trả lời câu hỏi của khách.",
    "Khi gợi ý mua sách, chỉ nhắc tới sách có trong DANH_MUC. Không bịa tựa sách, giá hay tình trạng còn hàng.",
    "Nếu không có sách phù hợp, hãy nói rõ và hỏi thêm để tư vấn. Giữ câu trả lời ngắn gọn.",
    "Trả về duy nhất JSON hợp lệ theo mẫu: {\"reply\":\"câu trả lời\",\"bookIds\":[1,2]}. bookIds tối đa 3 ID có trong DANH_MUC; dùng [] nếu không gợi ý sách.",
    `SACH_UU_TIEN: ${JSON.stringify(preferred)}`,
    `DANH_MUC: ${JSON.stringify(catalogForModel)}`,
  ].join("\n");

  const requestModel = (model) => fetchImpl(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, ...input.history, { role: "user", content: input.message }],
      // OpenAI's newer models reject max_tokens. For "thinking" models (Gemini,
      // gpt-oss) the limit also covers reasoning, so it must leave room for the reply.
      ...(new URL(config.url).hostname === "api.openai.com"
        ? { max_completion_tokens: config.maxTokens }
        : { max_tokens: config.maxTokens }),
    }),
    signal: AbortSignal.timeout(25000),
  });

  const models = [config.model, ...(config.fallbackModels || [])];
  let response;
  let lastStatus = null;
  for (const model of models) {
    try {
      response = await requestModel(model);
    } catch (networkError) {
      // Timeout or connection failure: try the next model, if any.
      response = null;
      lastStatus = networkError?.name === "TimeoutError" ? 504 : 503;
      continue;
    }
    if (response.ok) break;
    lastStatus = response.status;
    if (!RETRYABLE_PROVIDER_STATUSES.has(response.status)) break;
  }
  if (!response?.ok) {
    const error = new Error(`AI provider returned HTTP ${lastStatus}`);
    error.status = 502;
    error.providerStatus = lastStatus;
    throw error;
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  const raw = typeof content === "string" ? content : Array.isArray(content)
    ? content.filter((part) => part.type === "text").map((part) => part.text).join("") : "";
  let parsed;
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    // Some models ignore the JSON instruction; show their text without book cards.
    parsed = { reply: raw, bookIds: [] };
  }
  if (typeof parsed.reply !== "string" || !parsed.reply.trim()) {
    const error = new Error("AI provider returned an empty reply");
    error.status = 502;
    throw error;
  }
  const ids = Array.isArray(parsed.bookIds) ? parsed.bookIds.slice(0, 3).map(Number) : [];
  const books = [...new Set(ids)].map((id) => available.find((book) => Number(book.id) === id)).filter(Boolean);
  return { reply: parsed.reply.trim().slice(0, 2000), books };
}
