import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Heart } from "lucide-react";

export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  coverImage: string;
  category: string;
  rating: number;
  description: string;
  image_url?: string;
}

interface BookCardProps {
  book: Book;
  onAddToCart: (book: Book) => void;
  onViewDetails?: (book: Book) => void;
  onToggleWishlist?: (book: Book) => void;
  isWishlisted?: boolean;
}

export function BookCard({ book, onAddToCart, onViewDetails, onToggleWishlist, isWishlisted }: BookCardProps) {
  const badges = ["Bestseller", "New", "-20%"];
  const badge = badges[Number(book.id) % badges.length];
  const handleCardClick = () => {
    console.log("Card clicked, book:", book);
    onViewDetails?.(book);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Add to cart clicked");
    onAddToCart(book);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist?.(book);
  };

  return (
    <div
      className="book-card group relative cursor-pointer"
      onClick={handleCardClick}
    >
      <span className="absolute top-3 left-3 z-10 rounded-full bg-accent text-accent-foreground text-[11px] px-2.5 py-1 font-semibold tracking-wide shadow-sm">
        {badge}
      </span>
      <button
        onClick={handleWishlistClick}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-background/90 border border-border flex items-center justify-center hover:bg-background transition-colors"
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? "fill-accent text-accent" : "text-accent"}`} />
      </button>
      <div className="book-cover aspect-[3/4] overflow-hidden p-2">
        <ImageWithFallback
          src={book.coverImage}
          alt={book.title}
          className="w-full h-full rounded-xl object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 mb-2 font-bold text-sm">{book.title}</h3>
        <p className="text-muted-foreground text-xs mb-2">{book.author}</p>
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-sm">
              {i < Math.floor(book.rating) ? "⭐" : "☆"}
            </span>
          ))}
          <span className="text-xs text-muted-foreground ml-1">
            ({book.rating})
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-lg text-accent">
            ${parseFloat(book.price as any).toFixed(2)}
          </span>
          <button
            onClick={handleAddToCart}
            className="bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 hover:shadow-md transition-all duration-300 font-semibold text-sm opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
