import { useState } from "react";
import { Banknote, CheckCircle, Loader2 } from "lucide-react";
import { ordersAPI } from "../../api/client";
import { formatVND } from "../utils/format";
import { calculateOrderTotals } from "../../../shared/orderPricing.js";

interface CheckoutPageProps {
  items: Array<{
    id: string;
    title: string;
    author: string;
    price: number;
    quantity: number;
  }>;
  onOrderPlaced?: () => void;
  onOrderComplete: () => void;
  onCancel: () => void;
}

export function CheckoutPage({
  items,
  onOrderPlaced,
  onOrderComplete,
  onCancel,
}: CheckoutPageProps) {
  const [step, setStep] = useState<"form" | "confirmation">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState<{
    items: CheckoutPageProps["items"];
    total: number;
    id: number | null;
  }>({ items: [], total: 0, id: null });
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    ward: "",
    district: "",
    province: "",
  });

  const { subtotal, tax, shipping, total: displayTotal } =
    calculateOrderTotals(items);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (items.length === 0) {
        setError("Your cart is empty");
        return;
      }

      const shippingAddress = `${formData.fullName.trim()} (${formData.phone.trim()}), ${formData.address.trim()}, ${formData.ward.trim()}, ${formData.district.trim()}, ${formData.province.trim()}`;
      const result = await ordersAPI.create(shippingAddress, "cash_on_delivery");

      if (result.success) {
        setConfirmedOrder({
          items: [...items],
          total: Number(result.order?.totalAmount ?? displayTotal),
          id: result.order?.id ?? null,
        });
        onOrderPlaced?.();
        setStep("confirmation");
      } else {
        setError(result.message || "Failed to create order");
      }
    } catch (err) {
      setError("Failed to process order. Please try again.");
      console.error("Order error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (step === "confirmation") {
    const confirmationItems =
      confirmedOrder.items.length > 0 ? confirmedOrder.items : items;
    const confirmationTotal = confirmedOrder.total || displayTotal;

    return (
      <main className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-card rounded-lg border border-border p-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="mb-4">Order placed</h1>
            <p className="text-muted-foreground mb-6">
              {confirmedOrder.id && `Order #${confirmedOrder.id} is confirmed. `}
              Pay when your books arrive. You can track the order in your account.
            </p>
            <div className="bg-muted rounded-lg p-6 mb-8">
              <h3 className="mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                {confirmationItems.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {item.title} x {item.quantity}
                    </span>
                    <span>{formatVND(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatVND(confirmationTotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Payment</span>
                    <span>
                      Pay on delivery
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={onOrderComplete}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:opacity-90 transition-opacity"
              >
                Continue Shopping
              </button>
              <p className="text-sm text-muted-foreground">
                Your books will be shipped to:
                <br />
                {formData.address}, {formData.ward}, {formData.district}, {formData.province}
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="mb-8">Checkout</h1>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping Information */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="mb-4">Delivery details</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="block mb-2">
                      Full name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      autoComplete="name"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block mb-2">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      autoComplete="tel"
                      inputMode="tel"
                      pattern="[0-9+(). -]{9,20}"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block mb-2">
                    Street and house number
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                  autoComplete="street-address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="ward" className="block mb-2">
                      Ward
                    </label>
                    <input
                      type="text"
                      id="ward"
                      name="ward"
                      required
                      value={formData.ward}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="district" className="block mb-2">
                      District
                    </label>
                    <input
                      type="text"
                      id="district"
                      name="district"
                      required
                      value={formData.district}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="province" className="block mb-2">
                      Province / City
                    </label>
                    <input
                      type="text"
                      id="province"
                      name="province"
                      autoComplete="address-level1"
                      required
                      value={formData.province}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-4">
                <Banknote className="w-5 h-5 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  <strong className="block text-foreground">Pay on delivery</strong>
                  No card details are needed. Payment is collected when your order arrives.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-6 sticky top-24">
              <h2 className="mb-4">Order Summary</h2>

              {error && (
                <div role="alert" className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm">
                      {formatVND(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-6 pb-6 border-b border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatVND(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatVND(shipping)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatVND(tax)}</span>
                </div>
              </div>

              <div className="flex justify-between font-semibold mb-6">
                <span>Total</span>
                <span className="text-lg">{formatVND(displayTotal)}</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Placing order..." : "Place order"}
              </button>

              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="w-full mt-2 bg-secondary text-secondary-foreground py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                Final total is calculated by the server before your order is saved.
              </p>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
