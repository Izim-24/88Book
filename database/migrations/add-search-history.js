import pool from "../../backend/config/database.js";

const migrate = async () => {
  try {
    console.log("Creating book_search_history table...");

    await pool.query(`
      IF OBJECT_ID('book_search_history', 'U') IS NULL
      BEGIN
        CREATE TABLE book_search_history (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT NOT NULL,
          query NVARCHAR(255) NOT NULL,
          created_at DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      END

      IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'IX_book_search_history_user_created'
          AND object_id = OBJECT_ID('book_search_history')
      )
      BEGIN
        CREATE INDEX IX_book_search_history_user_created
        ON book_search_history(user_id, created_at DESC);
      END
    `);

    console.log("Search history table is ready.");
  } catch (error) {
    console.error("Error running search history migration:", error);
  } finally {
    process.exit(0);
  }
};

migrate();
