import pool from "../config/database.js";

export const getAllBooks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      minPrice,
      maxPrice,
      sortBy = "created_at",
    } = req.query;
    const pageNumber = Number(page);
    const pageSize = Number(limit);
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

    const allowedSortFields = ["created_at", "price", "title", "author", "rating"];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "created_at";
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
    } = req.body;
    const sellerId = req.user.userId;

    if (!title || !author || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, author, price, and category are required",
      });
    }

    const result = await pool.query(
      "INSERT INTO books (title, author, description, price, category, isbn, quantity, image_url, seller_id) OUTPUT INSERTED.* VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [
        title,
        author,
        description,
        price,
        category,
        isbn,
        quantity || 0,
        imageUrl,
        sellerId,
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
    } = req.body;

    const result = await pool.query(
      "UPDATE books SET title = $1, author = $2, description = $3, price = $4, category = $5, isbn = $6, quantity = $7, image_url = $8, updated_at = GETDATE() OUTPUT INSERTED.* WHERE id = $9 AND seller_id = $10",
      [
        title,
        author,
        description,
        price,
        category,
        isbn,
        quantity,
        imageUrl,
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

    const result = await pool.query(
      "DELETE FROM books OUTPUT DELETED.id WHERE id = $1 AND seller_id = $2",
      [id, req.user.userId],
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
