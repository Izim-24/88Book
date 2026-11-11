import express from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  createAdminAccount,
} from "../controllers/authController.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please wait 15 minutes and try again.",
});
const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Too many sign-up attempts. Please try again later.",
});

router.post("/register", registerLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);
router.get("/me", authenticateToken, getCurrentUser);
router.post(
  "/admin",
  authenticateToken,
  authorizeRole("admin"),
  createAdminAccount,
);

export default router;
