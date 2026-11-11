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

const nextStatuses = Object.freeze({
  [ORDER_STATUS.ACCEPTED]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
});

export const canTransitionOrder = (currentStatus, nextStatus) =>
  nextStatuses[currentStatus]?.includes(nextStatus) ?? false;
