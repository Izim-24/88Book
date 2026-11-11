-- SQL Server / SSMS initialization script for 88Book
-- Run this script in SSMS to create database and tables.

IF DB_ID(N'book_store') IS NULL
BEGIN
    CREATE DATABASE book_store;
END;
GO

USE book_store;
GO

IF OBJECT_ID(N'dbo.users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL,
        full_name NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) DEFAULT N'buyer',
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
END;
GO

IF OBJECT_ID(N'dbo.books', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.books (
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
        rating DECIMAL(3, 1) DEFAULT 4.5,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_books_admin FOREIGN KEY (admin_id) REFERENCES dbo.users(id)
    );
END;
GO

IF OBJECT_ID(N'dbo.cart_items', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.cart_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        book_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_cart_items_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
        CONSTRAINT FK_cart_items_book FOREIGN KEY (book_id) REFERENCES dbo.books(id)
    );
END;
GO

IF OBJECT_ID(N'dbo.orders', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.orders (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status NVARCHAR(50) DEFAULT N'accepted',
        shipping_address NVARCHAR(MAX) NOT NULL,
        payment_method NVARCHAR(100),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_orders_user FOREIGN KEY (user_id) REFERENCES dbo.users(id)
    );
END;
GO

IF OBJECT_ID(N'dbo.orders', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'CK_orders_status'
          AND parent_object_id = OBJECT_ID(N'dbo.orders')
    )
    BEGIN
        ALTER TABLE dbo.orders DROP CONSTRAINT CK_orders_status;
    END;

    DECLARE @ordersStatusDefault NVARCHAR(255);
    SELECT TOP 1 @ordersStatusDefault = dc.name
    FROM sys.default_constraints dc
    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'dbo.orders')
      AND c.name = N'status';

    IF @ordersStatusDefault IS NOT NULL
    BEGIN
        DECLARE @dropOrdersStatusDefaultSql NVARCHAR(MAX);
        SET @dropOrdersStatusDefaultSql = N'ALTER TABLE dbo.orders DROP CONSTRAINT ' + QUOTENAME(@ordersStatusDefault);
        EXEC sp_executesql @dropOrdersStatusDefaultSql;
    END;

    ALTER TABLE dbo.orders
    ADD CONSTRAINT DF_orders_status DEFAULT N'accepted' FOR status;

    UPDATE dbo.orders SET status = N'accepted', updated_at = GETDATE() WHERE status IN (N'approved', N'pending', N'processing');
    UPDATE dbo.orders SET status = N'shipped', updated_at = GETDATE() WHERE status = N'shipping';
    UPDATE dbo.orders
    SET status = N'accepted', updated_at = GETDATE()
    WHERE status IS NULL OR status NOT IN (N'accepted', N'shipped', N'delivered', N'cancelled');

    ALTER TABLE dbo.orders
    ADD CONSTRAINT CK_orders_status
    CHECK (status IN (N'accepted', N'shipped', N'delivered', N'cancelled'));
END;
GO

IF OBJECT_ID(N'dbo.order_items', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.order_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        order_id INT NOT NULL,
        book_id INT NOT NULL,
        admin_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_order_items_order FOREIGN KEY (order_id) REFERENCES dbo.orders(id),
        CONSTRAINT FK_order_items_book FOREIGN KEY (book_id) REFERENCES dbo.books(id),
        CONSTRAINT FK_order_items_admin FOREIGN KEY (admin_id) REFERENCES dbo.users(id)
    );
END;
GO

IF OBJECT_ID(N'dbo.user_addresses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_addresses (
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
        CONSTRAINT FK_user_addresses_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
    );
END;
GO

IF OBJECT_ID(N'dbo.wishlists', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.wishlists (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        book_id INT NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_wishlists_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
        CONSTRAINT FK_wishlists_book FOREIGN KEY (book_id) REFERENCES dbo.books(id) ON DELETE CASCADE,
        CONSTRAINT UQ_wishlists_user_book UNIQUE (user_id, book_id)
    );
END;
GO

IF OBJECT_ID(N'dbo.recommendations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.recommendations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        book_id INT NOT NULL UNIQUE,
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_recommendations_book FOREIGN KEY (book_id) REFERENCES dbo.books(id) ON DELETE CASCADE
    );
END;
GO

IF OBJECT_ID(N'dbo.book_search_history', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.book_search_history (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        query NVARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_book_search_history_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
    );
END;
GO

IF OBJECT_ID(N'dbo.voice_search_queries', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.voice_search_queries (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NULL,
        recognized_text NVARCHAR(500) NOT NULL,
        lang NVARCHAR(10) NOT NULL DEFAULT N'vi-VN',
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_voice_search_queries_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE SET NULL
    );
END;
GO

-- Protect prices, stock and order quantities for both new and upgraded databases.
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_books_price' AND parent_object_id = OBJECT_ID(N'dbo.books'))
    ALTER TABLE dbo.books WITH CHECK ADD CONSTRAINT CK_books_price CHECK (price >= 0);
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_books_quantity' AND parent_object_id = OBJECT_ID(N'dbo.books'))
    ALTER TABLE dbo.books WITH CHECK ADD CONSTRAINT CK_books_quantity CHECK (quantity >= 0);
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_cart_items_quantity' AND parent_object_id = OBJECT_ID(N'dbo.cart_items'))
    ALTER TABLE dbo.cart_items WITH CHECK ADD CONSTRAINT CK_cart_items_quantity CHECK (quantity > 0);
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_order_items_quantity' AND parent_object_id = OBJECT_ID(N'dbo.order_items'))
    ALTER TABLE dbo.order_items WITH CHECK ADD CONSTRAINT CK_order_items_quantity CHECK (quantity > 0);
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_orders_total_amount' AND parent_object_id = OBJECT_ID(N'dbo.orders'))
    ALTER TABLE dbo.orders WITH CHECK ADD CONSTRAINT CK_orders_total_amount CHECK (total_amount >= 0);
GO

IF OBJECT_ID(N'dbo.book_search_history', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_book_search_history_user_created'
         AND object_id = OBJECT_ID(N'dbo.book_search_history')
   )
BEGIN
    CREATE INDEX IX_book_search_history_user_created
    ON dbo.book_search_history(user_id, created_at DESC);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_cart_items_user_book'
      AND object_id = OBJECT_ID(N'dbo.cart_items')
)
    CREATE INDEX IX_cart_items_user_book ON dbo.cart_items(user_id, book_id);
GO

-- Migrate older local databases that were created before admin-owned books.
IF OBJECT_ID(N'dbo.books', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.books', N'admin_id') IS NULL
BEGIN
    ALTER TABLE dbo.books ADD admin_id INT NULL;
END;
GO

IF OBJECT_ID(N'dbo.books', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.books', N'admin_id') IS NOT NULL
   AND COL_LENGTH(N'dbo.books', N'seller_id') IS NOT NULL
BEGIN
    EXEC(N'UPDATE dbo.books SET admin_id = seller_id WHERE admin_id IS NULL');
END;
GO

DECLARE @booksLegacyFk NVARCHAR(255);
SELECT TOP 1 @booksLegacyFk = fk.name
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
WHERE fk.parent_object_id = OBJECT_ID(N'dbo.books') AND c.name = N'seller_id';

IF @booksLegacyFk IS NOT NULL
BEGIN
    DECLARE @dropBooksLegacyFkSql NVARCHAR(MAX);
    SET @dropBooksLegacyFkSql = N'ALTER TABLE dbo.books DROP CONSTRAINT ' + QUOTENAME(@booksLegacyFk);
    EXEC sp_executesql @dropBooksLegacyFkSql;
END;
GO

IF OBJECT_ID(N'dbo.books', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.books', N'seller_id') IS NOT NULL
BEGIN
    ALTER TABLE dbo.books DROP COLUMN seller_id;
END;
GO

IF OBJECT_ID(N'dbo.order_items', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.order_items', N'admin_id') IS NULL
BEGIN
    ALTER TABLE dbo.order_items ADD admin_id INT NULL;
END;
GO

IF OBJECT_ID(N'dbo.order_items', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.order_items', N'admin_id') IS NOT NULL
   AND COL_LENGTH(N'dbo.order_items', N'seller_id') IS NOT NULL
BEGIN
    EXEC(N'UPDATE dbo.order_items SET admin_id = seller_id WHERE admin_id IS NULL');
END;
GO

DECLARE @itemsLegacyFk NVARCHAR(255);
SELECT TOP 1 @itemsLegacyFk = fk.name
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
WHERE fk.parent_object_id = OBJECT_ID(N'dbo.order_items') AND c.name = N'seller_id';

IF @itemsLegacyFk IS NOT NULL
BEGIN
    DECLARE @dropItemsLegacyFkSql NVARCHAR(MAX);
    SET @dropItemsLegacyFkSql = N'ALTER TABLE dbo.order_items DROP CONSTRAINT ' + QUOTENAME(@itemsLegacyFk);
    EXEC sp_executesql @dropItemsLegacyFkSql;
END;
GO

IF OBJECT_ID(N'dbo.order_items', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.order_items', N'seller_id') IS NOT NULL
BEGIN
    ALTER TABLE dbo.order_items DROP COLUMN seller_id;
END;
GO

UPDATE dbo.users SET role = N'buyer' WHERE role NOT IN (N'admin', N'buyer');
GO

-- ------------------------------------------------------------
-- Seed data (safe to rerun)
-- ------------------------------------------------------------
-- Create the first admin with `npm run bootstrap-admin` in backend/.
-- Catalog seed rows below are added only when an admin exists.

DECLARE @seedAdminId INT;
SELECT TOP 1 @seedAdminId = id
FROM dbo.users
WHERE role = N'admin'
ORDER BY id;

IF @seedAdminId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.books WHERE isbn = N'9780735211292')
    BEGIN
        INSERT INTO dbo.books (title, author, description, price, category, isbn, quantity, image_url, admin_id, rating)
        VALUES (N'Atomic Habits', N'James Clear', N'Build good habits and break bad ones.', 129000, N'Self-Help', N'9780735211292', 24, N'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400', @seedAdminId, 4.8);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.books WHERE isbn = N'9780062315007')
    BEGIN
        INSERT INTO dbo.books (title, author, description, price, category, isbn, quantity, image_url, admin_id, rating)
        VALUES (N'The Alchemist', N'Paulo Coelho', N'A timeless novel about purpose and dreams.', 105000, N'Fiction', N'9780062315007', 18, N'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', @seedAdminId, 4.6);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.books WHERE isbn = N'9780547928227')
    BEGIN
        INSERT INTO dbo.books (title, author, description, price, category, isbn, quantity, image_url, admin_id, rating)
        VALUES (N'The Hobbit', N'J.R.R. Tolkien', N'An epic fantasy adventure in Middle-earth.', 119000, N'Fantasy', N'9780547928227', 15, N'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400', @seedAdminId, 4.7);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.books WHERE isbn = N'9780307476463')
    BEGIN
        INSERT INTO dbo.books (title, author, description, price, category, isbn, quantity, image_url, admin_id, rating)
        VALUES (N'Thinking, Fast and Slow', N'Daniel Kahneman', N'Insights into human judgment and decision making.', 142000, N'Science', N'9780307476463', 20, N'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400', @seedAdminId, 4.5);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.books WHERE isbn = N'9780141034355')
    BEGIN
        INSERT INTO dbo.books (title, author, description, price, category, isbn, quantity, image_url, admin_id, rating)
        VALUES (N'Sherlock Holmes', N'Arthur Conan Doyle', N'Classic detective mysteries.', 99000, N'Mystery', N'9780141034355', 16, N'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=400', @seedAdminId, 4.6);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.books WHERE isbn = N'9781501128035')
    BEGIN
        INSERT INTO dbo.books (title, author, description, price, category, isbn, quantity, image_url, admin_id, rating)
        VALUES (N'It Ends with Us', N'Colleen Hoover', N'A contemporary romance bestseller.', 134000, N'Romance', N'9781501128035', 22, N'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400', @seedAdminId, 4.4);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.books WHERE isbn = N'9780812981605')
    BEGIN
        INSERT INTO dbo.books (title, author, description, price, category, isbn, quantity, image_url, admin_id, rating)
        VALUES (N'Steve Jobs', N'Walter Isaacson', N'Biography of Steve Jobs.', 150000, N'Biography', N'9780812981605', 12, N'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400', @seedAdminId, 4.5);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.books WHERE isbn = N'9781452162560')
    BEGIN
        INSERT INTO dbo.books (title, author, description, price, category, isbn, quantity, image_url, admin_id, rating)
        VALUES (N'Salt, Fat, Acid, Heat', N'Samin Nosrat', N'A practical guide to better cooking.', 187000, N'Cooking', N'9781452162560', 10, N'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400', @seedAdminId, 4.7);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.books WHERE isbn = N'9780140449266')
    BEGIN
        INSERT INTO dbo.books (title, author, description, price, category, isbn, quantity, image_url, admin_id, rating)
        VALUES (N'The Odyssey', N'Homer', N'A cornerstone of classic literature.', 87000, N'Classic', N'9780140449266', 14, N'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400', @seedAdminId, 4.3);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.books WHERE isbn = N'9780062457714')
    BEGIN
        INSERT INTO dbo.books (title, author, description, price, category, isbn, quantity, image_url, admin_id, rating)
        VALUES (N'Deep Work', N'Cal Newport', N'Rules for focused success in a distracted world.', 136000, N'Self-Help', N'9780062457714', 19, N'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=400', @seedAdminId, 4.6);
    END;
