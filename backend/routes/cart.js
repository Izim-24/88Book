import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";

const router = express.Router();

router.post("/", authenticateToken, addToCart);
router.get("/", authenticateToken, getCart);
router.put("/:cartItemId", authenticateToken, updateCartItem);
router.delete("/:cartItemId", authenticateToken, removeFromCart);
router.delete("/", authenticateToken, clearCart);

export default router;
