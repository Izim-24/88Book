// SearchHistoryRepository (sequence diagrams): saveSearchHistory, recent and
// trending keywords. Maps SEARCH_HISTORIES -> book_search_history and its
// VOICE_SEARCH_QUERIES / IMAGE_SEARCH_QUERIES detail rows.
import pool from "../config/database.js";

export const SEARCH_TYPES = Object.freeze(["keyword", "voice", "image"]);
const HISTORY_PER_CUSTOMER = 40;

// Detail rows reference history with NO ACTION, so unlink them before deleting history.
const UNLINK_DETAILS = (where) => `
  UPDATE voice_search_queries SET search_id = NULL
  WHERE search_id IN (SELECT id FROM book_search_history WHERE ${where});
  UPDATE image_search_queries SET search_id = NULL
  WHERE search_id IN (SELECT id FROM book_search_history WHERE ${where});`;

export const searchHistoryRepository = {
  // Saves one search for a signed-in customer and returns its id.
  async save({ customerId, searchType, queryText, imageUrl = null }) {
    if (!customerId) return null;
    if (!SEARCH_TYPES.includes(searchType)) throw new Error(`Unknown search type: ${searchType}`);
    const result = await pool.query(
      `INSERT INTO book_search_history (user_id, query, search_type, image_url)
       OUTPUT INSERTED.id
       VALUES ($1, $2, $3, $4)`,
      [customerId, String(queryText || "").slice(0, 255), searchType, imageUrl],
    );
    await this.prune(customerId);
    return result.rows[0]?.id ?? null;
  },

  async saveVoiceQuery({ searchId, customerId, recognizedText, lang }) {
    await pool.query(
      `INSERT INTO voice_search_queries (search_id, user_id, recognized_text, lang, audio_path)
       VALUES ($1, $2, $3, $4, NULL)`,
      [searchId, customerId || null, recognizedText.slice(0, 500), lang],
    );
  },

  async saveImageQuery({ searchId, customerId, recognizedText, features }) {
    await pool.query(
      `INSERT INTO image_search_queries (search_id, user_id, image_path, recognized_text, extracted_features)
       VALUES ($1, $2, NULL, $3, $4)`,
      [searchId, customerId || null, (recognizedText || "").slice(0, 2000) || null, JSON.stringify(features)],
    );
  },

  // Keeps only each customer's most recent searches.
  async prune(customerId) {
    const stale = `user_id = $1 AND id NOT IN (
      SELECT TOP ${HISTORY_PER_CUSTOMER} id FROM book_search_history
      WHERE user_id = $1 ORDER BY created_at DESC, id DESC)`;
    await pool.query(
      `${UNLINK_DETAILS(stale)}
       DELETE FROM book_search_history WHERE ${stale};`,
      [customerId],
    );
  },

  // Called before a customer account is deleted (history cascades from users).
  async unlinkCustomerDetails(customerId, query = pool.query) {
    await query(UNLINK_DETAILS("user_id = $1"), [customerId]);
  },

  async getRecentSearches(customerId, limit = 5) {
    const result = await pool.query(
      `SELECT TOP (${Number(limit)}) query
       FROM book_search_history
       WHERE user_id = $1 AND search_type IN ('keyword', 'voice') AND LEN(query) >= 2
       GROUP BY query
       ORDER BY MAX(created_at) DESC`,
      [customerId],
    );
    return result.rows.map((row) => row.query);
  },

  async getTrendingKeywords(limit = 8, days = 30) {
    const result = await pool.query(
      `SELECT TOP (${Number(limit)}) LOWER(query) AS query, COUNT(*) AS uses
       FROM book_search_history
       WHERE created_at >= DATEADD(day, -${Number(days)}, GETDATE())
         AND search_type IN ('keyword', 'voice') AND LEN(query) BETWEEN 2 AND 50
       GROUP BY LOWER(query)
       ORDER BY COUNT(*) DESC, MAX(created_at) DESC`,
    );
    return result.rows.map((row) => row.query);
  },
};
