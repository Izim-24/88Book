import pool from "../config/database.js";

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
    const { id } = req.params;
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

export const createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      description,
      price,
      category,
      isbn,
      quantity,
      imageUrl,
      image_url,
    } = req.body;
    const adminId = req.user.userId;

    if (!title || !author || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, author, price, and category are required",
      });
    }

    // Validate price
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number",
      });
    }

    // Validate quantity
    const numQuantity = Number(quantity) || 0;
    if (numQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative",
      });
    }

    const result = await pool.query(
      "INSERT INTO books (title, author, description, price, category, isbn, quantity, image_url, admin_id) OUTPUT INSERTED.* VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [
        title,
        author,
        description,
        numPrice,
        category,
        isbn,
        numQuantity,
        imageUrl || image_url,
        adminId,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Book created successfully",
      book: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error creating book",
    });
  }
};

export const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      author,
      description,
      price,
      category,
      isbn,
      quantity,
      imageUrl,
      image_url,
    } = req.body;
    const isAdmin = req.user.role === "admin";

    const result = await pool.query(
      `UPDATE books SET title = $1, author = $2, description = $3, price = $4, category = $5, isbn = $6, quantity = $7, image_url = $8, updated_at = GETDATE() OUTPUT INSERTED.* WHERE id = $9${isAdmin ? "" : " AND admin_id = $10"}`,
      isAdmin
        ? [
            title,
            author,
            description,
            price,
            category,
            isbn,
            quantity,
            imageUrl || image_url,
            id,
          ]
        : [
            title,
            author,
            description,
            price,
            category,
            isbn,
            quantity,
            imageUrl || image_url,
            id,
            req.user.userId,
          ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found or unauthorized",
      });
    }

    res.json({
      success: true,
      message: "Book updated successfully",
      book: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating book",
    });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === "admin";

    const result = await pool.query(
      `DELETE FROM books OUTPUT DELETED.id WHERE id = $1${isAdmin ? "" : " AND admin_id = $2"}`,
      isAdmin ? [id] : [id, req.user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found or unauthorized",
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
