export function formatVND(price: number | string): string {
  const n = Number(price) || 0;
  return n.toLocaleString("vi-VN") + " ₫";
}
