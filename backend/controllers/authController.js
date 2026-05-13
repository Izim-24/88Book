import pool from "../config/database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // Password must be at least 8 characters
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  return { valid: true };
};
  // Backward compatibility for seeded/dev accounts with plain-text password.
  if (storedPassword?.startsWith?.("$2")) {
    return bcrypt.compare(rawPassword, storedPassword);
  }
  return rawPassword === storedPassword;
};

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    const error = new Error("JWT_SECRET is not configured in backend/.env");
    error.status = 500;
    throw error;
  }

  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" },
  );
};

const sendAuthError = (res, error, fallbackMessage) => {
  const status = error.status || 500;
  const message =
    status === 500 && process.env.NODE_ENV !== "development"
      ? fallbackMessage
      : error.message || fallbackMessage;

  res.status(status).json({
    success: false,
    message,
  });
};

export const registerUser = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Validate input
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and full name are required",
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    // Check if user exists
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Force role to "buyer" - users cannot self-assign admin role
    const role = "buyer";

    // Insert user
    const result = await pool.query(
      "INSERT INTO users (email, password, full_name, role) OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name, INSERTED.role VALUES ($1, $2, $3, $4)",
      [email, hashedPassword, fullName, role],
    );

    const user = result.rows[0];

    // Generate token
    const token = createToken(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    sendAuthError(res, error, "Error registering user");
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];
    const validPassword = await verifyPassword(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = createToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    sendAuthError(res, error, "Error logging in");
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, full_name, role, created_at FROM users WHERE id = $1",
      [req.user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error(error);
    sendAuthError(res, error, "Error fetching user");
  }
};

// Admin only: Create another admin account
export const createAdminAccount = async (req, res) => {
  try {
    // Only existing admins can create new admin accounts
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can create admin accounts",
      });
    }

    const { email, password, fullName } = req.body;

    // Validate input
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and full name are required",
      });
    }

    // Check if user exists
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin account
    const result = await pool.query(
      "INSERT INTO users (email, password, full_name, role) OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name, INSERTED.role VALUES ($1, $2, $3, $4)",
      [email, hashedPassword, fullName, "admin"],
    );

    const user = result.rows[0];

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    sendAuthError(res, error, "Error creating admin account");
  }
};
