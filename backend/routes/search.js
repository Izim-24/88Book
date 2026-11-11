import express from "express";
import { identifyOptionalUser } from "../middleware/auth.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import { searchController } from "../controllers/searchController.js";

const router = express.Router();

const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: "Too many searches. Please slow down.",
});

// Guests can search; signed-in customers also get recent keywords and history.
router.get("/suggestions", identifyOptionalUser, searchController.suggestions);
router.post("/keyword", searchLimiter, identifyOptionalUser, searchController.keyword);

export default router;
