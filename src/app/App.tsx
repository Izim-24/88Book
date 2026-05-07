/* @ts-nocheck */
import { useState, useEffect } from "react";
import { Navigation } from "./components/Navigation";
import { BookCard, Book } from "./components/BookCard";
import { BrowsePage } from "./components/BrowsePage";
import { CartPage, CartItem } from "./components/CartPage";
import { CheckoutPage } from "./components/CheckoutPage";
import {
  AccountPage,
  UserProfile,
  Order,
  Address,
} from "./components/AccountPage";
import { SellerDashboard } from "./components/SellerDashboard";
import { BookDetailsModal } from "./components/BookDetailsModal";
import {
  ArrowRight,
  Star,
  TrendingUp,
  Search,
  Sparkles,
  FlaskConical,
  Heart,
  Wand2,
  UserRound,
  BookMarked,
  BookHeart,
  ChefHat,
  Drama,
  Leaf,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { CartProvider, useCart } from "../contexts/CartContext";
import { booksAPI, ordersAPI, addressesAPI, wishlistAPI, usersAPI } from "../api/client";

function AppContent() {
  const [currentPage, setCurrentPage] = useState("home");
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [browseSearchQuery, setBrowseSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { user, isAuthenticated, logout, login, register } = useAuth();
  const {
    cartItems,
    itemCount: cartItemCount,
    addItem,
    removeItem,
    updateItem,
    fetchCart,
  } = useCart();

  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlist, setWishlist] = useState<Book[]>([]);

  // Map auth user to AccountPage user profile
  const mockUser = {
    name: user?.fullName || "Guest",
    email: user?.email || "",
    phone: "",
    joinedDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""
  };

  const handleUpdateProfile = async (profile: UserProfile) => {
    if (!user?.id) return;
    const res = await usersAPI.updateProfile(user.id, { fullName: profile.name, email: profile.email });
    if (res.success) {
      alert("Profile updated successfully!");
    } else {
      alert(res.message || "Failed to update profile");
    }
  };

  // Fetch books on mount
  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        const response = await booksAPI.getAll(
          1,
          50,
          "",
          selectedCategory !== "All" ? selectedCategory : "",
        );
        if (response.success) {
          setBooks(response.books);
        }
      } catch (error) {
        console.error("Error loading books:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [selectedCategory]);

  // Reveal on scroll animation
  useEffect(() => {
    const nodes = document.querySelectorAll(".reveal-on-scroll");
    if (!nodes.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [currentPage, books.length]);

  // Fetch cart and user data when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      
      ordersAPI.getAll().then(res => {
        if (res.success) {
          setOrders(res.orders.map((o: any) => ({
            id: `ORD-${o.id}`,
            date: new Date(o.created_at).toLocaleDateString(),
            total: Number(o.total_amount),
            status: o.status,
            items: o.items ? o.items.map((i: any) => ({
              bookTitle: i.bookTitle || `Book #${i.bookId}`,
              quantity: i.quantity,
              price: Number(i.price)
            })) : []
          })));
        }
      });
      
      addressesAPI.getAll().then(res => {
        if (res.success) setAddresses(res.addresses);
      });
      
      wishlistAPI.getAll().then(res => {
        if (res.success) {
          setWishlist(res.wishlist.map((b: any) => ({
             id: b.id.toString(),
             title: b.title,
             author: b.author,
             price: Number(b.price),
             coverImage: b.coverImage || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
             category: b.category || "General",
             rating: Number(b.rating) || 4.5,
             description: b.description || "No description available"
          })));
        }
      });
    } else {
      setOrders([]);
      setAddresses([]);
      setWishlist([]);
    }
  }, [isAuthenticated, fetchCart]);

  const handleAddToCart = async (book: Book) => {
    if (!isAuthenticated) {
      alert("Please login to add items to cart");
      handleNavigate("account");
      return;
    }
    const result = await addItem(book.id, 1);
    if (result.success) {
      alert("Item added to cart!");
    }
  };

  const handleUpdateQuantity = async (bookId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      const item = cartItems.find((i: any) => i.book_id === parseInt(bookId));
      if (item) {
        await removeItem(item.id);
      }
      return;
    }
    const item = cartItems.find((i: any) => i.book_id === parseInt(bookId));
    if (item) {
      await updateItem(item.id, newQuantity);
    }
  };

  const handleRemoveItem = async (bookId: string) => {
    const item = cartItems.find((i: any) => i.book_id === parseInt(bookId));
    if (item) {
      await removeItem(item.id);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      alert("Please login to checkout");
      handleNavigate("account");
      return;
    }
    handleNavigate("checkout");
  };

  const handleOrderComplete = () => {
    handleNavigate("home");
  };

  const handleLogout = () => {
    logout();
    handleNavigate("home");
  };

  const handleAddAddress = async (newAddress: Omit<Address, "id">) => {
    const res = await addressesAPI.add(newAddress);
    if (res.success) {
      setAddresses(prev => [res.address, ...prev]);
    } else {
      alert("Failed to add address");
    }
  };

  const handleUpdateAddress = async (updatedAddress: Address) => {
    const res = await addressesAPI.update(updatedAddress.id, updatedAddress);
    if (res.success) {
      setAddresses(prev => prev.map(a => a.id === updatedAddress.id ? res.address : a));
    } else {
      alert("Failed to update address");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const res = await addressesAPI.delete(id);
    if (res.success) {
      setAddresses(prev => prev.filter(a => a.id !== id));
    } else {
      alert("Failed to delete address");
    }
  };

  const handleToggleWishlist = async (book: Book) => {
    if (!isAuthenticated) {
      alert("Please login to use wishlist");
      handleNavigate("account");
      return;
    }
    const isWishlisted = wishlist.some(b => b.id.toString() === book.id.toString());
    if (isWishlisted) {
      const res = await wishlistAPI.remove(book.id);
      if (res.success) setWishlist(prev => prev.filter(b => b.id.toString() !== book.id.toString()));
    } else {
      const res = await wishlistAPI.add(book.id);
      if (res.success) setWishlist(prev => [book, ...prev]);
    }
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setBrowseSearchQuery(searchQuery.trim());
    handleNavigate("browse");
  };

  const handleNavigate = (page: string) => {
    if (page === currentPage) {
      return;
    }
    setPageHistory((prev) => [...prev, currentPage]);
    setCurrentPage(page);
  };

  const handleGoBack = () => {
    setPageHistory((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      const lastPage = prev[prev.length - 1];
      setCurrentPage(lastPage);
      return prev.slice(0, -1);
    });
  };

  const handleTopSearch = (query: string) => {
    setBrowseSearchQuery(query);
    if (currentPage !== "browse") {
      handleNavigate("browse");
    }
  };

  const categoryIconMap: Record<string, any> = {
    Fiction: Sparkles,
    Mystery: Drama,
    Science: FlaskConical,
    Fantasy: Wand2,
    Biography: UserRound,
    Romance: Heart,
    "Self-Help": BookHeart,
    Cooking: ChefHat,
    Classic: BookMarked,
  };

  // Filtered books for special pages
  const newArrivals = [...books].sort((a, b) => b.id - a.id).slice(0, 12);
  const bestsellers = [...books].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0)).slice(0, 12);

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        cartItemCount={cartItemCount}
        onNavigate={handleNavigate}
        currentPage={currentPage}
        isLoggedIn={isAuthenticated}
        userRole={user?.role}
        canGoBack={pageHistory.length > 0}
        onGoBack={handleGoBack}
        onSearchSubmit={handleTopSearch}
      />

      {currentPage === "home" && (
        <main>
          {/* Hero Section */}
          <section className="relative py-16 px-4 sm:px-6 lg:px-8 nature-bg paper-texture overflow-hidden">
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  'url("https://images.unsplash.com/photo-1512820790803-83ca734da794?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600")',
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-4 font-serif leading-tight text-[#3E2B1F]">
                  Discover stories that feel like home
                </h1>
                <p className="text-lg text-[#5A3E2B] mb-8 max-w-xl">
                  Find inspiring books for every day, in a cozy reading space
                  connected to nature.
                </p>
                <form
                  onSubmit={handleHeroSearch}
                  className="mb-5 flex items-center bg-background border border-border rounded-full px-4 h-12 shadow-sm max-w-xl"
                >
                  <Search className="w-4 h-4 text-muted-foreground mr-2" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, author, or category..."
                    className="flex-1 bg-transparent border-0 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
                  >
                    Search
                  </button>
                </form>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleNavigate("browse")}
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-semibold glow-cta"
                  >
                    Explore new books <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleNavigate("bestsellers")}
                    className="inline-flex items-center justify-center px-6 py-3 bg-background border border-border text-foreground rounded-lg hover:bg-secondary transition-colors font-semibold"
                  >
                    View bestsellers
                  </button>
                </div>
              </div>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1474932430478-367dbb6832c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900"
                  alt="Cozy reading corner"
                  className="w-full h-[420px] object-cover rounded-[28px] border border-border shadow-[0_20px_50px_rgba(90,62,43,0.16)]"
                />
              </div>
            </div>
          </section>

          {/* Featured Books */}
          <section className="section-block px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                  Featured Books
                </h2>
                <button
                  onClick={() => handleNavigate("browse")}
                  className="text-accent hover:text-accent/80 hover:underline flex items-center font-bold transition-colors"
                >
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading books...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {books.slice(0, 8).map((book) => (
                    <BookCard
                      key={book.id}
                      book={{
                        id: book.id.toString(),
                        title: book.title,
                        author: book.author,
                        price: book.price,
                        coverImage:
                          book.image_url ||
                          "https://images.unsplash.com/photo-1507842872392-6f3ee53daf26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
                        category: book.category,
                        rating: Number(book.rating) || 4.5,
                        description:
                          book.description || "No description available",
                      }}
                      onAddToCart={handleAddToCart}
                      onViewDetails={(book) => {
                        setSelectedBook(book);
                        setIsModalOpen(true);
                      }}
                      onToggleWishlist={handleToggleWishlist}
                      isWishlisted={wishlist.some((w) => w.id.toString() === book.id.toString())}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Staff Picks */}
          <section className="section-block section-soft px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold mb-2">Staff Picks</h2>
              <p className="text-muted-foreground mb-8">
                Recommendations handpicked by the BookHaven team from readers'
                favorite titles.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {books.slice(4, 7).map((book) => (
                  <article
                    key={`staff-${book.id}`}
                    className="reveal-on-scroll bg-card border border-border rounded-2xl p-5"
                  >
                    <p className="text-xs uppercase tracking-wide text-primary mb-2">
                      Staff recommends
                    </p>
                    <h3 className="text-xl font-semibold mb-1">{book.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      by {book.author}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedBook({
                          ...book,
                          id: book.id.toString(),
                          coverImage: book.image_url || "https://via.placeholder.com/400",
                          rating: Number(book.rating) || 4.5,
                          description: book.description || "No description available"
                        });
                        setIsModalOpen(true);
                      }}
                      className="text-accent font-semibold hover:underline"
                    >
                      Read why we picked this
                    </button>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* Popular Categories Section */}
          <section className="section-block section-soft px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold mb-2">
                  Popular Categories
                </h2>
                <p className="text-muted-foreground text-lg">
                  Explore our most popular book categories
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  "Fiction",
                  "Mystery",
                  "Science",
                  "Fantasy",
                  "Biography",
                  "Romance",
                  "Self-Help",
                  "Cooking",
                  "Classic",
                ].map((category) => {
                  const count = books.filter(
                    (b) => b.category === category,
                  ).length;
                  const Icon = categoryIconMap[category] || BookMarked;
                  return (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        handleNavigate("browse");
                      }}
                      className="category-card text-center font-semibold group"
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2 text-accent transition-transform duration-300 group-hover:scale-110" />
                      <h3 className="font-bold mb-2 text-foreground group-hover:text-accent transition-colors">
                        {category}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {count} {count === 1 ? "book" : "books"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </main>
      )}

      {currentPage === "browse" && (
        <BrowsePage
          books={books}
          onAddToCart={handleAddToCart}
          onViewDetails={(book) => {
            setSelectedBook(book);
            setIsModalOpen(true);
          }}
          initialCategory={selectedCategory}
          initialSearchQuery={browseSearchQuery}
          onToggleWishlist={handleToggleWishlist}
          wishlist={wishlist}
        />
      )}

      {currentPage === "new-arrivals" && (
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="mb-8">New Arrivals</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.map((book) => (
                <BookCard
                  key={book.id}
                  book={{
                    ...book,
                    id: book.id.toString(),
                    coverImage: book.image_url || "https://via.placeholder.com/400",
                    rating: Number(book.rating) || 4.5,
                    description: book.description || "No description available"
                  }}
                  onAddToCart={handleAddToCart}
                  onViewDetails={(b) => {
                    setSelectedBook(b);
                    setIsModalOpen(true);
                  }}
                  onToggleWishlist={handleToggleWishlist}
                  isWishlisted={wishlist.some((w) => w.id.toString() === book.id.toString())}
                />
              ))}
            </div>
          </div>
        </main>
      )}

      {currentPage === "bestsellers" && (
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="mb-8">Bestsellers</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestsellers.map((book) => (
                <BookCard
                  key={book.id}
                  book={{
                    ...book,
                    id: book.id.toString(),
                    coverImage: book.image_url || "https://via.placeholder.com/400",
                    rating: Number(book.rating) || 4.5,
                    description: book.description || "No description available"
                  }}
                  onAddToCart={handleAddToCart}
                  onViewDetails={(b) => {
                    setSelectedBook(b);
                    setIsModalOpen(true);
                  }}
                  onToggleWishlist={handleToggleWishlist}
                  isWishlisted={wishlist.some((w) => w.id.toString() === book.id.toString())}
                />
              ))}
            </div>
          </div>
        </main>
      )}

      {currentPage === "cart" && (
        <CartPage
          cart={cartItems.map((item: any) => ({
            id: item.book_id.toString(),
            title: item.title,
            author: item.author,
            price: item.price,
            coverImage: item.image_url || "https://via.placeholder.com/300x400",
            quantity: item.quantity,
          }))}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCheckout={handleCheckout}
        />
      )}

      {currentPage === "checkout" && (
        <CheckoutPage
          items={cartItems.map((item: any) => ({
            id: item.book_id.toString(),
            title: item.title,
            author: item.author,
            price: item.price,
            quantity: item.quantity,
          }))}
          total={cartItems.reduce(
            (sum: number, item: any) => sum + item.price * item.quantity,
            0,
          )}
          onOrderComplete={handleOrderComplete}
          onCancel={() => handleNavigate("cart")}
        />
      )}

      {currentPage === "account" && (
        <AccountPage
          user={mockUser}
          orders={orders}
          addresses={addresses}
          wishlist={wishlist}
          isLoggedIn={isAuthenticated}
          onUpdateProfile={handleUpdateProfile}
          onAddAddress={handleAddAddress}
          onUpdateAddress={handleUpdateAddress}
          onDeleteAddress={handleDeleteAddress}
          onRemoveFromWishlist={(bookId) => handleToggleWishlist({ id: bookId } as any)}
          onLogout={handleLogout}
          onLogin={login}
          onRegister={register}
        />
      )}

      {currentPage === "seller" && user?.role === "admin" && (
        <SellerDashboard />
      )}

      <BookDetailsModal
        book={selectedBook}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBook(null);
        }}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}