// Schema additions that align the database with the E-Commerce design model
// (ERD "Class diagram - ERD" in E-Commerce.vpp), mapped onto existing tables:
//   CUSTOMERS            -> users (+ phone, address)
//   CATEGORIES           -> categories (new), books.category_id
//   PRODUCTS             -> books
//   SEARCH_HISTORIES     -> book_search_history (+ search_type, image_url)
//   VOICE_SEARCH_QUERIES -> voice_search_queries (+ search_id, audio_path)
//   IMAGE_SEARCH_QUERIES -> image_search_queries (new)
// Each entry is one batch: SQL Server cannot use a column in the batch that adds it.
// Every statement is idempotent, so the migration can run any number of times.

export const designAlignmentStatements = [
  // CATEGORIES
  `IF OBJECT_ID('categories', 'U') IS NULL
   CREATE TABLE categories (
     id INT IDENTITY(1,1) PRIMARY KEY,
     name NVARCHAR(100) NOT NULL CONSTRAINT UQ_categories_name UNIQUE,
     created_at DATETIME DEFAULT GETDATE()
   );`,
  `IF COL_LENGTH('books', 'category_id') IS NULL
   ALTER TABLE books ADD category_id INT NULL;`,
  `IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_books_category')
   ALTER TABLE books ADD CONSTRAINT FK_books_category FOREIGN KEY (category_id) REFERENCES categories(id);`,
  `INSERT INTO categories (name)
   SELECT DISTINCT LTRIM(RTRIM(b.category))
   FROM books b
   WHERE b.category IS NOT NULL AND LTRIM(RTRIM(b.category)) <> ''
     AND NOT EXISTS (SELECT 1 FROM categories c WHERE c.name = LTRIM(RTRIM(b.category)));`,
  `UPDATE b SET category_id = c.id
   FROM books b JOIN categories c ON c.name = LTRIM(RTRIM(b.category))
   WHERE b.category_id IS NULL OR b.category_id <> c.id;`,

  // CUSTOMERS: contact details
  `IF COL_LENGTH('users', 'phone') IS NULL ALTER TABLE users ADD phone NVARCHAR(30) NULL;`,
  `IF COL_LENGTH('users', 'address') IS NULL ALTER TABLE users ADD address NVARCHAR(500) NULL;`,

  // SEARCH_HISTORIES: one table for keyword, voice and image searches
  `IF COL_LENGTH('book_search_history', 'search_type') IS NULL
   ALTER TABLE book_search_history ADD search_type NVARCHAR(10) NOT NULL
     CONSTRAINT DF_book_search_history_type DEFAULT 'keyword';`,
  `IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_book_search_history_type')
   ALTER TABLE book_search_history ADD CONSTRAINT CK_book_search_history_type
     CHECK (search_type IN ('keyword', 'voice', 'image'));`,
  `IF COL_LENGTH('book_search_history', 'image_url') IS NULL
   ALTER TABLE book_search_history ADD image_url NVARCHAR(500) NULL;`,
  `IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_book_search_history_created'
                  AND object_id = OBJECT_ID('book_search_history'))
   CREATE INDEX IX_book_search_history_created ON book_search_history(created_at DESC) INCLUDE (query, search_type);`,

  // VOICE_SEARCH_QUERIES: link to the search history row. NO ACTION because users
  // already cascade to book_search_history (SQL Server forbids two cascade paths);
  // the application clears these links before deleting history rows.
  `IF COL_LENGTH('voice_search_queries', 'search_id') IS NULL
   ALTER TABLE voice_search_queries ADD search_id INT NULL;`,
  `IF COL_LENGTH('voice_search_queries', 'audio_path') IS NULL
   ALTER TABLE voice_search_queries ADD audio_path NVARCHAR(500) NULL;`,
  `IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_voice_search_queries_search')
   ALTER TABLE voice_search_queries ADD CONSTRAINT FK_voice_search_queries_search
     FOREIGN KEY (search_id) REFERENCES book_search_history(id);`,

  // IMAGE_SEARCH_QUERIES. image_path stays NULL: uploads are processed in memory.
  `IF OBJECT_ID('image_search_queries', 'U') IS NULL
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
   );`,
];
