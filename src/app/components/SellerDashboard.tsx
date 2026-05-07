import { useState, useEffect } from "react";
import { Trash2, Edit2, Plus } from "lucide-react";
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
import { booksAPI, sellerAPI } from "../../api/client";

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

interface SellerBook {
  id: number;
  title: string;
  author: string;
  price: number;
  quantity: number;
  category: string;
  image_url: string;
}

export function SellerDashboard() {
  const [books, setBooks] = useState<SellerBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  // Fetch seller's books
  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await sellerAPI.getBooks();
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

  const handleEdit = (book: SellerBook) => {
    setFormData({
      id: book.id.toString(),
      title: book.title,
      author: book.author,
      description: "",
      price: book.price.toString(),
      category: book.category,
      isbn: "",
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
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      placeholder="https://example.com/image.jpg"
                      value={formData.image_url}
                      onChange={handleInputChange}
                    />
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
                <CardTitle>My Books ({books.length})</CardTitle>
                <CardDescription>Manage your book inventory</CardDescription>
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
                        className="border border-border rounded-lg p-4 flex items-start justify-between"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold">{book.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {book.author}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span>Category: {book.category || "N/A"}</span>
                            <span>
                              Price: ${parseFloat(book.price as any).toFixed(2)}
                            </span>
                            <span className="text-blue-600">
                              Stock: {book.quantity}
                            </span>
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
