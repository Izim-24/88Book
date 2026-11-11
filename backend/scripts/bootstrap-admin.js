import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "../config/database.js";

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const fullName = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "88Book Administrator";

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !password || password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
  console.error("Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD (at least 12 characters) in backend/.env");
  process.exitCode = 1;
} else {
  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      console.error("This email already exists. Use a new email or change the account through the application.");
      process.exitCode = 1;
    } else {
      const hash = await bcrypt.hash(password, 12);
      await pool.query(
        "INSERT INTO users (email, password, full_name, role) VALUES ($1, $2, $3, $4)",
        [email, hash, fullName, "admin"],
      );
      console.log(`Created administrator ${email}`);
    }
  } catch (error) {
    console.error("Administrator setup failed:", error.message);
    process.exitCode = 1;
  }
}

await pool.close();
