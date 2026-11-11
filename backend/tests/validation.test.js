import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanText,
  isValidEmail,
  normalizeEmail,
  passwordProblem,
  toNonNegativeInt,
  toPositiveInt,
  toPrice,
} from "../utils/validation.js";

test("emails are trimmed, lower-cased and checked", () => {
  assert.equal(normalizeEmail("  Reader@Example.COM "), "reader@example.com");
  assert.equal(normalizeEmail(42), "");
  assert.ok(isValidEmail("reader@example.com"));
  assert.ok(!isValidEmail("reader@example"));
  assert.ok(!isValidEmail(`${"a".repeat(250)}@x.com`));
});

test("passwords need 8 characters and fit in bcrypt's 72 bytes", () => {
  assert.equal(passwordProblem("short"), "Password must be at least 8 characters");
  assert.equal(passwordProblem(undefined), "Password is required");
  assert.equal(passwordProblem("long enough"), null);
  assert.match(passwordProblem("ă".repeat(40)), /at most 72 bytes/);
});

test("text fields are trimmed and rejected when too long or not text", () => {
  assert.equal(cleanText("  Dế Mèn  "), "Dế Mèn");
  assert.equal(cleanText(null), null);
  assert.equal(cleanText("abcdef", 5), undefined);
  assert.equal(cleanText({ title: "x" }), undefined);
});

test("numbers accept only valid ids, stock counts and DECIMAL(10,2) prices", () => {
  assert.equal(toPositiveInt("12"), 12);
  assert.equal(toPositiveInt("0"), null);
  assert.equal(toPositiveInt("1.5"), null);
  assert.equal(toNonNegativeInt("0"), 0);
  assert.equal(toNonNegativeInt(-1), null);
  assert.equal(toPrice("129000"), 129000);
  assert.equal(toPrice(""), null);
  assert.equal(toPrice(0), null);
  assert.equal(toPrice(1e8), null);
});
