import test from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter } from "../middleware/rateLimit.js";

const fakeResponse = () => {
  const res = { statusCode: 200, headers: {}, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  res.setHeader = (name, value) => { res.headers[name] = value; };
  return res;
};

test("blocks a client after the limit and lets it back in after the window", () => {
  let time = 0;
  const limiter = createRateLimiter({ windowMs: 1000, max: 2, now: () => time });
  const req = { ip: "10.0.0.1" };
  let passed = 0;
  const next = () => { passed += 1; };

  limiter(req, fakeResponse(), next);
  limiter(req, fakeResponse(), next);
  const blocked = fakeResponse();
  limiter(req, blocked, next);

  assert.equal(passed, 2);
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.body.success, false);
  assert.equal(blocked.headers["Retry-After"], "1");

  time = 1000;
  limiter(req, fakeResponse(), next);
  assert.equal(passed, 3);
});

test("counts each client separately", () => {
  const limiter = createRateLimiter({ windowMs: 1000, max: 1, now: () => 0 });
  let passed = 0;
  const next = () => { passed += 1; };
  limiter({ ip: "10.0.0.1" }, fakeResponse(), next);
  limiter({ ip: "10.0.0.2" }, fakeResponse(), next);
  assert.equal(passed, 2);
});
