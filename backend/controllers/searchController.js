// SearchController (sequence diagrams): thin HTTP layer over SearchService.
import { searchService as defaultService, SearchValidationError } from "../services/searchService.js";

const customerIdOf = (req) => req.user?.userId || null;

const sendError = (res, error, fallback) => {
  if (error instanceof SearchValidationError) {
    return res.status(400).json({ success: false, message: error.message });
  }
  console.error(fallback, error);
  return res.status(503).json({ success: false, message: fallback });
};

export const createSearchController = (searchService = defaultService) => ({
  // GET /api/search/suggestions -> showSuggestedKeywords(recent + trending)
  suggestions: async (req, res) => {
    try {
      const keywords = await searchService.getSuggestedKeywords(customerIdOf(req));
      res.json({ success: true, ...keywords });
    } catch (error) {
      // Suggestions are optional; the search bar still works without them.
      console.warn("Search suggestions unavailable:", error.message);
      res.json({ success: true, recent: [], trending: [] });
    }
  },

  // POST /api/search/keyword { keyword, record? } -> submitKeyword(keyword)
  keyword: async (req, res) => {
    try {
      const result = await searchService.searchByKeyword(req.body?.keyword, {
        customerId: customerIdOf(req),
        record: req.body?.record !== false,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      sendError(res, error, "Search is unavailable.");
    }
  },

  // POST /api/books/search-by-voice { text, lang } -> submitQuery(text)
  voice: async (req, res) => {
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (!text) {
      return res.status(400).json({ success: false, message: "No recognized text provided." });
    }
    try {
      const result = await searchService.searchByVoice(text, {
        customerId: customerIdOf(req),
        lang: req.body?.lang,
      });
      res.json({
        success: true,
        recognizedText: result.keyword,
        results: result.products,
        message: result.message,
      });
    } catch (error) {
      sendError(res, error, "Voice search is unavailable.");
    }
  },
});

export const searchController = createSearchController();
