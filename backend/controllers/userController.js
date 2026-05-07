import pool from "../config/database.js";
import bcrypt from "bcryptjs";

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      "SELECT id, email, full_name, role, created_at FROM users WHERE id = $1",
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fullName, email } = req.body;

    // Check if email is already taken (by another user)
    if (email) {
      const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, userId],
      );
      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email is already taken",
        });
      }
    }

    const result = await pool.query(
      "UPDATE users SET full_name = COALESCE($1, full_name), email = COALESCE($2, email), updated_at = GETDATE() OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name, INSERTED.role WHERE id = $3",
      [fullName, email, userId],
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const result = await pool.query(
      "SELECT password FROM users WHERE id = $1",
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const validPassword = await bcrypt.compare(
      currentPassword,
      result.rows[0].password,
    );
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password = $1, updated_at = GETDATE() WHERE id = $2",
      [hashedPassword, userId],
    );

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error changing password",
    });
  }
};

export const getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      "SELECT id, full_name, email, role FROM users WHERE id = $1",
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
    });
  }
};

// --- Address Management ---
export const getUserAddresses = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      "SELECT id, label, name, street, city, state, zip_code AS zipCode, country, is_default AS isDefault FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC",
      [userId]
    );
    res.json({ success: true, addresses: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching addresses" });
  }
};

export const addAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { label, name, street, city, state, zipCode, country, isDefault } = req.body;
    
    if (isDefault) {
      await pool.query("UPDATE user_addresses SET is_default = 0 WHERE user_id = $1", [userId]);
    }
    
    const insertResult = await pool.query(
      "INSERT INTO user_addresses (user_id, label, name, street, city, state, zip_code, country, is_default) OUTPUT INSERTED.id VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [userId, label, name, street, city, state, zipCode, country, isDefault || 0]
    );
    const newAddressId = insertResult.rows[0].id;
    const result = await pool.query(
      "SELECT id, label, name, street, city, state, zip_code AS zipCode, country, is_default AS isDefault FROM user_addresses WHERE id = $1 AND user_id = $2",
      [newAddressId, userId]
    );

    res.status(201).json({ success: true, address: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error adding address" });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { label, name, street, city, state, zipCode, country, isDefault } = req.body;
    
    if (isDefault) {
      await pool.query("UPDATE user_addresses SET is_default = 0 WHERE user_id = $1 AND id != $2", [userId, id]);
    }
    
    const updateResult = await pool.query(
      "UPDATE user_addresses SET label = COALESCE($1, label), name = COALESCE($2, name), street = COALESCE($3, street), city = COALESCE($4, city), state = COALESCE($5, state), zip_code = COALESCE($6, zip_code), country = COALESCE($7, country), is_default = COALESCE($8, is_default) OUTPUT INSERTED.id WHERE id = $9 AND user_id = $10",
      [label, name, street, city, state, zipCode, country, isDefault, id, userId]
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }
    const result = await pool.query(
      "SELECT id, label, name, street, city, state, zip_code AS zipCode, country, is_default AS isDefault FROM user_addresses WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    res.json({ success: true, address: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating address" });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await pool.query("DELETE FROM user_addresses OUTPUT DELETED.id WHERE id = $1 AND user_id = $2", [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }
    res.json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error deleting address" });
  }
};

// --- Wishlist Management ---
export const getUserWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      `SELECT b.*, b.image_url as coverImage
       FROM wishlists w 
       JOIN books b ON w.book_id = b.id 
       WHERE w.user_id = $1 
       ORDER BY w.created_at DESC`,
      [userId]
    );
    res.json({ success: true, wishlist: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching wishlist" });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookId } = req.body;
    
    const result = await pool.query(
      `IF NOT EXISTS (SELECT 1 FROM wishlists WHERE user_id = $1 AND book_id = $2)
         INSERT INTO wishlists (user_id, book_id) OUTPUT INSERTED.id VALUES ($1, $2)`,
      [userId, bookId]
    );
    
    res.status(201).json({ success: true, message: "Added to wishlist" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error adding to wishlist" });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookId } = req.params;
    await pool.query("DELETE FROM wishlists WHERE user_id = $1 AND book_id = $2", [userId, bookId]);
    res.json({ success: true, message: "Removed from wishlist" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error removing from wishlist" });
  }
};
