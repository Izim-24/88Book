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
        seller_id INT NOT NULL,
        rating DECIMAL(3, 1) DEFAULT 4.5,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_books_seller FOREIGN KEY (seller_id) REFERENCES dbo.users(id)
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
        status NVARCHAR(50) DEFAULT N'pending',
        shipping_address NVARCHAR(MAX) NOT NULL,
        payment_method NVARCHAR(100),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_orders_user FOREIGN KEY (user_id) REFERENCES dbo.users(id)
    );
END;
GO

IF OBJECT_ID(N'dbo.order_items', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.order_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        order_id INT NOT NULL,
        book_id INT NOT NULL,
        seller_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_order_items_order FOREIGN KEY (order_id) REFERENCES dbo.orders(id),
        CONSTRAINT FK_order_items_book FOREIGN KEY (book_id) REFERENCES dbo.books(id),
        CONSTRAINT FK_order_items_seller FOREIGN KEY (seller_id) REFERENCES dbo.users(id)
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

IF OBJECT_ID(N'dbo.staff_picks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.staff_picks (
        id INT IDENTITY(1,1) PRIMARY KEY,
        book_id INT NOT NULL UNIQUE,
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_staff_picks_book FOREIGN KEY (book_id) REFERENCES dbo.books(id) ON DELETE CASCADE
    );
END;
GO

-- ------------------------------------------------------------
-- Seed data (safe to rerun)
-- ------------------------------------------------------------
-- Default admin credentials for local development:
--   Email: admin@bookhaven.local
--   Password: Admin@123

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = N'admin@bookhaven.local')
BEGIN
    INSERT INTO dbo.users (email, password, full_name, role)
    VALUES (N'admin@bookhaven.local', N'Admin@123', N'BookHaven Admin', N'admin');
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = N'buyer@bookhaven.local')
BEGIN
    INSERT INTO dbo.users (email, password, full_name, role)
    VALUES (N'buyer@bookhaven.local', N'Buyer@123', N'Demo Buyer', N'buyer');
END;
GO

DECLARE @seedAdminId INT;
SELECT TOP 1 @seedAdminId = id
FROM dbo.users
WHERE role = N'admin'
ORDER BY id;

IF @seedAdminId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.books WHERE isbn = N'9780735211292')
    BEGIN
        INSERT INTO dbo.books (title, author, description, price, category, isbn, quantity, image_url, seller_id, rating)
        VALUES (N'Atomic Habits', N'James Clear', N'Build good habits and break bad ones.', 12.99, N'Self-Help', N'9780735211292', 24, N'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400', @seedAdminId, 4.8);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.books WHERE isbn = N'9780062315007')
    BEGIN
        INSERT INTO dbo.books (title, author, description, price, category, isbn, quantity, image_url, seller_id, rating)
        VALUES (N'The Alchemist', N'Paulo Coelho', N'A timeless novel about purpose and dreams.', 10.50, N'Fiction', N'9780062315007', 18, N'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', @seedAdminId, 4.6);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.books WHERE isbn = N'9780547928227')
    BEGIN
        INSERT INTO dbo.books (title, author, description, price, category, isbn, quantity, image_url, seller_id, rating)
        VALUES (N'The Hobbit', N'J.R.R. Tolkien', N'An epic fantasy adventure in Middle-earth.', 11.99, N'Fantasy', N'9780547928227', 15, N'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400', @seedAdminId, 4.7);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.books WHERE isbn = N'9780307476463')
    BEGIN
        INSERT INTO dbo.books (title, author, description, price, category, isbn, quantity, image_url, seller_id, rating)
        VALUES (N'Thinking, Fast and Slow', N'Daniel Kahneman', N'Insights into human judgment and decision making.', 14.20, N'Science', N'9780307476463', 20, N'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400', @seedAdminId, 4.5);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.books WHERE isbn = N'9780141034355')
    BEGIN
        INSERT INTO dbo.books (title, author, description, price, category, isbn, quantity, image_url, seller_id, rating)
        VALUES (N'Sherlock Holmes', N'Arthur Conan Doyle', N'Classic detective mysteries.', 9.90, N'Mystery', N'9780141034355', 16, N'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=400', @seedAdminId, 4.6);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.books WHERE isbn = N'9781501128035')
    BEGIN
        INSERT INTO dbo.books (title, author, description, price, category, isbn, quantity, image_url, seller_id, rating)
        VALUES (N'It Ends with Us', N'Colleen Hoover', N'A contemporary romance bestseller.', 13.40, N'Romance', N'9781501128035', 22, N'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400', @seedAdminId, 4.4);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.books WHERE isbn = N'9780812981605')
    BEGIN
        INSERT INTO dbo.books (title, author, description, price, category, isbn, quantity, image_url, seller_id, rating)
        VALUES (N'Steve Jobs', N'Walter Isaacson', N'Biography of Steve Jobs.', 15.00, N'Biography', N'9780812981605', 12, N'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400', @seedAdminId, 4.5);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.books WHERE isbn = N'9781452162560')
    BEGIN
        INSERT INTO dbo.books (title, author, description, price, category, isbn, quantity, image_url, seller_id, rating)
        VALUES (N'Salt, Fat, Acid, Heat', N'Samin Nosrat', N'A practical guide to better cooking.', 18.75, N'Cooking', N'9781452162560', 10, N'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400', @seedAdminId, 4.7);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.books WHERE isbn = N'9780140449266')
    BEGIN
        INSERT INTO dbo.books (title, author, description, price, category, isbn, quantity, image_url, seller_id, rating)
        VALUES (N'The Odyssey', N'Homer', N'A cornerstone of classic literature.', 8.75, N'Classic', N'9780140449266', 14, N'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400', @seedAdminId, 4.3);
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.books WHERE isbn = N'9780062457714')
    BEGIN
        INSERT INTO dbo.books (title, author, description, price, category, isbn, quantity, image_url, seller_id, rating)
        VALUES (N'Deep Work', N'Cal Newport', N'Rules for focused success in a distracted world.', 13.60, N'Self-Help', N'9780062457714', 19, N'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=400', @seedAdminId, 4.6);
    END;
END;
GO
