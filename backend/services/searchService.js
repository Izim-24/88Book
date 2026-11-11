// SearchService (sequence + component diagrams). Keyword and voice search share
// one path: the voice diagram calls searchByKeyword(text) after speech-to-text.
import { productRepository } from "../repositories/productRepository.js";
import { searchHistoryRepository } from "../repositories/searchHistoryRepository.js";
import { rankByKeyword } from "./rankingService.js";

export const KEYWORD_MIN_LENGTH = 2;
export const KEYWORD_MAX_LENGTH = 50;
export const INVALID_KEYWORD_MESSAGE = `Keyword must be ${KEYWORD_MIN_LENGTH}-${KEYWORD_MAX_LENGTH} characters`;
export const NO_PRODUCTS_MESSAGE = "No products found";

export class SearchValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

// "Search by keyword" sequence 3.1.1.1: normalizeKeyword(keyword)
export const normalizeKeyword = (keyword) =>
  typeof keyword === "string" ? keyword.normalize("NFC").replace(/\s+/g, " ").trim() : "";

// "Search by keyword" sequence 2.1: validateFormat(keyword)
export const validateKeywordFormat = (keyword) => {
  const normalized = normalizeKeyword(keyword);
  return normalized.length >= KEYWORD_MIN_LENGTH && normalized.length <= KEYWORD_MAX_LENGTH;
};

const saveHistorySafely = async (work) => {
  // A failed history write must never hide the search results from the customer.
  try {
    return await work();
  } catch (error) {
    console.warn("Search history was not saved:", error.message);
    return null;
  }
};

export const createSearchService = ({
  products = productRepository,
  history = searchHistoryRepository,
} = {}) => ({
  async searchByKeyword(keyword, { customerId = null, record = true, maxLength = KEYWORD_MAX_LENGTH } = {}) {
    const normalized = normalizeKeyword(keyword);
    if (normalized.length < KEYWORD_MIN_LENGTH || normalized.length > maxLength) {
      throw new SearchValidationError(
        maxLength === KEYWORD_MAX_LENGTH ? INVALID_KEYWORD_MESSAGE : "Search text is too short or too long",
      );
    }

    const catalog = await products.findAllForSearch();
    const productList = rankByKeyword(catalog, normalized);

    if (record && customerId) {
      await saveHistorySafely(() =>
        history.save({ customerId, searchType: "keyword", queryText: normalized }));
    }

    return {
      keyword: normalized,
      products: productList,
      message: productList.length ? null : NO_PRODUCTS_MESSAGE,
    };
  },

  // "Search by voice" sequence 6.1: submitQuery(text) -> searchByKeyword(text)
  async searchByVoice(recognizedText, { customerId = null, lang = "vi-VN" } = {}) {
    const result = await this.searchByKeyword(recognizedText, {
      customerId,
      record: false,
      maxLength: 500,
    });
    // 6.1.3 saveSearchHistory(customerId, text, audio). Audio is not stored.
    await saveHistorySafely(async () => {
      const searchId = customerId
        ? await history.save({ customerId, searchType: "voice", queryText: result.keyword })
        : null;
      await history.saveVoiceQuery({
        searchId,
        customerId,
        recognizedText: result.keyword,
        lang: String(lang || "vi-VN").slice(0, 10),
      });
    });
    return result;
  },

  // "Search by keyword" sequence 1.1-1.5: getRecentSearches + getTrendingKeywords
  async getSuggestedKeywords(customerId = null) {
    const [recent, trending] = await Promise.all([
      customerId ? history.getRecentSearches(customerId, 5) : Promise.resolve([]),
      history.getTrendingKeywords(8),
    ]);
    const seen = new Set(recent.map((item) => item.toLowerCase()));
    return {
      recent,
      trending: trending.filter((item) => !seen.has(item.toLowerCase())).slice(0, 8),
    };
  },
});

export const searchService = createSearchService();
