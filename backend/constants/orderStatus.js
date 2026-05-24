export const ORDER_STATUS = Object.freeze({
  ACCEPTED: "accepted",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
});

export const ORDER_STATUSES = Object.freeze(Object.values(ORDER_STATUS));

export const CANCELLABLE_ORDER_STATUSES = Object.freeze([
  ORDER_STATUS.ACCEPTED,
]);
