import React, { createContext, useContext, useState, useEffect } from "react";
import { cartAPI } from "../api/client";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch cart on mount or when auth changes
  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      if (response.success) {
        setCartItems(response.items);
        setTotalPrice(response.totalPrice);
        setItemCount(response.itemCount);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (bookId, quantity = 1) => {
    try {
      setError(null);
      const response = await cartAPI.addItem(bookId, quantity);
      if (response.success) {
        await fetchCart();
        return { success: true };
      }
    } catch (err) {
      const message = err.message || "Failed to add item";
      setError(message);
      return { success: false, message };
    }
  };

  const updateItem = async (cartItemId, quantity) => {
    try {
      setError(null);
      const response = await cartAPI.updateItem(cartItemId, quantity);
      if (response.success) {
        await fetchCart();
        return { success: true };
      }
    } catch (err) {
      const message = err.message || "Failed to update item";
      setError(message);
      return { success: false, message };
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      setError(null);
      const response = await cartAPI.removeItem(cartItemId);
      if (response.success) {
        await fetchCart();
        return { success: true };
      }
    } catch (err) {
      const message = err.message || "Failed to remove item";
      setError(message);
      return { success: false, message };
    }
  };

  const clearCart = async () => {
    try {
      setError(null);
      const response = await cartAPI.clear();
      if (response.success) {
        setCartItems([]);
        setTotalPrice(0);
        setItemCount(0);
        return { success: true };
      }
    } catch (err) {
      const message = err.message || "Failed to clear cart";
      setError(message);
      return { success: false, message };
    }
  };

  const value = {
    cartItems,
    totalPrice,
    itemCount,
    loading,
    error,
    fetchCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
