import pool from "../config/database.js";
import { productRepository } from "../repositories/productRepository.js";
import {
  cleanText,
  isUniqueViolation,
  toNonNegativeInt,
  toPositiveInt,
  toPrice,
} from "../utils/validation.js";

const ensureRecommendationsTable = async () => {
  await pool.query(`
    IF OBJECT_ID('recommendations', 'U') IS NULL
    BEGIN
      CREATE TABLE recommendations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        book_id INT NOT NULL UNIQUE,
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_recommendations_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );
    END
  `);
};

export const getAllBooks = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 20,
      search,
      category,
      minPrice,
      maxPrice,
      sortBy = "created_at",
    } = req.query;

    // Validate pagination parameters
    page = Number(page);
    limit = Number(limit);
    if (!Number.isInteger(page) || page < 1) page = 1;
    if (!Number.isInteger(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100; // Max limit to prevent abuse

    const pageNumber = page;
    const pageSize = limit;
    const offset = (pageNumber - 1) * pageSize;

    let query = "SELECT * FROM books WHERE 1=1";
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (title LIKE $${paramIndex} OR author LIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (minPrice) {
      query += ` AND price >= $${paramIndex}`;
      params.push(minPrice);
      paramIndex++;
    }

    if (maxPrice) {
      query += ` AND price <= $${paramIndex}`;
      params.push(maxPrice);
      paramIndex++;
    }

    const allowedSortFields = [
      "created_at",
      "price",
      "title",
      "author",
      "rating",
    ];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "created_at";
    query += ` ORDER BY ${safeSortBy} DESC OFFSET $${paramIndex} ROWS FETCH NEXT $${paramIndex + 1} ROWS ONLY`;
    params.push(offset, pageSize);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = "SELECT COUNT(*) AS count FROM books WHERE 1=1";
    const countParams = [];
    let countParamIndex = 1;
    if (search) {
      countQuery += ` AND (title LIKE $${countParamIndex} OR author LIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }
    if (category) {
      countQuery += ` AND category = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }
    if (minPrice) {
      countQuery += ` AND price >= $${countParamIndex}`;
      countParams.push(minPrice);
      countParamIndex++;
    }
    if (maxPrice) {
      countQuery += ` AND price <= $${countParamIndex}`;
      countParams.push(maxPrice);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      books: result.rows,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching books",
    });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    await ensureRecommendationsTable();
    const result = await pool.query(
      `SELECT b.*, sp.sort_order
       FROM recommendations sp
       JOIN books b ON sp.book_id = b.id
       ORDER BY sp.sort_order ASC, sp.created_at ASC`,
    );

    res.json({
      success: true,
      books: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching recommendations",
    });
  }
};

export const getBookById = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid book ID" });
    const result = await pool.query("SELECT * FROM books WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.json({
      success: true,
      book: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching book",
    });
  }
};

// CATEGORIES (class diagram: Category categorizes Product)
export const listCategories = async (_req, res) => {
  try {
    res.json({ success: true, categories: await productRepository.findCategories() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching categories" });
  }
};

const parseBookInput = (body = {}) => {
  const title = cleanText(body.title, 255);
  const author = cleanText(body.author, 255);
  const category = cleanText(body.category, 100);
  const description = cleanText(body.description, 4000);
  const isbn = cleanText(body.isbn, 20);
  const imageUrl = cleanText(body.imageUrl ?? body.image_url, 500);
  const price = toPrice(body.price);
  const quantity = body.quantity === "" || body.quantity == null ? 0 : toNonNegativeInt(body.quantity);

  if (!title || !author || !category) {
    return { error: "Title, author, price, and category are required" };
  }
  if ([description, isbn, imageUrl].includes(undefined)) {
    return { error: "Description, ISBN or image URL is too long" };
  }
  if (price == null) return { error: "Price must be a positive number" };
  if (quantity == null) return { error: "Quantity must be a non-negative whole number" };

  return {
    values: [title, author, description || null, price, category, isbn || null, quantity, imageUrl || null],
  };
};

const sendBookWriteError = (res, error, fallback) => {
  console.error(error);
  if (isUniqueViolation(error)) {
    return res.status(409).json({ success: false, message: "A book with this ISBN already exists" });
  }
  res.status(500).json({ success: false, message: fallback });
};

export const createBook = async (req, res) => {
  try {
    const parsed = parseBookInput(req.body);
    if (parsed.error) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const result = await pool.query(
      "INSERT INTO books (title, author, description, price, category, isbn, quantity, image_url, admin_id, category_id) OUTPUT INSERTED.* VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
      [...parsed.values, req.user.userId, await productRepository.ensureCategory(parsed.values[4])],
    );

    res.status(201).json({
      success: true,
      message: "Book created successfully",
      book: result.rows[0],
    });
  } catch (error) {
    sendBookWriteError(res, error, "Error creating book");
  }
};

export const updateBook = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid book ID" });

    const parsed = parseBookInput(req.body);
    if (parsed.error) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    // Routes are admin-only, so admins may edit any book in the catalog.
    const result = await pool.query(
      `UPDATE books SET title = $1, author = $2, description = $3, price = $4, category = $5,
              isbn = $6, quantity = $7, image_url = $8, category_id = $10, updated_at = GETDATE()
       OUTPUT INSERTED.* WHERE id = $9`,
      [...parsed.values, id, await productRepository.ensureCategory(parsed.values[4])],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    res.json({
      success: true,
      message: "Book updated successfully",
      book: result.rows[0],
    });
  } catch (error) {
    sendBookWriteError(res, error, "Error updating book");
  }
};

export const deleteBook = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid book ID" });

    const outcome = await pool.withTransaction(async (query) => {
      const book = await query("SELECT id FROM books WITH (UPDLOCK) WHERE id = $1", [id]);
      if (book.rows.length === 0) return "missing";

      const ordered = await query("SELECT TOP 1 id FROM order_items WHERE book_id = $1", [id]);
      if (ordered.rows.length > 0) return "ordered";

      // Cart rows have no ON DELETE CASCADE, so remove them explicitly.
      await query("DELETE FROM cart_items WHERE book_id = $1", [id]);
      await query("DELETE FROM wishlists WHERE book_id = $1", [id]);
      await query("DELETE FROM books WHERE id = $1", [id]);
      return "deleted";
    });

    if (outcome === "missing") {
      return res.status(404).json({ success: false, message: "Book not found" });
    }
    if (outcome === "ordered") {
      return res.status(409).json({
        success: false,
        message: "This book appears in existing orders and cannot be deleted. Set its quantity to 0 to stop selling it.",
      });
    }

    res.json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error deleting book",
    });
  }
};
