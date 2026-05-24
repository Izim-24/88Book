import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRole } from "../middleware/auth.js";
import {
  createOrder,
  getUserOrders,
  getOrderDetails,
  cancelOrder,
  getAdminAcceptedOrders,
  approveOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

// Admin routes - MUST be before :orderId parameterized routes
router.get(
  "/admin/accepted",
  authenticateToken,
  authorizeRole("admin"),
  getAdminAcceptedOrders,
);

// User routes
router.post("/", authenticateToken, createOrder);
router.get("/", authenticateToken, getUserOrders);
router.get("/:orderId", authenticateToken, getOrderDetails);
router.put("/:orderId/cancel", authenticateToken, cancelOrder);
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
