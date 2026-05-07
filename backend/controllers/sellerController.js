import pool from "../config/database.js";

export const getSellerBooks = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const pageNumber = Number(page);
    const pageSize = Number(limit);
    const offset = (pageNumber - 1) * pageSize;

    const result = await pool.query(
      "SELECT * FROM books WHERE seller_id = $1 ORDER BY created_at DESC OFFSET $2 ROWS FETCH NEXT $3 ROWS ONLY",
      [sellerId, offset, pageSize],
    );

    const countResult = await pool.query(
      "SELECT COUNT(*) FROM books WHERE seller_id = $1",
      [sellerId],
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
      message: "Error fetching seller books",
    });
  }
};

export const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user.userId;

    const result = await pool.query(
      `SELECT 
        o.id, o.user_id, o.total_amount, o.status, o.created_at,
        u.full_name, u.email
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN users u ON o.user_id = u.id
       WHERE oi.seller_id = $1
       GROUP BY o.id, o.user_id, o.total_amount, o.status, o.created_at, u.full_name, u.email
       ORDER BY o.created_at DESC`,
      [sellerId],
    );

    const orders = await Promise.all(
      result.rows.map(async (order) => {
        const itemsResult = await pool.query(
          `SELECT oi.book_id, oi.quantity, oi.price, b.title
           FROM order_items oi
           JOIN books b ON oi.book_id = b.id
           WHERE oi.order_id = $1 AND oi.seller_id = $2`,
          [order.id, sellerId],
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
      message: "Error fetching seller orders",
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const sellerId = req.user.userId;

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

    // Verify seller owns items in this order
    const ownershipResult = await pool.query(
      `SELECT COUNT(*) FROM order_items WHERE order_id = $1 AND seller_id = $2`,
      [orderId, sellerId],
    );

    if (parseInt(ownershipResult.rows[0].count) === 0) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
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

export const getSellerStats = async (req, res) => {
  try {
    const sellerId = req.user.userId;

    const booksResult = await pool.query(
      "SELECT COUNT(*) as total_books, SUM(quantity) as total_inventory FROM books WHERE seller_id = $1",
      [sellerId],
    );

    const ordersResult = await pool.query(
      `SELECT COUNT(*) as total_orders, SUM(o.total_amount) as total_revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.seller_id = $1`,
      [sellerId],
    );

    const recentResult = await pool.query(
      `SELECT COUNT(*) as recent_orders
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.seller_id = $1 AND o.created_at >= DATEADD(day, -30, GETDATE())`,
      [sellerId],
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
