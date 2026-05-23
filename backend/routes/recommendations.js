import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  getAlsoBoughtForBook,
  getPersonalizedRecommendations,
  recordSearch,
} from "../controllers/recommendationController.js";

const router = express.Router();

router.get("/personalized", authenticateToken, getPersonalizedRecommendations);
router.post("/search-history", authenticateToken, recordSearch);
router.get("/books/:bookId/also-bought", getAlsoBoughtForBook);

export default router;
