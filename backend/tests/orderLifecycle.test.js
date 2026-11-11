import test from "node:test";
import assert from "node:assert/strict";
import { canTransitionOrder } from "../constants/orderStatus.js";

test("orders move forward or cancel only before shipping", () => {
  assert.equal(canTransitionOrder("accepted", "shipped"), true);
  assert.equal(canTransitionOrder("accepted", "cancelled"), true);
  assert.equal(canTransitionOrder("shipped", "delivered"), true);
  assert.equal(canTransitionOrder("shipped", "cancelled"), false);
  assert.equal(canTransitionOrder("delivered", "accepted"), false);
  assert.equal(canTransitionOrder("cancelled", "shipped"), false);
});
