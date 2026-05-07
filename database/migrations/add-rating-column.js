import pool from "../../backend/config/database.js";

const addRatingColumn = async () => {
  try {
    console.log("Adding rating column to books table...");

    // Check if column already exists
    const checkColumn = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_NAME = 'books' AND COLUMN_NAME = 'rating'`,
    );

    if (checkColumn.rows.length === 0) {
      // Add rating column if it doesn't exist
      await pool.query("ALTER TABLE books ADD rating DECIMAL(3, 1) DEFAULT 4.5");
      console.log("✅ Rating column added successfully!");
    } else {
      console.log("ℹ️ Rating column already exists!");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding rating column:", error);
    process.exit(1);
  }
};

addRatingColumn();
