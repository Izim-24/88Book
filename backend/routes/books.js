import express from "express";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";
import {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/bookController.js";

const router = express.Router();

// Public routes
router.get("/", getAllBooks);
router.get("/:id", getBookById);

// Protected routes (sellers only)
router.post("/", authenticateToken, authorizeRole("seller"), createBook);
router.put("/:id", authenticateToken, authorizeRole("seller"), updateBook);
router.delete("/:id", authenticateToken, authorizeRole("seller"), deleteBook);

export default router;
