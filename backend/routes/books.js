import express from "express";
import multer from "multer";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";
import { searchBooksByImage } from "../controllers/imageSearchController.js";
import {
  getAllBooks,
  getRecommendations,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/bookController.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, done) => {
    done(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype));
  },
});

router.get("/", getAllBooks);
router.get("/recommendations", getRecommendations);
router.post("/search-by-image", (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      const tooLarge = error.code === "LIMIT_FILE_SIZE";
      return res.status(tooLarge ? 413 : 400).json({
        success: false,
        message: tooLarge ? "Image must be 5 MB or smaller." : "Invalid image upload.",
      });
    }
    next();
  });
}, searchBooksByImage);
router.get("/:id", getBookById);

router.post("/", authenticateToken, authorizeRole("admin"), createBook);
router.put("/:id", authenticateToken, authorizeRole("admin"), updateBook);
router.delete("/:id", authenticateToken, authorizeRole("admin"), deleteBook);

export default router;
