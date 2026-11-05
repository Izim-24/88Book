import express from "express";
import pool from "../config/database.js";
import { generateBookGuideReply, getAIConfig, validateChatInput } from "../services/bookGuide.js";

const router = express.Router();

router.get("/status", (_req, res) => {
  res.json({ success: true, configured: Boolean(getAIConfig()) });
});

router.post("/", async (req, res) => {
  const input = validateChatInput(req.body);
  if (!input) return res.status(400).json({ success: false, message: "Tin nhắn hoặc lịch sử trò chuyện không hợp lệ." });
  const config = getAIConfig();
  if (!config) return res.status(503).json({ success: false, message: "Book guide chưa được cấu hình AI_API_URL, AI_MODEL và AI_API_KEY trên server." });

  try {
    const result = await pool.query(`
      SELECT TOP 100 id, title, author, description, price, category, quantity, rating, image_url
      FROM books WHERE quantity > 0 ORDER BY id
    `);
    const answer = await generateBookGuideReply({ input, catalog: result.rows, config });
    res.json({ success: true, ...answer });
  } catch (error) {
    console.error("Book guide error:", error.message);
    res.status(error.status || 503).json({ success: false, message: error.status === 502
      ? "Dịch vụ AI không phản hồi hợp lệ. Vui lòng thử lại sau."
      : "Book guide tạm thời không khả dụng. Vui lòng thử lại sau." });
  }
});

export default router;
