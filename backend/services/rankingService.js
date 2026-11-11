// RankingService (component diagram): ranks catalog books against a keyword or a
// spoken query. Speech recognition returns whole
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

export const rankByKeyword = (books, text, limit = 20) => {
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

// Visual similarity below this is what unrelated covers reach; above
// STRONG_VISUAL it identifies a cover on its own. Calibrated on the catalog's
// covers against simulated phone photos (cropped, re-lit, re-compressed).
export const WEAK_VISUAL = 0.55;
export const STRONG_VISUAL = 0.7;
export const STANDOUT_MARGIN = 0.05;
const MIN_IMAGE_SCORE = 0.35;
const CONFIDENT_SCORE = 0.8;
const WEAK_RESULT_CUTOFF = 0.5;

const visualScore = (similarity) =>
  Math.min(0.9, Math.max(0, ((similarity - WEAK_VISUAL) / (STRONG_VISUAL - WEAK_VISUAL)) * 0.45));

// "Search by image" sequence 5.1.1.1 matchByFeatures(features): combines the cover
// text read by OCR with visual similarity. Either signal can find a book; when both
// agree the score rises (1 - (1-a)(1-b)), and similar-looking series covers are
// told apart by their text.
export const rankImageResults = ({ textMatches = [], visualMatches = [], exactCover = null, limit = 10 }) => {
  const byId = new Map();
  const entry = (book) => {
    const key = String(book.id);
    if (!byId.has(key)) byId.set(key, { book, text: 0, visual: 0, similarity: null });
    return byId.get(key);
  };
  for (const match of textMatches) entry(match).text = Number(match.score) || 0;
  const sortedVisual = [...visualMatches].sort((a, b) => b.similarity - a.similarity);
  // A cover clearly ahead of every other one is a match even when photo
  // conditions keep its absolute similarity modest (calibrated: 56 of 57).
  const standout = sortedVisual[0] && sortedVisual[0].similarity >= WEAK_VISUAL &&
    sortedVisual[0].similarity - (sortedVisual[1]?.similarity ?? 0) >= STANDOUT_MARGIN
    ? sortedVisual[0].book : null;
  for (const { book, similarity } of sortedVisual) {
    const item = entry(book);
    item.similarity = similarity;
    item.visual = Math.max(visualScore(similarity), book === standout ? 0.5 : 0);
  }

  const ranked = [...byId.values()].map((item) => {
    const score = 1 - (1 - item.text) * (1 - item.visual);
    const matchReason = item.text && item.visual ? "Cover text and image"
      : item.visual ? "Similar cover image" : "Cover text";
    const { score: _old, matchReason: _oldReason, ...book } = item.book;
    return { ...book, score: Number(Math.min(0.99, score).toFixed(2)), similarity: item.similarity, matchReason };
  })
    .filter((book) => book.score >= MIN_IMAGE_SCORE)
    .sort((a, b) => b.score - a.score);

  // With a confident match, weak ones are mostly OCR noise ("biec" ~ "bien").
  const confident = exactCover || (ranked[0] && ranked[0].score >= CONFIDENT_SCORE);
  const shown = confident ? ranked.filter((book) => book.score >= WEAK_RESULT_CUTOFF) : ranked;

  if (exactCover) {
    return [
      { ...exactCover, score: 1, matchReason: "Cover image" },
      ...shown.filter((book) => String(book.id) !== String(exactCover.id)),
    ].slice(0, limit);
  }
  return shown.slice(0, limit);
};
