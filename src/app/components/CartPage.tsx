/* @ts-nocheck */
import { Book } from "./BookCard";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export interface CartItem extends Book {
  quantity: number;
}

interface CartPageProps {
  cart: CartItem[];
  onUpdateQuantity: (bookId: string, newQuantity: number) => void;
  onRemoveItem: (bookId: string) => void;
  onCheckout: () => void;
}

export function CartPage({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartPageProps) {
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const tax = subtotal * 0.08; // 8% tax
  const shipping = cart.length > 0 ? 5.99 : 0;
  const total = subtotal + tax + shipping;

  if (cart.length === 0) {
    return (
      <main className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="mb-8">Shopping Cart</h1>
          <div className="text-center py-16 bg-card rounded-lg border border-border">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Add some books to get started!
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="mb-8">
          Shopping Cart ({cart.length} {cart.length === 1 ? "item" : "items"})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-card rounded-lg border border-border p-4 flex gap-4"
              >
                <div className="w-24 h-32 flex-shrink-0 rounded overflow-hidden bg-muted">
                  <ImageWithFallback
                    src={item.coverImage}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="line-clamp-1 mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    {item.author}
                  </p>
                  <p className="font-semibold mb-4">
                    ${parseFloat(item.price as any).toFixed(2)}
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-secondary rounded-lg">
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity - 1)
                        }
                        className="p-2 hover:bg-accent rounded-l-lg transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity + 1)
                        }
                        className="p-2 hover:bg-accent rounded-r-lg transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-6 sticky top-24">
              <h2 className="mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onCheckout}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:opacity-90 transition-opacity"
              >
                Proceed to Checkout
              </button>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                Free shipping on orders over $50
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
