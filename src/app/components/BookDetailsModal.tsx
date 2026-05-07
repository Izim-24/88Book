import { X, ShoppingCart, Star } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Book } from "./BookCard";

interface BookDetailsModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (book: Book) => void;
}

export function BookDetailsModal({
  book,
  isOpen,
  onClose,
  onAddToCart,
}: BookDetailsModalProps) {
  console.log(
    "BookDetailsModal render - isOpen:",
    isOpen,
    "book:",
    book?.title,
  );

  if (!isOpen || !book) {
    console.log("Modal not rendering - isOpen:", isOpen, "hasBook:", !!book);
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
            <h2 className="text-2xl font-bold">{book.title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Book Cover */}
              <div className="md:col-span-1">
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                  <ImageWithFallback
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Book Info */}
              <div className="md:col-span-2">
                {/* Author */}
                <p className="text-lg text-muted-foreground mb-3">
                  by{" "}
                  <span className="font-semibold text-foreground">
                    {book.author}
                  </span>
                </p>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-lg">
                        {i < Math.floor(Number(book.rating) || 4.5)
                          ? "⭐"
                          : "☆"}
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({(Number(book.rating) || 4.5).toFixed(1)})
                  </span>
                </div>

                {/* Category */}
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-semibold">{book.category}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-3xl font-bold text-primary">
                    ${parseFloat(book.price as any).toFixed(2)}
                  </p>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    Description
                  </p>
                  <p className="text-foreground leading-relaxed">
                    {book.description}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      onAddToCart(book);
                      onClose();
                    }}
                    className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-semibold"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