END;
GO

-- Update only legacy sample rows whose prices still have their original USD figures.
UPDATE b SET price = sample.vnd_price
FROM dbo.books b
JOIN (VALUES
    (N'9780735211292', 12.99, 129000), (N'9780062315007', 10.50, 105000),
    (N'9780547928227', 11.99, 119000), (N'9780307476463', 14.20, 142000),
    (N'9780141034355', 9.90, 99000), (N'9781501128035', 13.40, 134000),
    (N'9780812981605', 15.00, 150000), (N'9781452162560', 18.75, 187000),
    (N'9780140449266', 8.75, 87000), (N'9780062457714', 13.60, 136000)
) AS sample(isbn, old_price, vnd_price)
    ON b.isbn = sample.isbn AND b.price = sample.old_price;
GO

-- ------------------------------------------------------------
-- Design model alignment (keep in sync with database/migrations/design-alignment.js)
-- ------------------------------------------------------------
IF OBJECT_ID('categories', 'U') IS NULL
   CREATE TABLE categories (
     id INT IDENTITY(1,1) PRIMARY KEY,
     name NVARCHAR(100) NOT NULL CONSTRAINT UQ_categories_name UNIQUE,
     created_at DATETIME DEFAULT GETDATE()
   );
GO
IF COL_LENGTH('books', 'category_id') IS NULL
   ALTER TABLE books ADD category_id INT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_books_category')
   ALTER TABLE books ADD CONSTRAINT FK_books_category FOREIGN KEY (category_id) REFERENCES categories(id);
