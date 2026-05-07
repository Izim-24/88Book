import express from "express";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";
import {
  getAdminUsers,
  updateUserRole,
  getAdminBooks,
  getAdminOrders,
  updateOrderStatus,
  getAdminStats,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(authenticateToken, authorizeRole("admin"));

router.get("/users", getAdminUsers);
router.put("/users/:userId/role", updateUserRole);
router.get("/books", getAdminBooks);
router.get("/orders", getAdminOrders);
router.get("/stats", getAdminStats);
router.put("/orders/:orderId/status", updateOrderStatus);

export default router;
