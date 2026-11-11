// Small in-memory fixed-window rate limiter. Good enough for a single backend
// process; use a shared store (e.g. Redis) when running several instances.
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 20,
  message = "Too many requests. Please try again later.",
  keyGenerator = (req) => req.ip || req.socket?.remoteAddress || "unknown",
  now = () => Date.now(),
} = {}) => {
  const hits = new Map();

  const sweep = (time) => {
    for (const [key, entry] of hits) {
      if (entry.resetAt <= time) hits.delete(key);
    }
  };

  const limiter = (req, res, next) => {
    const time = now();
    if (hits.size > 10000) sweep(time);

    const key = keyGenerator(req);
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= time) {
      entry = { count: 0, resetAt: time + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    if (entry.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - time) / 1000)));
      return res.status(429).json({ success: false, message });
    }
    next();
  };

  limiter.reset = () => hits.clear();
  return limiter;
};
