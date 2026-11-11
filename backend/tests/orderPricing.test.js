import test from "node:test";
import assert from "node:assert/strict";
import { calculateOrderTotals } from "../../shared/orderPricing.js";

test("cart and checkout use the same VND totals below free shipping threshold", () => {
  assert.deepEqual(calculateOrderTotals([{ price: 125000, quantity: 2 }]), {
    subtotal: 250000,
    tax: 20000,
    shipping: 30000,
    total: 300000,
  });
});

test("shipping becomes free at one million VND", () => {
  assert.deepEqual(calculateOrderTotals([{ price: 500000, quantity: 2 }]), {
    subtotal: 1000000,
    tax: 80000,
    shipping: 0,
    total: 1080000,
  });
  assert.deepEqual(calculateOrderTotals([]), {
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0,
  });
});
