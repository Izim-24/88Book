import jwt from "jsonwebtoken";
import pool from "../config/database.js";

export const authenticateToken = (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured");
    return res.status(500).json({
      success: false,
      message: "Server configuration error: JWT_SECRET missing",
    });
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      const statusCode = err.name === "TokenExpiredError" ? 401 : 403;
      return res.status(statusCode).json({
        success: false,
        message:
          err.name === "TokenExpiredError"
            ? "Token expired, please login again"
            : "Invalid token",
      });
    }
    req.user = user;
    next();
  });
};

export const identifyOptionalUser = (req, _res, next) => {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (token && process.env.JWT_SECRET) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Public searches still work when the saved token has expired.
    }
  }
  next();
};

export const authorizeRole = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    try {
      const result = await pool.query("SELECT role FROM users WHERE id = $1", [req.user.userId]);
      const currentRole = result.rows[0]?.role;
      if (!currentRole || !roles.includes(currentRole)) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access",
        });
      }
      req.user.role = currentRole;
      next();
    } catch (error) {
      console.error("Role lookup failed:", error);
      res.status(503).json({ success: false, message: "Authorization is temporarily unavailable" });
    }
  };
};
