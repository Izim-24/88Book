// ProductRepository (sequence + component diagrams): reads catalog products.
// Products are stored in the `books` table.
import pool from "../config/database.js";

const SEARCH_COLUMNS =
  "id, title, author, description, price, category, category_id, isbn, quantity, image_url, rating";

export const productRepository = {
  // The catalog is small enough to rank in memory, which lets search ignore
  // accents and filler words (SQL Server's default collation is accent-sensitive).
  async findAllForSearch() {
    const result = await pool.query(`SELECT TOP 5000 ${SEARCH_COLUMNS} FROM books`);
    return result.rows;
  },

  async findCategories() {
    const result = await pool.query(
      `SELECT c.id, c.name, COUNT(b.id) AS book_count
       FROM categories c LEFT JOIN books b ON b.category_id = c.id
       GROUP BY c.id, c.name
       ORDER BY c.name`,
    );
    return result.rows.map((row) => ({ ...row, book_count: Number(row.book_count) }));
  },

  // Returns the category id for a name, creating the category when it is new.
  async ensureCategory(name, query = pool.query) {
    const existing = await query("SELECT id FROM categories WHERE name = $1", [name]);
    if (existing.rows[0]) return existing.rows[0].id;
    const created = await query(
      `INSERT INTO categories (name) OUTPUT INSERTED.id
       SELECT $1 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = $1)`,
      [name],
    );
    if (created.rows[0]) return created.rows[0].id;
    // Another request created it between the two statements.
    return (await query("SELECT id FROM categories WHERE name = $1", [name])).rows[0]?.id ?? null;
  },
};
