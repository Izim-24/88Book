import pool from "../../backend/config/database.js";

const migrate = async () => {
  try {
    console.log("Creating user_addresses and wishlists tables...");

    await pool.query(`
      IF OBJECT_ID('user_addresses', 'U') IS NULL
      BEGIN
        CREATE TABLE user_addresses (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT NOT NULL,
          label NVARCHAR(100),
          name NVARCHAR(255) NOT NULL,
          street NVARCHAR(MAX) NOT NULL,
          city NVARCHAR(100) NOT NULL,
          state NVARCHAR(100) NOT NULL,
          zip_code NVARCHAR(50) NOT NULL,
          country NVARCHAR(100) NOT NULL,
          is_default BIT DEFAULT 0,
          created_at DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      END
    `);
    console.log("✅ Table user_addresses created or already exists.");

    await pool.query(`
      IF OBJECT_ID('wishlists', 'U') IS NULL
      BEGIN
        CREATE TABLE wishlists (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT NOT NULL,
          book_id INT NOT NULL,
          created_at DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
          UNIQUE (user_id, book_id)
        );
      END
    `);
    console.log("✅ Table wishlists created or already exists.");

  } catch (error) {
    console.error("❌ Error running migration:", error);
  } finally {
    process.exit(0);
  }
};

migrate();
