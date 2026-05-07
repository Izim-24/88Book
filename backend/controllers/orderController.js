import pool from "../config/database.js";

const getOrderItems = async (orderId) => {
  const itemsResult = await pool.query(
    `SELECT oi.book_id, oi.quantity, oi.price, b.title
     FROM order_items oi
     LEFT JOIN books b ON oi.book_id = b.id
     WHERE oi.order_id = $1`,
    [orderId],
  );

  return itemsResult.rows.map((item) => ({
    bookId: item.book_id,
    bookTitle: item.title,
    quantity: item.quantity,
    price: item.price,
  }));
};

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { shippingAddress, paymentMethod } = req.body;

    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Shipping address and payment method are required",
      });
    }

    // Get cart items
    const cartResult = await pool.query(
      `SELECT ci.book_id, ci.quantity, b.price, b.seller_id
       FROM cart_items ci
       JOIN books b ON ci.book_id = b.id
       WHERE ci.user_id = $1`,
      [userId],
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const cartItems = cartResult.rows;
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

    // Create order
    const orderResult = await pool.query(
      `INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method)
       OUTPUT INSERTED.*
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, totalAmount, "pending", shippingAddress, paymentMethod],
    );

    const order = orderResult.rows[0];

    // Create order items
    for (const item of cartItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, book_id, quantity, price, seller_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.book_id, item.quantity, item.price, item.seller_id],
      );

      // Reduce book quantity
      await pool.query(
        "UPDATE books SET quantity = quantity - $1 WHERE id = $2",
        [item.quantity, item.book_id],
      );
    }

    // Clear cart
    await pool.query("DELETE FROM cart_items WHERE user_id = $1", [userId]);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        id: order.id,
        totalAmount: order.total_amount,
        status: order.status,
        createdAt: order.created_at,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error creating order",
    });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT o.*
       FROM orders o
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId],
    );

    const orders = await Promise.all(
      result.rows.map(async (order) => ({
        ...order,
        items: await getOrderItems(order.id),
      })),
    );

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
    });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    const orderResult = await pool.query(
      "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
      [orderId, userId],
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const itemsResult = await pool.query(
      `SELECT oi.*, b.title, b.author, b.image_url
       FROM order_items oi
       JOIN books b ON oi.book_id = b.id
       WHERE oi.order_id = $1`,
      [orderId],
    );

    res.json({
      success: true,
      order: {
        ...orderResult.rows[0],
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching order details",
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    const orderResult = await pool.query(
      "SELECT * FROM orders WHERE id = $1 AND user_id = $2 AND status IN ($3, $4)",
      [orderId, userId, "pending", "processing"],
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found or cannot be cancelled",
      });
    }

    // Update order status
    await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [
      "cancelled",
      orderId,
    ]);

    // Restore book quantities
    const itemsResult = await pool.query(
      "SELECT book_id, quantity FROM order_items WHERE order_id = $1",
      [orderId],
    );

    for (const item of itemsResult.rows) {
      await pool.query(
        "UPDATE books SET quantity = quantity + $1 WHERE id = $2",
        [item.quantity, item.book_id],
      );
    }

    res.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error cancelling order",
    });
  }
};

// Admin: Get all pending orders
export const getAdminPendingOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, u.full_name, u.email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.status = 'pending'
       ORDER BY o.created_at ASC`,
    );

    const orders = await Promise.all(
      result.rows.map(async (order) => ({
        ...order,
        fullName: order.full_name,
        items: await getOrderItems(order.id),
      })),
    );

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending orders",
    });
  }
};

// Admin: Approve order (pending -> approved)
export const approveOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderResult = await pool.query(
      "SELECT * FROM orders WHERE id = $1 AND status = $2",
      [orderId, "pending"],
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not in pending status",
      });
    }

    // Update order status to approved
    await pool.query(
      "UPDATE orders SET status = $1, updated_at = GETDATE() WHERE id = $2",
      ["approved", orderId],
    );

    res.json({
      success: true,
      message: "Order approved successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error approving order",
    });
  }
};

// Admin: Update order status (approved -> shipping -> shipped -> delivered)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ["approved", "shipping", "shipped", "delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const orderResult = await pool.query("SELECT * FROM orders WHERE id = $1", [
      orderId,
    ]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update order status
    await pool.query(
      "UPDATE orders SET status = $1, updated_at = GETDATE() WHERE id = $2",
      [status, orderId],
    );

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating order status",
    });
  }
};
