export const TAX_RATE = 0.08;
export const SHIPPING_FEE = 30000;
export const FREE_SHIPPING_THRESHOLD = 1000000;

export function calculateOrderTotals(items) {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );
  const tax = Math.round(subtotal * TAX_RATE);
  const shipping =
    items.length === 0 || subtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_FEE;

  return { subtotal, tax, shipping, total: subtotal + tax + shipping };
}
