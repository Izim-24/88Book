import pool from "../config/database.js";

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

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["admin", "buyer"].includes(role)) {
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
