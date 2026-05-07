import pool from "../config/database.js";

export const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookId, quantity } = req.body;

    if (!bookId || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Book ID and valid quantity are required",
      });
    }

    // Check if book exists and has quantity
    const bookResult = await pool.query("SELECT * FROM books WHERE id = $1", [
      bookId,
    ]);
    if (bookResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Check if item already in cart
    const existingResult = await pool.query(
      "SELECT * FROM cart_items WHERE user_id = $1 AND book_id = $2",
      [userId, bookId],
    );

    if (existingResult.rows.length > 0) {
      // Update quantity
      const updatedQty = existingResult.rows[0].quantity + quantity;
      await pool.query(
        "UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND book_id = $3",
        [updatedQty, userId, bookId],
      );
    } else {
      // Add new item
      await pool.query(
        "INSERT INTO cart_items (user_id, book_id, quantity) VALUES ($1, $2, $3)",
        [userId, bookId, quantity],
      );
    }

    res.json({
      success: true,
      message: "Item added to cart",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error adding to cart",
    });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT 
        ci.id, ci.book_id, ci.quantity, 
        b.title, b.author, b.price, b.image_url,
        (ci.quantity * b.price) as total
      FROM cart_items ci
      JOIN books b ON ci.book_id = b.id
      WHERE ci.user_id = $1`,
      [userId],
    );

    const items = result.rows;
    const totalPrice = items.reduce(
      (sum, item) => sum + parseFloat(item.total),
      0,
    );

    res.json({
      success: true,
      items,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      itemCount: items.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching cart",
    });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required",
      });
    }

    const result = await pool.query(
      "UPDATE cart_items SET quantity = $1 OUTPUT INSERTED.* WHERE id = $2 AND user_id = $3",
      [quantity, cartItemId, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    res.json({
      success: true,
      message: "Cart item updated",
      item: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating cart item",
    });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cartItemId } = req.params;

    const result = await pool.query(
      "DELETE FROM cart_items OUTPUT DELETED.id WHERE id = $1 AND user_id = $2",
      [cartItemId, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    res.json({
      success: true,
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error removing from cart",
    });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    await pool.query("DELETE FROM cart_items WHERE user_id = $1", [userId]);

    res.json({
      success: true,
      message: "Cart cleared",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error clearing cart",
    });
  }
};
