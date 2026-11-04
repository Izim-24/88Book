import pool from "../config/database.js";

// A fixed route in Ho Chi Minh City for demonstration. It never represents a customer's address.
const demoRoute = [
  [10.7769, 106.7009],
  [10.7728, 106.7048],
  [10.7671, 106.7093],
  [10.7606, 106.7124],
  [10.7529, 106.7158],
  [10.7441, 106.7194],
  [10.7355, 106.7226],
];

const durationMs = 3 * 60 * 1000;

const positionAt = (progress) => {
  const segment = Math.min(demoRoute.length - 2, Math.floor(progress * (demoRoute.length - 1)));
  const within = progress * (demoRoute.length - 1) - segment;
  const start = demoRoute[segment];
  const end = demoRoute[segment + 1];
  return [start[0] + (end[0] - start[0]) * within, start[1] + (end[1] - start[1]) * within];
};

const trackingFor = (status, startedAt, orderId = null) => {
  const elapsed = Math.max(0, Date.now() - new Date(startedAt).getTime());
  const progress = status === "delivered" ? 1
    : status === "shipped" ? (elapsed % durationMs) / durationMs
      : 0;
  return {
    demo: true,
    orderId,
    status,
    route: demoRoute,
    position: status === "cancelled" ? null : positionAt(progress),
    progress: Math.round(progress * 100),
    etaMinutes: status === "shipped" ? Math.max(1, Math.ceil((durationMs * (1 - progress)) / 60000)) : null,
    updatedAt: new Date().toISOString(),
    originLabel: "Demo bookstore · District 1, Ho Chi Minh City",
    destinationLabel: "Demo destination · District 7, Ho Chi Minh City",
    notice: "Simulated courier location on a real map. This is not live GPS or the customer's delivery address.",
  };
};

export const getDemoTracking = (_req, res) => {
  res.json({ success: true, tracking: trackingFor("shipped", Date.now() - (Date.now() % durationMs), "DEMO") });
};

export const getOrderTracking = async (req, res) => {
  const orderId = Number(req.params.orderId);
  if (!Number.isInteger(orderId) || orderId < 1) return res.status(400).json({ success: false, message: "Invalid order ID" });
  try {
    const result = await pool.query(
      "SELECT id, user_id, status, updated_at FROM orders WHERE id = $1",
      [orderId],
    );
    const order = result.rows[0];
    if (!order || (order.user_id !== req.user.userId && req.user.role !== "admin")) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    return res.json({ success: true, tracking: trackingFor(order.status, order.updated_at, order.id) });
  } catch (error) {
    console.error("Order tracking failed:", error);
    return res.status(500).json({ success: false, message: "Could not load delivery tracking" });
  }
};
