import { ShoppingCart, BookOpen, Search, User, Package } from "lucide-react";

interface NavigationProps {
  cartItemCount: number;
  onNavigate: (page: string) => void;
  currentPage: string;
  isLoggedIn?: boolean;
  userRole?: string;
}

export function Navigation({
  cartItemCount,
  onNavigate,
  currentPage,
  isLoggedIn = false,
  userRole,
}: NavigationProps) {
  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <button
              onClick={() => onNavigate("home")}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <BookOpen className="w-6 h-6" />
              <span className="font-semibold text-lg">BookHaven</span>
            </button>

            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => onNavigate("home")}
                className={`hover:text-foreground/80 transition-colors ${
                  currentPage === "home"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => onNavigate("browse")}
                className={`hover:text-foreground/80 transition-colors ${
                  currentPage === "browse"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Browse Books
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate("browse")}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            {isLoggedIn && userRole === "admin" && (
              <button
                onClick={() => onNavigate("seller")}
                className={`p-2 hover:bg-accent rounded-lg transition-colors ${
                  currentPage === "seller" ? "bg-accent" : ""
                }`}
                aria-label="Admin Dashboard"
                title="Manage Books"
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
