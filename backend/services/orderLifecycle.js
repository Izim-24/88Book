import pool from "../config/database.js";
import { ORDER_STATUS, canTransitionOrder } from "../constants/orderStatus.js";

export class OrderTransitionError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export const transitionOrder = (orderId, nextStatus, userId = null) =>
  pool.withTransaction(async (query) => {
    const ownerFilter = userId == null ? "" : " AND user_id = $2";
    const params = userId == null ? [orderId] : [orderId, userId];
    const result = await query(
      `SELECT id, status FROM orders WITH (UPDLOCK, HOLDLOCK) WHERE id = $1${ownerFilter}`,
      params,
    );
    const order = result.rows[0];
    if (!order) throw new OrderTransitionError("Order not found", 404);
    if (!canTransitionOrder(order.status, nextStatus)) {
      throw new OrderTransitionError(
        `Cannot change order from ${order.status} to ${nextStatus}`,
        409,
      );
    }

    const updated = await query(
      "UPDATE orders SET status = $1, updated_at = GETDATE() OUTPUT INSERTED.* WHERE id = $2",
      [nextStatus, orderId],
    );

    if (nextStatus === ORDER_STATUS.CANCELLED) {
      const items = await query(
        "SELECT book_id, quantity FROM order_items WHERE order_id = $1",
        [orderId],
      );
      for (const item of items.rows) {
        await query(
          "UPDATE books SET quantity = quantity + $1 WHERE id = $2",
          [item.quantity, item.book_id],
        );
      }
    }

    return updated.rows[0];
  });
