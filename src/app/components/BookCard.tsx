import { ImageWithFallback } from "./figma/ImageWithFallback";

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
}

export function BookCard({ book, onAddToCart, onViewDetails }: BookCardProps) {
  const handleCardClick = () => {
    console.log("Card clicked, book:", book);
    onViewDetails?.(book);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Add to cart clicked");
    onAddToCart(book);
  };

  return (
    <div
      className="group bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="aspect-[3/4] overflow-hidden bg-muted">
        <ImageWithFallback
          src={book.coverImage}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
            className="bg-accent text-accent-foreground px-3 py-2 rounded-lg hover:bg-accent/90 hover:shadow-md transition-all font-semibold text-sm"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
