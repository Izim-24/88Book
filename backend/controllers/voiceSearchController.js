import pool from "../config/database.js";

// Nhận text đã được frontend chuyển từ giọng nói (Web Speech API),
// lưu lịch sử voice query rồi tìm sách theo từ khóa.
export const searchBooksByVoice = async (req, res) => {
  const text = String(req.body?.text || "").trim();
  if (!text) {
    return res.status(400).json({ success: false, message: "No recognized text provided." });
  }
  if (text.length > 500) {
    return res.status(400).json({ success: false, message: "Recognized text is too long." });
  }

  try {
    const userId = req.user?.userId || null;
    const lang = String(req.body?.lang || "vi-VN").slice(0, 10);
    const like = `%${text}%`;
    const result = await pool.query(
      `SELECT TOP 20 id, title, author, description, price, category, isbn, quantity, image_url, rating
       FROM books
       WHERE title LIKE $1 OR author LIKE $1 OR category LIKE $1`,
      [like]
    );

    // Search results should not fail when history storage is unavailable.
    try {
      await pool.query(
        "INSERT INTO voice_search_queries (user_id, recognized_text, lang) VALUES ($1, $2, $3)",
        [userId, text, lang]
      );
      if (userId) {
        await pool.query(
          "INSERT INTO book_search_history (user_id, query) VALUES ($1, $2)",
          [userId, text.slice(0, 255)]
        );
      }
    } catch (historyError) {
      console.warn("Voice search history was not saved:", historyError);
    }
    return res.json({ success: true, recognizedText: text, results: result.rows });
  } catch (error) {
    console.error("Voice search failed:", error);
    return res.status(500).json({ success: false, message: "Voice search is unavailable." });
  }
};
