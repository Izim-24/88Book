import express from "express";
import multer from "multer";
import { authenticateToken, authorizeRole, identifyOptionalUser } from "../middleware/auth.js";
import {
  FILE_ERROR_MESSAGE,
  MAX_IMAGE_BYTES,
  searchBooksByImage,
  searchBooksByRecognizedText,
} from "../controllers/imageSearchController.js";
import { searchController } from "../controllers/searchController.js";
import { listCategories } from "../controllers/bookController.js";
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
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (_req, file, done) => {
    done(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype));
  },
});

router.get("/", getAllBooks);
router.get("/recommendations", getRecommendations);
router.post("/search-by-image/text", searchBooksByRecognizedText);
router.post("/search-by-image", (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      const tooLarge = error.code === "LIMIT_FILE_SIZE";
      return res.status(tooLarge ? 413 : 400).json({
        success: false,
        message: tooLarge ? FILE_ERROR_MESSAGE : "Invalid image upload.",
      });
    }
    next();
  });
}, identifyOptionalUser, searchBooksByImage);
router.post("/search-by-voice", identifyOptionalUser, searchController.voice);
router.get("/categories", listCategories);
router.get("/:id", getBookById);

router.post("/", authenticateToken, authorizeRole("admin"), createBook);
router.put("/:id", authenticateToken, authorizeRole("admin"), updateBook);
router.delete("/:id", authenticateToken, authorizeRole("admin"), deleteBook);

export default router;
