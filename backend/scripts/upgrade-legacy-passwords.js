import bcrypt from "bcryptjs";
import pool from "../config/database.js";

try {
  const result = await pool.query(
    "SELECT id, password FROM users WHERE LEFT(password, 2) <> CHAR(36) + '2'",
  );
  for (const user of result.rows) {
    const hash = await bcrypt.hash(user.password, 12);
    await pool.query(
      "UPDATE users SET password = $1, updated_at = GETDATE() WHERE id = $2 AND password = $3",
      [hash, user.id, user.password],
    );
  }
  console.log(`Upgraded ${result.rows.length} legacy password hashes`);
} catch (error) {
  console.error("Password upgrade failed:", error.message);
  process.exitCode = 1;
}

await pool.close();
