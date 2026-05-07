import pool from "../config/database.js";
import bcrypt from "bcryptjs";

const editableRoles = ["admin", "buyer"];

const ensureStaffPicksTable = async () => {
  await pool.query(`
    IF OBJECT_ID('staff_picks', 'U') IS NULL
    BEGIN
      CREATE TABLE staff_picks (
        id INT IDENTITY(1,1) PRIMARY KEY,
        book_id INT NOT NULL UNIQUE,
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_staff_picks_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );
    END
  `);
};

export const getAdminUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC",
    );

    res.json({
      success: true,
      users: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
    });
  }
};

export const createAdminUser = async (req, res) => {
  try {
    const { email, password, fullName, role = "buyer" } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and full name are required",
      });
    }

    if (!editableRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be admin or buyer",
      });
    }

    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email is already taken",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password, full_name, role) OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name, INSERTED.role, INSERTED.created_at VALUES ($1, $2, $3, $4)",
      [email, hashedPassword, fullName, role],
    );

    res.status(201).json({
      success: true,
      message: "User created",
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
    });
  }
};

export const updateAdminUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, fullName, role, password } = req.body;

    if (role && !editableRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be admin or buyer",
      });
    }

    if (Number(userId) === Number(req.user.userId) && role && role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "You cannot remove your own admin role",
      });
    }

    if (email) {
      const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, userId],
      );
      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email is already taken",
        });
      }
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const result = await pool.query(
      `UPDATE users
       SET email = COALESCE($1, email),
           full_name = COALESCE($2, full_name),
           role = COALESCE($3, role),
           password = COALESCE($4, password),
           updated_at = GETDATE()
       OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name, INSERTED.role, INSERTED.created_at
       WHERE id = $5`,
      [email, fullName, role, hashedPassword, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User updated",
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
    });
  }
};

export const deleteAdminUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (Number(userId) === Number(req.user.userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const result = await pool.query(
      "DELETE FROM users OUTPUT DELETED.id WHERE id = $1",
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error deleting user. Remove related orders, cart items, addresses, or wishlist records first.",
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!editableRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be admin or buyer",
      });
    }

    if (Number(userId) === Number(req.user.userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    const result = await pool.query(
      "UPDATE users SET role = $1, updated_at = GETDATE() OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name, INSERTED.role, INSERTED.created_at WHERE id = $2",
      [role, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User role updated",
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating user role",
    });
  }
};

export const getAdminBooks = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNumber = Number(page);
    const pageSize = Number(limit);
    const offset = (pageNumber - 1) * pageSize;

    const result = await pool.query(
      "SELECT * FROM books ORDER BY created_at DESC OFFSET $1 ROWS FETCH NEXT $2 ROWS ONLY",
      [offset, pageSize],
    );

    const countResult = await pool.query(
      "SELECT COUNT(*) AS count FROM books",
    );

    res.json({
      success: true,
      books: result.rows,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: parseInt(countResult.rows[0].count),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching admin books",
    });
  }
};

export const getStaffPicks = async (req, res) => {
  try {
    await ensureStaffPicksTable();
    const result = await pool.query(
      `SELECT b.*, sp.sort_order
       FROM staff_picks sp
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

export const updateStaffPicks = async (req, res) => {
  try {
    const { bookIds } = req.body;

    if (!Array.isArray(bookIds)) {
      return res.status(400).json({
        success: false,
        message: "bookIds must be an array",
      });
    }

    const uniqueBookIds = [...new Set(bookIds.map(Number))]
      .filter((id) => Number.isInteger(id) && id > 0)
      .slice(0, 6);

    await ensureStaffPicksTable();
    await pool.query("DELETE FROM staff_picks");

    for (const [index, bookId] of uniqueBookIds.entries()) {
      await pool.query(
        "INSERT INTO staff_picks (book_id, sort_order) VALUES ($1, $2)",
        [bookId, index],
      );
    }

    const result = await pool.query(
      `SELECT b.*, sp.sort_order
       FROM staff_picks sp
       JOIN books b ON sp.book_id = b.id
       ORDER BY sp.sort_order ASC, sp.created_at ASC`,
    );

    res.json({
      success: true,
      message: "Recommendations updated",
      books: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating recommendations",
    });
  }
};

export const getAdminOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        o.id, o.user_id, o.total_amount, o.status, o.created_at,
        u.full_name, u.email
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN users u ON o.user_id = u.id
       GROUP BY o.id, o.user_id, o.total_amount, o.status, o.created_at, u.full_name, u.email
       ORDER BY o.created_at DESC`,
    );

    const orders = await Promise.all(
      result.rows.map(async (order) => {
        const itemsResult = await pool.query(
          `SELECT oi.book_id, oi.quantity, oi.price, b.title
           FROM order_items oi
           JOIN books b ON oi.book_id = b.id
           WHERE oi.order_id = $1`,
          [order.id],
        );

        return {
          ...order,
          items: itemsResult.rows.map((item) => ({
            bookId: item.book_id,
            quantity: item.quantity,
            price: item.price,
            title: item.title,
          })),
        };
      }),
    );

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching admin orders",
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const result = await pool.query(
      "UPDATE orders SET status = $1, updated_at = GETDATE() OUTPUT INSERTED.* WHERE id = $2",
      [status, orderId],
    );

    res.json({
      success: true,
      message: "Order status updated",
      order: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating order status",
    });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const booksResult = await pool.query(
      "SELECT COUNT(*) as total_books, SUM(quantity) as total_inventory FROM books",
    );

    const ordersResult = await pool.query(
      `SELECT COUNT(*) as total_orders, SUM(o.total_amount) as total_revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id`,
    );

    const recentResult = await pool.query(
      `SELECT COUNT(*) as recent_orders
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.created_at >= DATEADD(day, -30, GETDATE())`,
    );

    res.json({
      success: true,
      stats: {
        totalBooks: parseInt(booksResult.rows[0].total_books) || 0,
        totalInventory: parseInt(booksResult.rows[0].total_inventory) || 0,
        totalOrders: parseInt(ordersResult.rows[0].total_orders) || 0,
        totalRevenue: parseFloat(ordersResult.rows[0].total_revenue) || 0,
        recentOrders: parseInt(recentResult.rows[0].recent_orders) || 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching stats",
    });
  }
};