GO
INSERT INTO categories (name)
   SELECT DISTINCT LTRIM(RTRIM(b.category))
   FROM books b
   WHERE b.category IS NOT NULL AND LTRIM(RTRIM(b.category)) <> ''
     AND NOT EXISTS (SELECT 1 FROM categories c WHERE c.name = LTRIM(RTRIM(b.category)));
GO
UPDATE b SET category_id = c.id
   FROM books b JOIN categories c ON c.name = LTRIM(RTRIM(b.category))
   WHERE b.category_id IS NULL OR b.category_id <> c.id;
GO
IF COL_LENGTH('users', 'phone') IS NULL ALTER TABLE users ADD phone NVARCHAR(30) NULL;
GO
IF COL_LENGTH('users', 'address') IS NULL ALTER TABLE users ADD address NVARCHAR(500) NULL;
GO
IF COL_LENGTH('book_search_history', 'search_type') IS NULL
   ALTER TABLE book_search_history ADD search_type NVARCHAR(10) NOT NULL
     CONSTRAINT DF_book_search_history_type DEFAULT 'keyword';
GO
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_book_search_history_type')
   ALTER TABLE book_search_history ADD CONSTRAINT CK_book_search_history_type
     CHECK (search_type IN ('keyword', 'voice', 'image'));
