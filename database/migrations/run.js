import pool from "../../backend/config/database.js";

const createTables = async () => {
  try {
    console.log("Creating database tables...");

    await pool.query(`
      IF OBJECT_ID('users', 'U') IS NULL
      BEGIN
        CREATE TABLE users (
          id INT IDENTITY(1,1) PRIMARY KEY,
          email NVARCHAR(255) UNIQUE NOT NULL,
          password NVARCHAR(255) NOT NULL,
          full_name NVARCHAR(255) NOT NULL,
          role NVARCHAR(50) DEFAULT 'buyer',
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE()
        );
      END
    `);

    await pool.query(`
      IF OBJECT_ID('books', 'U') IS NULL
      BEGIN
        CREATE TABLE books (
          id INT IDENTITY(1,1) PRIMARY KEY,
          title NVARCHAR(255) NOT NULL,
          author NVARCHAR(255) NOT NULL,
          description NVARCHAR(MAX),
          price DECIMAL(10, 2) NOT NULL,
          category NVARCHAR(100),
          isbn NVARCHAR(20),
          quantity INT DEFAULT 0,
          image_url NVARCHAR(500),
          seller_id INT NOT NULL,
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (seller_id) REFERENCES users(id)
        );
      END
    `);

    await pool.query(`
      IF OBJECT_ID('cart_items', 'U') IS NULL
      BEGIN
        CREATE TABLE cart_items (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT NOT NULL,
          book_id INT NOT NULL,
          quantity INT NOT NULL DEFAULT 1,
          created_at DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (book_id) REFERENCES books(id)
        );
      END
    `);

    await pool.query(`
      IF OBJECT_ID('orders', 'U') IS NULL
      BEGIN
        CREATE TABLE orders (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT NOT NULL,
          total_amount DECIMAL(10, 2) NOT NULL,
          status NVARCHAR(50) DEFAULT 'pending',
          shipping_address NVARCHAR(MAX) NOT NULL,
          payment_method NVARCHAR(100),
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      END
    `);

    await pool.query(`
      IF OBJECT_ID('order_items', 'U') IS NULL
      BEGIN
        CREATE TABLE order_items (
          id INT IDENTITY(1,1) PRIMARY KEY,
          order_id INT NOT NULL,
          book_id INT NOT NULL,
          seller_id INT NOT NULL,
          quantity INT NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          created_at DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (order_id) REFERENCES orders(id),
          FOREIGN KEY (book_id) REFERENCES books(id),
          FOREIGN KEY (seller_id) REFERENCES users(id)
        );
      END
    `);

    console.log("✅ All tables created successfully!");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    process.exit(1);
  }
};

createTables();
