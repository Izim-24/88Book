// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_ORIGIN = new URL(API_BASE_URL, window.location.origin).origin;

const resolveImageUrls = (value) => {
  if (Array.isArray(value)) return value.map(resolveImageUrls);
  if (!value || typeof value !== "object") return value;
  for (const [key, item] of Object.entries(value)) {
    if ((key === "image_url" || key === "coverImage") &&
        typeof item === "string" && item.startsWith("/uploads/")) {
      value[key] = `${API_ORIGIN}${item}`;
    } else if (item && typeof item === "object") {
      resolveImageUrls(item);
    }
  }
  return value;
};

class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    };

    // Add token if available
    const token = localStorage.getItem("authToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If response isn't JSON, create a basic error object
        data = {
          success: false,
          message: `Server error (HTTP ${response.status})`,
        };
      }

      if (!response.ok) {
        throw new Error(
          data.message || `API request failed (HTTP ${response.status})`,
        );
      }

      return resolveImageUrls(data);
    } catch (error) {
      console.error("API Error:", error);
      // Return error object instead of throwing, for better error handling in components
      return {
        success: false,
        message:
          error.message ||
          `Failed to connect to the API at ${API_BASE_URL}`,
      };
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  postForm(endpoint, formData) {
    return this.request(endpoint, { method: "POST", body: formData });
  }

  put(endpoint, body) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new APIClient(API_BASE_URL);

// Auth API
export const authAPI = {
  register: (email, password, fullName, role = "buyer") =>
    apiClient.post("/auth/register", { email, password, fullName, role }),
  login: (email, password) =>
    apiClient.post("/auth/login", { email, password }),
  getCurrentUser: () => apiClient.get("/auth/me"),
};

// Books API
export const booksAPI = {
  getAll: (
    page = 1,
    limit = 20,
    search,
    category,
    minPrice,
    maxPrice,
    sortBy,
  ) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (minPrice) params.set("minPrice", String(minPrice));
    if (maxPrice) params.set("maxPrice", String(maxPrice));
    if (sortBy) params.set("sortBy", sortBy);

    return apiClient.get(`/books?${params.toString()}`);
  },
  getById: (id) => apiClient.get(`/books/${id}`),
  getRecommendations: () => apiClient.get("/books/recommendations"),
  // selection: the marked target object as fractions { x, y, width, height }, or null.
  searchByImage: (image, selection = null) => {
    const formData = new FormData();
    formData.append("image", image);
    if (selection) formData.append("selection", JSON.stringify(selection));
    return apiClient.postForm("/books/search-by-image", formData);
  },
  getCategories: () => apiClient.get("/books/categories"),
  searchByCoverText: (text) =>
    apiClient.post("/books/search-by-image/text", { text }),
  searchByVoice: (text, lang = "vi-VN") =>
    apiClient.post("/books/search-by-voice", { text, lang }),
  create: (book) => apiClient.post("/books", book),
  update: (id, book) => apiClient.put(`/books/${id}`, book),
  delete: (id) => apiClient.delete(`/books/${id}`),
};

// Search API (SearchController in the design's sequence diagrams)
export const searchAPI = {
  getSuggestions: () => apiClient.get("/search/suggestions"),
  // record=false runs the search without saving it to the customer's history.
  byKeyword: (keyword, record = true) =>
    apiClient.post("/search/keyword", { keyword, record }),
};

// AI Recommendations API
export const recommendationsAPI = {
  getPersonalized: () => apiClient.get("/recommendations/personalized"),
  recordSearch: (query) =>
    apiClient.post("/recommendations/search-history", { query }),
  getAlsoBought: (bookId) =>
    apiClient.get(`/recommendations/books/${bookId}/also-bought`),
};

export const chatAPI = {
  getStatus: () => apiClient.get("/chat/status"),
  send: (message, history = [], preferredBookIds = []) =>
    apiClient.post("/chat", { message, history, preferredBookIds }),
};

// Cart API
export const cartAPI = {
  getCart: () => apiClient.get("/cart"),
  addItem: (bookId, quantity) => apiClient.post("/cart", { bookId, quantity }),
  updateItem: (cartItemId, quantity) =>
    apiClient.put(`/cart/${cartItemId}`, { quantity }),
  removeItem: (cartItemId) => apiClient.delete(`/cart/${cartItemId}`),
  clear: () => apiClient.delete("/cart"),
};

// Orders API
export const ordersAPI = {
  create: (shippingAddress, paymentMethod) =>
    apiClient.post("/orders", { shippingAddress, paymentMethod }),
  getAll: () => apiClient.get("/orders"),
  getById: (orderId) => apiClient.get(`/orders/${orderId}`),
  getTracking: (orderId) => apiClient.get(orderId === "demo" ? "/orders/demo/tracking" : `/orders/${orderId}/tracking`),
  cancel: (orderId) => apiClient.put(`/orders/${orderId}/cancel`, {}),
  // Admin endpoints
  getAdminAccepted: () => apiClient.get("/orders/admin/accepted"),
  approve: (orderId) => apiClient.put(`/orders/${orderId}/approve`, {}),
  updateStatus: (orderId, status) =>
    apiClient.put(`/orders/${orderId}/status`, { status }),
};

// Admin API
export const adminAPI = {
  getUsers: () => apiClient.get("/admin/users"),
  createUser: (user) => apiClient.post("/admin/users", user),
  updateUser: (userId, user) => apiClient.put(`/admin/users/${userId}`, user),
  deleteUser: (userId) => apiClient.delete(`/admin/users/${userId}`),
  updateUserRole: (userId, role) =>
    apiClient.put(`/admin/users/${userId}/role`, { role }),
  getBooks: (page = 1, limit = 20) =>
    apiClient.get(`/admin/books?page=${page}&limit=${limit}`),
  getRecommendations: () => apiClient.get("/admin/recommendations"),
  updateRecommendations: (bookIds) =>
    apiClient.put("/admin/recommendations", { bookIds }),
  getOrders: () => apiClient.get("/admin/orders"),
  getStats: () => apiClient.get("/admin/stats"),
  updateOrderStatus: (orderId, status) =>
    apiClient.put(`/admin/orders/${orderId}/status`, { status }),
};

// Users API
export const usersAPI = {
  getProfile: () => apiClient.get("/users/profile"),
  updateProfile: (profile) => apiClient.put("/users/profile", profile),
  changePassword: (currentPassword, newPassword) =>
    apiClient.put("/users/change-password", { currentPassword, newPassword }),
};

// Addresses API
export const addressesAPI = {
  getAll: () => apiClient.get("/users/addresses"),
  add: (address) => apiClient.post("/users/addresses", address),
  update: (id, address) => apiClient.put(`/users/addresses/${id}`, address),
  delete: (id) => apiClient.delete(`/users/addresses/${id}`),
};

// Wishlist API
export const wishlistAPI = {
  getAll: () => apiClient.get("/users/wishlist"),
  add: (bookId) => apiClient.post("/users/wishlist", { bookId }),
  remove: (bookId) => apiClient.delete(`/users/wishlist/${bookId}`),
};
