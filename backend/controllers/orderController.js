import pool from "../config/database.js";
import {
  ORDER_STATUS,
  ORDER_STATUSES,
} from "../constants/orderStatus.js";
import { calculateOrderTotals } from "../../shared/orderPricing.js";
import { OrderTransitionError, transitionOrder } from "../services/orderLifecycle.js";

class CheckoutError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

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
    const { shippingAddress, paymentMethod } = req.body || {};

    if (typeof shippingAddress !== "string" ||
        !shippingAddress.trim() || shippingAddress.length > 1000 ||
        paymentMethod !== "cash_on_delivery") {
      return res.status(400).json({
        success: false,
        message: "A valid shipping address and pay-on-delivery method are required",
      });
    }

    const order = await pool.withTransaction(async (query) => {
      const cartResult = await query(
        `SELECT ci.book_id, ci.quantity, b.price, b.admin_id
         FROM cart_items ci WITH (UPDLOCK, HOLDLOCK)
         JOIN books b ON ci.book_id = b.id
         WHERE ci.user_id = $1
         ORDER BY ci.book_id`,
        [userId],
      );
      const cartItems = cartResult.rows;
      if (cartItems.length === 0) throw new CheckoutError("Cart is empty");

      const { total } = calculateOrderTotals(cartItems);
      const orderResult = await query(
        `INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method)
         OUTPUT INSERTED.*
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, total, ORDER_STATUS.ACCEPTED, shippingAddress.trim(), paymentMethod],
      );
      const createdOrder = orderResult.rows[0];

      for (const item of cartItems) {
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          throw new CheckoutError("Invalid cart quantity");
        }
        const stockUpdate = await query(
          "UPDATE books SET quantity = quantity - $1 OUTPUT INSERTED.id WHERE id = $2 AND quantity >= $1",
          [item.quantity, item.book_id],
        );
        if (stockUpdate.rows.length !== 1) {
          throw new CheckoutError(`Book #${item.book_id} is out of stock`, 409);
        }
        await query(
          `INSERT INTO order_items (order_id, book_id, quantity, price, admin_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [createdOrder.id, item.book_id, item.quantity, item.price, item.admin_id],
        );
      }
      await query("DELETE FROM cart_items WHERE user_id = $1", [userId]);
      return createdOrder;
    });

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
    res.status(error.status || 500).json({
      success: false,
      message: error instanceof CheckoutError ? error.message : "Error creating order",
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
    await transitionOrder(orderId, ORDER_STATUS.CANCELLED, userId);

    res.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(error instanceof OrderTransitionError ? error.status : 500).json({
      success: false,
      message: error instanceof OrderTransitionError ? error.message : "Error cancelling order",
    });
  }
};

// Admin: Get accepted orders waiting to be shipped.
export const getAdminAcceptedOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, u.full_name, u.email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.status = $1
       ORDER BY o.created_at ASC`,
      [ORDER_STATUS.ACCEPTED],
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
      message: "Error fetching accepted orders",
    });
  }
};

// Admin: Keep the legacy approve endpoint as an accept action for demo orders.
export const approveOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderResult = await pool.query(
      "SELECT * FROM orders WHERE id = $1 AND status = $2",
      [orderId, ORDER_STATUS.ACCEPTED],
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not in accepted status",
      });
    }

    await pool.query(
      "UPDATE orders SET status = $1, updated_at = GETDATE() WHERE id = $2",
      [ORDER_STATUS.ACCEPTED, orderId],
    );

    res.json({
      success: true,
      message: "Order accepted",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error approving order",
    });
  }
};

// Admin: Update order status with the shared order lifecycle.
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body || {};

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${ORDER_STATUSES.join(", ")}`,
      });
    }

    await transitionOrder(orderId, status);

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
    });
  } catch (error) {
    console.error(error);
    res.status(error instanceof OrderTransitionError ? error.status : 500).json({
      success: false,
      message: error instanceof OrderTransitionError ? error.message : "Error updating order status",
    });
  }
};
