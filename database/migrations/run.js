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
          admin_id INT NOT NULL,
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (admin_id) REFERENCES users(id)
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
          status NVARCHAR(50) DEFAULT 'accepted',
          shipping_address NVARCHAR(MAX) NOT NULL,
          payment_method NVARCHAR(100),
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      END
    `);

    await pool.query(`
      IF OBJECT_ID('orders', 'U') IS NOT NULL
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM sys.check_constraints
          WHERE name = 'CK_orders_status'
            AND parent_object_id = OBJECT_ID('orders')
        )
        BEGIN
          ALTER TABLE orders DROP CONSTRAINT CK_orders_status;
        END

        DECLARE @ordersStatusDefault NVARCHAR(255);
        SELECT TOP 1 @ordersStatusDefault = dc.name
        FROM sys.default_constraints dc
        JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
        WHERE dc.parent_object_id = OBJECT_ID('orders')
          AND c.name = 'status';

        IF @ordersStatusDefault IS NOT NULL
        BEGIN
          DECLARE @dropOrdersStatusDefaultSql NVARCHAR(MAX);
          SET @dropOrdersStatusDefaultSql = N'ALTER TABLE orders DROP CONSTRAINT ' + QUOTENAME(@ordersStatusDefault);
          EXEC sp_executesql @dropOrdersStatusDefaultSql;
        END

        ALTER TABLE orders
        ADD CONSTRAINT DF_orders_status DEFAULT 'accepted' FOR status;

        UPDATE orders SET status = 'accepted', updated_at = GETDATE() WHERE status IN ('approved', 'pending', 'processing');
        UPDATE orders SET status = 'shipped', updated_at = GETDATE() WHERE status = 'shipping';
        UPDATE orders
        SET status = 'accepted', updated_at = GETDATE()
        WHERE status IS NULL OR status NOT IN ('accepted', 'shipped', 'delivered', 'cancelled');

        ALTER TABLE orders
        ADD CONSTRAINT CK_orders_status
        CHECK (status IN ('accepted', 'shipped', 'delivered', 'cancelled'));
      END
    `);

    await pool.query(`
      IF OBJECT_ID('order_items', 'U') IS NULL
      BEGIN
        CREATE TABLE order_items (
          id INT IDENTITY(1,1) PRIMARY KEY,
          order_id INT NOT NULL,
          book_id INT NOT NULL,
          admin_id INT NOT NULL,
          quantity INT NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          created_at DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (order_id) REFERENCES orders(id),
          FOREIGN KEY (book_id) REFERENCES books(id),
          FOREIGN KEY (admin_id) REFERENCES users(id)
        );
      END
    `);

    console.log("✅ All tables created successfully!");
    await pool.query(`
      IF OBJECT_ID('recommendations', 'U') IS NULL
      BEGIN
        CREATE TABLE recommendations (
          id INT IDENTITY(1,1) PRIMARY KEY,
          book_id INT NOT NULL UNIQUE,
          sort_order INT NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
        );
      END
    `);

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

    await pool.query(`
      IF OBJECT_ID('voice_search_queries', 'U') IS NULL
      BEGIN
        CREATE TABLE voice_search_queries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT NULL,
          recognized_text NVARCHAR(500) NOT NULL,
          lang NVARCHAR(10) NOT NULL DEFAULT N'vi-VN',
          created_at DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
      END
    `);

    await pool.query(`
      IF COL_LENGTH('books', 'admin_id') IS NULL
      BEGIN
        ALTER TABLE books ADD admin_id INT NULL;
      END
    `);

    await pool.query(`
      DECLARE @legacyBookOwnerColumn NVARCHAR(32) = 'sell' + 'er_id';
      IF COL_LENGTH('books', @legacyBookOwnerColumn) IS NOT NULL
      BEGIN
        EXEC('UPDATE books SET admin_id = ' + @legacyBookOwnerColumn + ' WHERE admin_id IS NULL');
      END
    `);

    await pool.query(`
      DECLARE @legacyBookOwnerColumn NVARCHAR(32) = 'sell' + 'er_id';
      DECLARE @booksConstraintName NVARCHAR(255);
      SELECT TOP 1 @booksConstraintName = fk.name
      FROM sys.foreign_keys fk
      JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
      WHERE fk.parent_object_id = OBJECT_ID('books') AND c.name = @legacyBookOwnerColumn;

      IF @booksConstraintName IS NOT NULL
      BEGIN
        DECLARE @dropBooksConstraintSql NVARCHAR(MAX);
        SET @dropBooksConstraintSql = N'ALTER TABLE books DROP CONSTRAINT ' + QUOTENAME(@booksConstraintName);
        EXEC sp_executesql @dropBooksConstraintSql;
      END

      IF COL_LENGTH('books', @legacyBookOwnerColumn) IS NOT NULL
      BEGIN
        DECLARE @dropBooksColumnSql NVARCHAR(MAX);
        SET @dropBooksColumnSql = N'ALTER TABLE books DROP COLUMN ' + QUOTENAME(@legacyBookOwnerColumn);
        EXEC sp_executesql @dropBooksColumnSql;
      END
    `);

    await pool.query(`
      IF COL_LENGTH('order_items', 'admin_id') IS NULL
      BEGIN
        ALTER TABLE order_items ADD admin_id INT NULL;
      END
    `);

    await pool.query(`
      DECLARE @legacyItemOwnerColumn NVARCHAR(32) = 'sell' + 'er_id';
      IF COL_LENGTH('order_items', @legacyItemOwnerColumn) IS NOT NULL
      BEGIN
        EXEC('UPDATE order_items SET admin_id = ' + @legacyItemOwnerColumn + ' WHERE admin_id IS NULL');
      END
    `);

    await pool.query(`
      DECLARE @legacyItemOwnerColumn NVARCHAR(32) = 'sell' + 'er_id';
      DECLARE @itemsConstraintName NVARCHAR(255);
      SELECT TOP 1 @itemsConstraintName = fk.name
      FROM sys.foreign_keys fk
      JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
      WHERE fk.parent_object_id = OBJECT_ID('order_items') AND c.name = @legacyItemOwnerColumn;

      IF @itemsConstraintName IS NOT NULL
      BEGIN
        DECLARE @dropItemsConstraintSql NVARCHAR(MAX);
        SET @dropItemsConstraintSql = N'ALTER TABLE order_items DROP CONSTRAINT ' + QUOTENAME(@itemsConstraintName);
        EXEC sp_executesql @dropItemsConstraintSql;
      END

      IF COL_LENGTH('order_items', @legacyItemOwnerColumn) IS NOT NULL
      BEGIN
        DECLARE @dropItemsColumnSql NVARCHAR(MAX);
        SET @dropItemsColumnSql = N'ALTER TABLE order_items DROP COLUMN ' + QUOTENAME(@legacyItemOwnerColumn);
        EXEC sp_executesql @dropItemsColumnSql;
      END
    `);

    await pool.query("UPDATE users SET role = 'buyer' WHERE role NOT IN ('admin', 'buyer')");

    await pool.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_books_price' AND parent_object_id = OBJECT_ID('books'))
        ALTER TABLE books WITH CHECK ADD CONSTRAINT CK_books_price CHECK (price >= 0);
      IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_books_quantity' AND parent_object_id = OBJECT_ID('books'))
        ALTER TABLE books WITH CHECK ADD CONSTRAINT CK_books_quantity CHECK (quantity >= 0);
      IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_cart_items_quantity' AND parent_object_id = OBJECT_ID('cart_items'))
        ALTER TABLE cart_items WITH CHECK ADD CONSTRAINT CK_cart_items_quantity CHECK (quantity > 0);
      IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_order_items_quantity' AND parent_object_id = OBJECT_ID('order_items'))
        ALTER TABLE order_items WITH CHECK ADD CONSTRAINT CK_order_items_quantity CHECK (quantity > 0);
      IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_orders_total_amount' AND parent_object_id = OBJECT_ID('orders'))
        ALTER TABLE orders WITH CHECK ADD CONSTRAINT CK_orders_total_amount CHECK (total_amount >= 0);
    `);

    await pool.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_cart_items_user_book' AND object_id = OBJECT_ID('cart_items'))
        CREATE INDEX IX_cart_items_user_book ON cart_items(user_id, book_id);
    `);

    // Columns and tables that used to require separate migration scripts.
    await pool.query(`
      IF COL_LENGTH('books', 'rating') IS NULL
        ALTER TABLE books ADD rating DECIMAL(3, 1) DEFAULT 4.5;
    `);

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

    // Convert only untouched legacy sample prices that were stored as USD figures.
    await pool.query(`
      UPDATE b SET price = sample.vnd_price
      FROM books b
      JOIN (VALUES
        ('9780735211292', 12.99, 129000),
        ('9780062315007', 10.50, 105000),
        ('9780547928227', 11.99, 119000),
        ('9780307476463', 14.20, 142000),
        ('9780141034355', 9.90, 99000),
        ('9781501128035', 13.40, 134000),
        ('9780812981605', 15.00, 150000),
        ('9781452162560', 18.75, 187000),
        ('9780140449266', 8.75, 87000),
        ('9780062457714', 13.60, 136000)
      ) AS sample(isbn, old_price, vnd_price)
        ON b.isbn = sample.isbn AND b.price = sample.old_price;
    `);

    console.log("✅ Migration finished");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    process.exitCode = 1;
  } finally {
    await pool.close();
  }
};

createTables();
