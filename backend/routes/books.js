import express from "express";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";
import {
  getAllBooks,
  getStaffPicks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/bookController.js";

const router = express.Router();

// Public routes
router.get("/", getAllBooks);
router.get("/recommendations", getStaffPicks);
router.get("/:id", getBookById);

// Protected routes (admins only)
router.post("/", authenticateToken, authorizeRole("admin"), createBook);
router.put("/:id", authenticateToken, authorizeRole("admin"), updateBook);
router.delete("/:id", authenticateToken, authorizeRole("admin"), deleteBook);

export default router;
