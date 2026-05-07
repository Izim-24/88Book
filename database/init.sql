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
