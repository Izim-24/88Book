import { useState, useEffect } from "react";
import { Eye, Trash2, Edit2, Plus, ShieldCheck, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { adminAPI, booksAPI } from "../../api/client";

interface BookForm {
  id?: string;
  title: string;
  author: string;
  description: string;
  price: string;
  category: string;
  isbn: string;
  quantity: string;
  image_url: string;
}

interface AdminBook {
  id: number;
  title: string;
  author: string;
  description?: string;
  price: number;
  quantity: number;
  category: string;
  isbn?: string;
  image_url: string;
}

interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "buyer";
  created_at: string;
}

interface AdminDashboardProps {
  currentUserId?: number | string;
}

interface UserForm {
  id?: number;
  fullName: string;
  email: string;
  password: string;
  role: "admin" | "buyer";
}

export function AdminDashboard({
  currentUserId,
}: AdminDashboardProps) {
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [recommendationIds, setRecommendationIds] = useState<number[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingUser, setEditingUser] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");
  const [recommendationError, setRecommendationError] = useState("");
  const [recommendationSuccess, setRecommendationSuccess] = useState("");
  const [userForm, setUserForm] = useState<UserForm>({
    fullName: "",
    email: "",
    password: "",
    role: "buyer",
  });
  const [formData, setFormData] = useState<BookForm>({
    title: "",
    author: "",
    description: "",
    price: "",
    category: "",
    isbn: "",
    quantity: "",
    image_url: "",
  });

  // Fetch admin-managed books
  useEffect(() => {
    fetchBooks();
    fetchRecommendations();
    fetchUsers();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getBooks();
      if (response.success) {
        setBooks(response.books || []);
      } else {
        setError(response.message || "Failed to load books");
      }
    } catch (err) {
      setError("Error loading books");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await adminAPI.getUsers();
      if (response.success) {
        setUsers(response.users || []);
      } else {
        setUserError(response.message || "Failed to load users");
      }
    } catch (err) {
      setUserError("Error loading users");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    const response = await adminAPI.getRecommendations();
    if (response.success) {
      setRecommendationIds((response.books || []).map((book: AdminBook) => book.id));
    }
  };

  const handleRoleChange = async (
    userId: number,
    role: "admin" | "buyer",
  ) => {
    setUserError("");
    setUserSuccess("");

    if (Number(userId) === Number(currentUserId)) {
      setUserError("You cannot change your own role");
      return;
    }

    const response = await adminAPI.updateUserRole(userId, role);
    if (response.success) {
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? response.user : user)),
      );
      setUserSuccess("User role updated");
    } else {
      setUserError(response.message || "Failed to update user role");
    }
  };

  const resetUserForm = () => {
    setUserForm({
      fullName: "",
      email: "",
      password: "",
      role: "buyer",
    });
    setEditingUser(false);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError("");
    setUserSuccess("");

    const payload = {
      fullName: userForm.fullName,
      email: userForm.email,
      role: userForm.role,
      ...(userForm.password ? { password: userForm.password } : {}),
    };

    const response =
      editingUser && userForm.id
        ? await adminAPI.updateUser(userForm.id, payload)
        : await adminAPI.createUser({
            ...payload,
            password: userForm.password,
          });

    if (response.success) {
      if (editingUser) {
        setUsers((prev) =>
          prev.map((user) => (user.id === userForm.id ? response.user : user)),
        );
        setUserSuccess("User updated");
      } else {
        setUsers((prev) => [response.user, ...prev]);
        setUserSuccess("User created");
      }
      resetUserForm();
    } else {
      setUserError(response.message || "Failed to save user");
    }
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditingUser(true);
    setUserError("");
    setUserSuccess("");
    setUserForm({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      password: "",
      role: user.role,
    });
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    setUserError("");
    setUserSuccess("");
    const response = await adminAPI.deleteUser(userId);
    if (response.success) {
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      if (selectedUser?.id === userId) setSelectedUser(null);
      setUserSuccess("User deleted");
    } else {
      setUserError(response.message || "Failed to delete user");
    }
  };

  const toggleRecommendation = (bookId: number) => {
    setRecommendationError("");
    setRecommendationSuccess("");
    setRecommendationIds((prev) => {
      if (prev.includes(bookId)) {
        return prev.filter((id) => id !== bookId);
      }
      if (prev.length >= 6) {
        setRecommendationError("Recommendations can include up to 6 books");
        return prev;
      }
      return [...prev, bookId];
    });
  };

  const saveRecommendations = async () => {
    setRecommendationError("");
    setRecommendationSuccess("");
    const response = await adminAPI.updateRecommendations(recommendationIds);
    if (response.success) {
      setRecommendationIds((response.books || []).map((book: AdminBook) => book.id));
      setRecommendationSuccess("Recommendations updated");
      window.dispatchEvent(
        new CustomEvent("recommendations-updated", {
          detail: response.books || [],
        }),
      );
    } else {
      setRecommendationError(response.message || "Failed to update recommendations");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !formData.title ||
      !formData.author ||
      !formData.price ||
      !formData.quantity
    ) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const bookData = {
        title: formData.title,
        author: formData.author,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        isbn: formData.isbn,
        quantity: parseInt(formData.quantity),
        image_url: formData.image_url,
      };

      let response;
      if (editing && formData.id) {
        response = await booksAPI.update(formData.id, bookData);
      } else {
        response = await booksAPI.create(bookData);
      }

      if (response.success) {
        setSuccess(
          editing ? "Book updated successfully!" : "Book added successfully!",
        );
        setFormData({
          title: "",
          author: "",
          description: "",
          price: "",
          category: "",
          isbn: "",
          quantity: "",
          image_url: "",
        });
        setEditing(false);
        await fetchBooks();
      } else {
        setError(response.message || "Failed to save book");
      }
    } catch (err) {
      setError("Error saving book");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.currentTarget;
    const fieldName = id === "imageUrl" ? "image_url" : id;
    setFormData({ ...formData, [fieldName]: value });
  };

  const handleEdit = (book: AdminBook) => {
    setFormData({
      id: book.id.toString(),
      title: book.title,
      author: book.author,
      description: book.description || "",
      price: book.price.toString(),
      category: book.category,
      isbn: book.isbn || "",
      quantity: book.quantity.toString(),
      image_url: book.image_url,
    });
    setEditing(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this book?")) {
      try {
        setLoading(true);
        const response = await booksAPI.delete(id.toString());
        if (response.success) {
          setSuccess("Book deleted successfully!");
          await fetchBooks();
        } else {
          setError(response.message || "Failed to delete book");
        }
      } catch (err) {
        setError("Error deleting book");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      title: "",
      author: "",
      description: "",
      price: "",
      category: "",
      isbn: "",
      quantity: "",
      image_url: "",
    });
    setEditing(false);
    setError("");
  };

  return (
    <main className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({users.length})
            </CardTitle>
            <CardDescription>Manage account roles</CardDescription>
          </CardHeader>
          <CardContent>
            {userError && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-sm mb-4">
                {userError}
              </div>
            )}
            {userSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-lg text-sm mb-4">
                {userSuccess}
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <form onSubmit={handleUserSubmit} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="userFullName">Full Name</Label>
                  <Input
                    id="userFullName"
                    value={userForm.fullName}
                    onChange={(e) =>
                      setUserForm({ ...userForm, fullName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userEmail">Email</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={userForm.email}
                    onChange={(e) =>
                      setUserForm({ ...userForm, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userPassword">
                    {editingUser ? "New Password" : "Password"}
                  </Label>
                  <Input
                    id="userPassword"
                    type="password"
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm({ ...userForm, password: e.target.value })
                    }
                    required={!editingUser}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userRole">Role</Label>
                  <select
                    id="userRole"
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        role: e.target.value as "admin" | "buyer",
                      })
                    }
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingUser ? "Update User" : "Add User"}
                  </Button>
                  {editingUser && (
                    <Button type="button" variant="outline" onClick={resetUserForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>

              <div className="lg:col-span-2 space-y-3">
                {selectedUser && (
                  <div className="rounded-lg border border-border p-4 bg-secondary/40">
                    <p className="font-semibold">{selectedUser.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.email}
                    </p>
                    <p className="text-sm">Role: {selectedUser.role}</p>
                    <p className="text-sm text-muted-foreground">
                      Created:{" "}
                      {selectedUser.created_at
                        ? new Date(selectedUser.created_at).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                )}
                {usersLoading ? (
                  <p className="text-muted-foreground">Loading users...</p>
                ) : (
                  users.map((user) => {
                    const isCurrentUser =
                      Number(user.id) === Number(currentUserId);
                    return (
                      <div
                        key={user.id}
                        className="border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{user.full_name}</p>
                            {user.role === "admin" && (
                              <ShieldCheck className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={user.role}
                            disabled={isCurrentUser}
                            onChange={(event) =>
                              handleRoleChange(
                                user.id,
                                event.target.value as "admin" | "buyer",
                              )
                            }
                            className="h-10 rounded-md border border-border bg-background px-3 text-sm disabled:opacity-60"
                            aria-label={`Role for ${user.email}`}
                          >
                            <option value="buyer">Buyer</option>
                            <option value="admin">Admin</option>
                          </select>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={isCurrentUser}
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Recommendations ({recommendationIds.length})
            </CardTitle>
            <CardDescription>
              Choose books shown in the homepage Recommendations section
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendationError && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-sm">
                {recommendationError}
              </div>
            )}
            {recommendationSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-lg text-sm">
                {recommendationSuccess}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {books.map((book) => {
                const checked = recommendationIds.includes(book.id);
                return (
                  <label
                    key={`pick-${book.id}`}
                    className={`border rounded-lg p-3 flex gap-3 cursor-pointer ${
                      checked ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRecommendation(book.id)}
                      className="mt-1"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium truncate">
                        {book.title}
                      </span>
                      <span className="block text-xs text-muted-foreground truncate">
                        {book.author}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            <Button type="button" onClick={saveRecommendations}>
              Save Recommendations
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  {editing ? "Edit Book" : "Add New Book"}
                </CardTitle>
                <CardDescription>
                  {editing
                    ? "Update book details"
                    : "Add a new book to your inventory"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-lg text-sm">
                      {success}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="title">Book Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter book title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="author">Author *</Label>
                    <Input
                      id="author"
                      placeholder="Enter author name"
                      value={formData.author}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      placeholder="e.g., Fiction, Science, Mystery"
                      value={formData.category}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      placeholder="Enter ISBN"
                      value={formData.isbn}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="19.99"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="10"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Brief description of the book"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Cover Image URL</Label>
                    <Input
                      id="imageUrl"
                      placeholder="https://example.com/image.jpg"
                      value={formData.image_url}
                      onChange={handleInputChange}
                    />
                    {formData.image_url && (
                      <img
                        src={formData.image_url}
                        alt="Cover preview"
                        className="h-32 w-24 rounded-md border border-border object-cover"
                      />
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? "Saving..." : editing ? "Update" : "Add Book"}
                    </Button>
                    {editing && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Books List Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Books ({books.length})</CardTitle>
                <CardDescription>Manage store inventory</CardDescription>
              </CardHeader>
              <CardContent>
                {loading && <p className="text-muted-foreground">Loading...</p>}
                {books.length === 0 && !loading && (
                  <p className="text-muted-foreground text-center py-8">
                    No books yet. Add your first book!
                  </p>
                )}
                {books.length > 0 && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {books.map((book) => (
                      <div
                        key={book.id}
                        className="border border-border rounded-lg p-4 flex items-start justify-between gap-4"
                      >
                        <div className="flex gap-4 flex-1 min-w-0">
                          <img
                            src={
                              book.image_url ||
                              "https://via.placeholder.com/120x160?text=Book"
                            }
                            alt={book.title}
                            className="h-24 w-16 rounded-md border border-border object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h3 className="font-semibold truncate">
                              {book.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {book.author}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
                              <span>Category: {book.category || "N/A"}</span>
                              <span>
                                Price: ${parseFloat(book.price as any).toFixed(2)}
                              </span>
                              <span className="text-blue-600">
                                Stock: {book.quantity}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(book)}
                            disabled={loading}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(book.id)}
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
