import express from "express";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";
import {
  getSellerBooks,
  getSellerOrders,
  updateOrderStatus,
  getSellerStats,
} from "../controllers/sellerController.js";

const router = express.Router();

// All seller routes require seller role
router.use(authenticateToken, authorizeRole("seller"));

router.get("/books", getSellerBooks);
router.get("/orders", getSellerOrders);
router.get("/stats", getSellerStats);
router.put("/orders/:orderId/status", updateOrderStatus);

export default router;
