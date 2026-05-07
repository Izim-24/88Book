import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          if (response.success) {
            setUser(response.user);
          }
        } catch (err) {
          console.error("Auth check failed:", err);
          setToken(null);
          localStorage.removeItem("authToken");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const register = async (email, password, fullName, role = "buyer") => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.register(email, password, fullName, role);

      if (response.success) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem("authToken", response.token);
        return { success: true, user: response.user };
      } else {
        const message = response.message || "Registration failed";
        setError(message);
        return { success: false, message };
      }
    } catch (err) {
      const message = err.message || "Registration failed";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.login(email, password);

      if (response.success) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem("authToken", response.token);
        return { success: true, user: response.user };
      } else {
        const message = response.message || "Login failed";
        setError(message);
        return { success: false, message };
      }
    } catch (err) {
      const message = err.message || "Login failed";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user && !!token,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
