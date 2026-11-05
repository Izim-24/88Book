import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = new Set([
  process.env.FRONTEND_URL || "http://localhost:5174",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
]);

// Middleware
app.use(
  cors({
    origin: (origin, callback) =>
      callback(null, !origin || allowedOrigins.has(origin)),
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (book cover images)
app.use("/uploads", express.static(`${__dirname}/uploads`));

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Import routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import bookRoutes from "./routes/books.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";
import recommendationRoutes from "./routes/recommendations.js";

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/recommendations", recommendationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 Book Store API is ready`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the other backend process before restarting.`);
    process.exit(1);
  }
  throw error;
});
