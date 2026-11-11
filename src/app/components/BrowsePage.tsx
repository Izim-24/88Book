import { FormEvent, useEffect, useState } from "react";
import { BookCard, Book } from "./BookCard";
import { booksAPI, searchAPI } from "../../api/client";
import { INVALID_KEYWORD_MESSAGE, isValidKeyword } from "./Navigation";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  BookOpen,
  Camera,
  Mic,
} from "lucide-react";

interface BrowsePageProps {
  books: Book[];
  onAddToCart: (book: Book) => void;
  onViewDetails?: (book: Book) => void;
  initialCategory?: string;
  initialSearchQuery?: string;
  initialSection?: "all" | "new-arrivals" | "top-rated";
  onToggleWishlist?: (book: Book) => void;
  wishlist?: Book[];
  onSearchRecorded?: (query: string) => void;
  onOpenImageSearch?: () => void;
  onOpenVoiceSearch?: () => void;
}

const sections = [
  { id: "all" as const, label: "All Books", icon: BookOpen },
  { id: "new-arrivals" as const, label: "New Arrivals", icon: Sparkles },
  { id: "top-rated" as const, label: "Top Rated", icon: TrendingUp },
];

export function BrowsePage({
  books,
  onAddToCart,
  onViewDetails,
  initialCategory = "All",
  initialSearchQuery = "",
  initialSection = "all",
  onToggleWishlist,
  wishlist,
  onSearchRecorded,
  onOpenImageSearch,
  onOpenVoiceSearch,
}: BrowsePageProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [activeSection, setActiveSection] = useState<
    "all" | "new-arrivals" | "top-rated"
  >(initialSection);
  const [sortBy, setSortBy] = useState<
    "title" | "price-low" | "price-high" | "rating"
  >("title");
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  // Book ids returned by the server's keyword search; null = no keyword active.
  const [matchingIds, setMatchingIds] = useState<Set<string> | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // CATEGORIES from the database (falls back to the categories of loaded books).
  useEffect(() => {
    booksAPI.getCategories().then((response: any) => {
      const names = response.success
        ? (response.categories || []).filter((item: any) => item.book_count > 0).map((item: any) => item.name)
        : Array.from(new Set(books.map((book: any) => book.category).filter(Boolean)));
      setCategories(["All", ...names]);
    });
  }, [books.length]);

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  // Keyword search runs on the server (accent-insensitive, word based) while
  // typing; it is saved to search history only when the customer submits it.
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setMatchingIds(null);
      setSearchError("");
      return;
    }
    if (!isValidKeyword(query)) {
      setMatchingIds(new Set());
      setSearchError(INVALID_KEYWORD_MESSAGE);
      return;
    }
    setSearchError("");
    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setSearching(true);
      const response: any = await searchAPI.byKeyword(query, false);
      if (cancelled) return;
      setSearching(false);
      if (response.success) {
        setMatchingIds(new Set((response.products || []).map((book: any) => String(book.id))));
      } else {
        setSearchError(response.message || "Search is unavailable.");
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!isValidKeyword(query)) {
      setSearchError(INVALID_KEYWORD_MESSAGE);
      return;
    }
    onSearchRecorded?.(query);
  };

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
    created_at: book.created_at,
  }));

  // Apply section filter first
  let sectionBooks = [...formattedBooks];
  let sectionBadge: string | undefined;
  if (activeSection === "new-arrivals") {
    sectionBadge = "New";
    sectionBooks = [...formattedBooks]
      .filter((book: any) => {
        if (!book.created_at) return true;
        const createdAt = new Date(book.created_at).getTime();
        const daysDiff = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
        return daysDiff <= 45;
      })
      .sort((a: any, b: any) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : Number(a.id);
        const bTime = b.created_at ? new Date(b.created_at).getTime() : Number(b.id);
        return bTime - aTime;
      })
      .slice(0, 12);
  } else if (activeSection === "top-rated") {
    sectionBadge = "Top Rated";
    sectionBooks = [...formattedBooks]
      .filter((book) => Number(book.rating) >= 4.5)
      .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
      .slice(0, 12);
  }

  // Filter books
  // "Filter search results": keyword, category and price range.
  const min = minPrice === "" ? null : Number(minPrice);
  const max = maxPrice === "" ? null : Number(maxPrice);
  const priceRangeInvalid = min !== null && max !== null && min > max;
  const filteredBooks = sectionBooks.filter((book) => {
    const matchesSearch = matchingIds === null || matchingIds.has(String(book.id));
    const matchesCategory =
      selectedCategory === "All" || book.category === selectedCategory;
    const price = Number(book.price);
    const matchesPrice = priceRangeInvalid ||
      ((min === null || price >= min) && (max === null || price <= max));
    return matchesSearch && matchesCategory && matchesPrice;
  });
  const keywordActive = matchingIds !== null;

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
        <h1 className="mb-6">Browse Books</h1>

        {/* Section Tabs */}
        <div className="mb-8">
          <div className="flex gap-2 p-1.5 bg-secondary/50 rounded-xl w-fit border border-border">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </button>
              );
            })}
          </div>
          {activeSection === "new-arrivals" && (
            <p className="mt-3 text-sm text-muted-foreground">
              ✨ Showing the latest books added to our collection
            </p>
          )}
          {activeSection === "top-rated" && (
            <p className="mt-3 text-sm text-muted-foreground">
              🔥 Showing the highest rated books loved by our readers
            </p>
          )}
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <form onSubmit={submitSearch} className="flex-1 relative" role="search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title, author or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                maxLength={100}
                aria-invalid={Boolean(searchError)}
                aria-describedby={searchError ? "browse-search-error" : undefined}
                className="w-full pl-10 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </form>

            <button type="button" onClick={onOpenVoiceSearch} className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border hover:bg-secondary" aria-label="Search by voice"><Mic className="w-5 h-5" /> Search by voice</button>
            <button type="button" onClick={onOpenImageSearch} className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border hover:bg-secondary" aria-label="Search by book cover"><Camera className="w-5 h-5" /> Search by image</button>

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

          {searchError && (
            <p id="browse-search-error" role="alert" className="text-sm text-red-700">{searchError}</p>
          )}

          {/* Category and price filters */}
          <div className={`${showFilters ? "block" : "hidden"} sm:block space-y-3`}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Price (₫)</span>
              <input
                type="number"
                min={0}
                step={1000}
                inputMode="numeric"
                placeholder="From"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                aria-label="Minimum price in VND"
                className="w-32 px-3 py-2 bg-input-background border border-border rounded-lg"
              />
              <span aria-hidden="true">–</span>
              <input
                type="number"
                min={0}
                step={1000}
                inputMode="numeric"
                placeholder="To"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                aria-label="Maximum price in VND"
                className="w-32 px-3 py-2 bg-input-background border border-border rounded-lg"
              />
              {priceRangeInvalid && <span role="alert" className="text-red-700">"From" must not exceed "To"</span>}
            </div>
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
        <p className="text-muted-foreground mb-6" aria-live="polite">
          {searching ? "Searching..." : <>Showing {sortedBooks.length} {sortedBooks.length === 1 ? "book" : "books"}</>}
        </p>

        {/* Books Grid */}
        {sortedBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                badge={sectionBadge}
                onAddToCart={onAddToCart}
                onViewDetails={onViewDetails}
                onToggleWishlist={onToggleWishlist}
                isWishlisted={wishlist?.some(
                  (w) => w.id.toString() === book.id.toString(),
                )}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {keywordActive && !searchError ? "No products found" : "No books found matching your criteria."}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setActiveSection("all");
                setMinPrice("");
                setMaxPrice("");
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
