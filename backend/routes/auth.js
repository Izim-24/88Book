import express from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  createAdminAccount,
} from "../controllers/authController.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authenticateToken, getCurrentUser);
router.post(
  "/admin",
  authenticateToken,
  authorizeRole("admin"),
  createAdminAccount,
);

export default router;
