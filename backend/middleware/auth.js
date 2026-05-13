import jwt from "jsonwebtoken";

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

export const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    next();
  };
};
