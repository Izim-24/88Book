import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getPublicProfile,
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getUserWishlist,
  addToWishlist,
  removeFromWishlist
} from "../controllers/userController.js";

const router = express.Router();

// Protected routes (require authentication)
router.get("/profile", authenticateToken, getUserProfile);
router.put("/profile", authenticateToken, updateUserProfile);
router.put("/change-password", authenticateToken, changePassword);

// Address routes
router.get("/addresses", authenticateToken, getUserAddresses);
router.post("/addresses", authenticateToken, addAddress);
router.put("/addresses/:id", authenticateToken, updateAddress);
router.delete("/addresses/:id", authenticateToken, deleteAddress);

// Wishlist routes
router.get("/wishlist", authenticateToken, getUserWishlist);
router.post("/wishlist", authenticateToken, addToWishlist);
router.delete("/wishlist/:bookId", authenticateToken, removeFromWishlist);

// Public route to get user info
router.get("/public/:userId", getPublicProfile);

export default router;
