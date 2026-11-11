// Ranks catalog books against a spoken query. Speech recognition returns whole
// sentences ("tìm sách của Nguyễn Nhật Ánh"), so matching works word by word,
// ignores accents and case, and drops filler words before scoring.

export const normalizeText = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[̀-ͯ]/g, "")
  .replace(/[đĐ]/g, "d")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

// Accent-free filler words people add when speaking a search request.
const FILLER_WORDS = new Set([
  // Vietnamese
  "tim", "kiem", "sach", "cuon", "quyen", "cua", "tac", "gia", "ve", "the", "loai",
  "cho", "toi", "minh", "muon", "doc", "mua", "nao", "co", "khong", "ban", "la",
  "mot", "nhung", "cac", "hay", "giup", "oi", "voi", "nhe", "goi", "y", "xem", "can",
  // English
  "find", "search", "for", "book", "books", "by", "a", "an", "of", "about", "me",
  "i", "want", "show", "please", "written", "author", "novel", "some", "any",
]);

const words = (value) => normalizeText(value).split(" ").filter(Boolean);

const queryWords = (text) => {
  const all = words(text);
  const meaningful = all.filter((word) => !FILLER_WORDS.has(word));
  // "tìm sách" alone has nothing but filler; search with what was said.
  return meaningful.length ? meaningful : all;
};

// Exact word, or a plural/partial form of a longer word ("habit" ~ "habits").
const sameWord = (a, b) =>
  a === b || (Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a)));

const containsPhrase = (haystack, needle) =>
  needle.length > 0 && ` ${haystack} `.includes(` ${needle} `);

export const rankVoiceResults = (books, text, limit = 20) => {
  const query = queryWords(text);
  if (!query.length) return [];
  const queryPhrase = query.join(" ");
  const spokenPhrase = normalizeText(text);

  return books.map((book) => {
    const title = normalizeText(book.title);
    const author = normalizeText(book.author);
    const category = normalizeText(book.category);
    const fields = [...words(book.title), ...words(book.author), ...words(book.category)];

    const matched = query.filter((word) => fields.some((field) => sameWord(word, field)));
    const coverage = matched.length / query.length;

    const fullTitle = title.length > 2 && (containsPhrase(spokenPhrase, title) || containsPhrase(title, queryPhrase));
    const fullAuthor = author.length > 2 && containsPhrase(spokenPhrase, author);
    const fullCategory = category.length > 2 && containsPhrase(spokenPhrase, category);

    let score = coverage * 0.6;
    if (fullTitle) score += 0.6;
    if (fullAuthor) score += 0.5;
    if (fullCategory) score += 0.3;
    return { book, score, coverage, strong: fullTitle || fullAuthor || fullCategory };
  })
    .filter((item) => item.strong || item.coverage >= 0.6)
    .sort((a, b) => b.score - a.score || Number(b.book.rating || 0) - Number(a.book.rating || 0))
    .slice(0, limit)
    .map((item) => item.book);
};
