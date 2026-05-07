import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRole } from "../middleware/auth.js";
import {
  createOrder,
  getUserOrders,
  getOrderDetails,
  cancelOrder,
  getAdminPendingOrders,
  approveOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

// User routes
router.post("/", authenticateToken, createOrder);
router.get("/", authenticateToken, getUserOrders);
router.get("/:orderId", authenticateToken, getOrderDetails);
router.put("/:orderId/cancel", authenticateToken, cancelOrder);

// Admin routes
router.get(
  "/admin/pending",
  authenticateToken,
  authorizeRole("admin"),
  getAdminPendingOrders,
);
router.put(
  "/:orderId/approve",
  authenticateToken,
  authorizeRole("admin"),
  approveOrder,
);
router.put(
  "/:orderId/status",
  authenticateToken,
  authorizeRole("admin"),
  updateOrderStatus,
);

export default router;
