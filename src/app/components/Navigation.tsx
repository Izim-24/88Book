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
    <nav className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-8">
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

          <div className="hidden lg:flex flex-1 max-w-md">
            <button
              onClick={() => onNavigate("browse")}
              className="w-full h-11 px-4 rounded-full border border-border bg-secondary/70 text-muted-foreground text-sm flex items-center gap-2 hover:border-primary transition-colors"
            >
              <Search className="w-4 h-4" />
              Search by title, author, category...
            </button>
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