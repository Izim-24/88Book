import { useState } from "react";
import { BookCard, Book } from "./BookCard";
import { Search, SlidersHorizontal } from "lucide-react";

interface BrowsePageProps {
  books: Book[];
  onAddToCart: (book: Book) => void;
  onViewDetails?: (book: Book) => void;
  initialCategory?: string;
}

const categories = [
  "All",
  "Fiction",
  "Mystery",
  "Science",
  "Romance",
  "Fantasy",
  "Biography",
  "Self-Help",
  "Cooking",
  "Classic",
];

export function BrowsePage({
  books,
  onAddToCart,
  onViewDetails,
  initialCategory = "All",
}: BrowsePageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState<
    "title" | "price-low" | "price-high" | "rating"
  >("title");
  const [showFilters, setShowFilters] = useState(false);

  // Format books from API response to match Book interface
  const formattedBooks = books.map((book: any) => ({
    id: book.id.toString(),
    title: book.title,
    author: book.author,
    price: book.price,
    coverImage: book.image_url || "https://via.placeholder.com/300x400",
    category: book.category,
    rating: book.rating || 4.5, // Default rating if not in API
    description: book.description || "No description available",
    image_url: book.image_url,
  }));

  // Filter books
  const filteredBooks = formattedBooks.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || book.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Sort books
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      case "title":
      default:
        return a.title.localeCompare(b.title);
    }
  });

  return (
    <main className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="mb-8">Browse Books</h1>

        {/* Search and Filter Bar */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="title">Sort by Title</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>

            {/* Toggle Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Category Filters */}
          <div className={`${showFilters ? "block" : "hidden"} sm:block`}>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-muted-foreground mb-6">
          Showing {sortedBooks.length}{" "}
          {sortedBooks.length === 1 ? "book" : "books"}
        </p>

        {/* Books Grid */}
        {sortedBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onAddToCart={onAddToCart}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No books found matching your criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-4 text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