GO
IF COL_LENGTH('book_search_history', 'image_url') IS NULL
   ALTER TABLE book_search_history ADD image_url NVARCHAR(500) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_book_search_history_created'
                  AND object_id = OBJECT_ID('book_search_history'))
   CREATE INDEX IX_book_search_history_created ON book_search_history(created_at DESC) INCLUDE (query, search_type);
GO
IF COL_LENGTH('voice_search_queries', 'search_id') IS NULL
   ALTER TABLE voice_search_queries ADD search_id INT NULL;
GO
IF COL_LENGTH('voice_search_queries', 'audio_path') IS NULL
   ALTER TABLE voice_search_queries ADD audio_path NVARCHAR(500) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_voice_search_queries_search')
   ALTER TABLE voice_search_queries ADD CONSTRAINT FK_voice_search_queries_search
     FOREIGN KEY (search_id) REFERENCES book_search_history(id);
GO
IF OBJECT_ID('image_search_queries', 'U') IS NULL
   CREATE TABLE image_search_queries (
     id INT IDENTITY(1,1) PRIMARY KEY,
     search_id INT NULL,
     user_id INT NULL,
     image_path NVARCHAR(500) NULL,
     recognized_text NVARCHAR(2000) NULL,
     extracted_features NVARCHAR(MAX) NULL,
     created_at DATETIME DEFAULT GETDATE(),
     CONSTRAINT FK_image_search_queries_search FOREIGN KEY (search_id) REFERENCES book_search_history(id),
     CONSTRAINT FK_image_search_queries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
   );
GO
