import { FormEvent, useEffect, useState } from "react";
import { ShoppingCart, BookOpen, Search, User, Package, ArrowLeft, LogOut } from "lucide-react";

interface NavigationProps {
  cartItemCount: number;
  onNavigate: (page: string) => void;
  currentPage: string;
  isLoggedIn?: boolean;
  userRole?: string;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onLogout?: () => void;
  onSearchSubmit?: (query: string) => void;
  searchSuggestions?: string[];
}

export function Navigation({
  cartItemCount,
  onNavigate,
  currentPage,
  isLoggedIn = false,
  userRole,
  canGoBack = false,
  onGoBack,
  onLogout,
  onSearchSubmit,
  searchSuggestions = [],
}: NavigationProps) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (currentPage !== "browse") {
      setQuery("");
    }
  }, [currentPage]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearchSubmit?.(query.trim());
    setShowSuggestions(false);
  };

  const filteredSuggestions = query.trim()
    ? searchSuggestions
        .filter((item) =>
          item.toLowerCase().includes(query.trim().toLowerCase()),
        )
        .slice(0, 6)
    : [];

  return (
    <nav className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-8">
            {canGoBack && onGoBack && (
              <button
                onClick={onGoBack}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Go back"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              onClick={() => onNavigate("home")}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <BookOpen className="w-6 h-6 text-primary" />
              <span className="font-semibold text-lg text-[#5A3E2B]">BookHaven</span>
            </button>

            <button
              onClick={() => onNavigate("browse")}
              className={`flex items-center gap-1 hover:text-foreground/80 transition-colors font-medium ${
                currentPage === "browse"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Categories
            </button>


          </div>

          <form onSubmit={handleSearchSubmit} className="hidden lg:flex flex-1 max-w-md relative">
            <div className="w-full h-11 px-4 rounded-full border border-border bg-secondary/70 text-sm flex items-center gap-2 hover:border-primary focus-within:border-primary transition-colors">
              <Search className="w-4 h-4" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 120);
                }}
                placeholder="Search by title, author, category..."
                className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </div>
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-12 left-0 right-0 bg-background border border-border rounded-xl shadow-lg z-50 py-2">
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setQuery(suggestion);
                      onSearchSubmit?.(suggestion);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </form>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onSearchSubmit?.(query.trim())}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            {isLoggedIn && userRole === "admin" && (
              <button
                onClick={() => onNavigate("admin")}
                className={`p-2 hover:bg-accent rounded-lg transition-colors ${
                  currentPage === "admin" ? "bg-accent" : ""
                }`}
                aria-label="Admin Dashboard"
                title="Admin Dashboard"
              >
                <Package className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => onNavigate("account")}
              className={`p-2 hover:bg-accent rounded-lg transition-colors ${
                currentPage === "account" ? "bg-accent" : ""
              }`}
              aria-label="Account"
              title={isLoggedIn ? "My Account" : "Sign In / Register"}
            >
              <User className="w-5 h-5" />
            </button>
            {isLoggedIn && onLogout && (
              <button
                onClick={onLogout}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => onNavigate("cart")}
              className="relative p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
