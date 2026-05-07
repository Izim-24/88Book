import pool from "../config/database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE },
    );

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
    res.status(500).json({
      success: false,
      message: "Error registering user",
    });
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
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE },
    );

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
    res.status(500).json({
      success: false,
      message: "Error logging in",
    });
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
    res.status(500).json({
      success: false,
      message: "Error fetching user",
    });
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
    res.status(500).json({
      success: false,
      message: "Error creating admin account",
    });
  }
};
