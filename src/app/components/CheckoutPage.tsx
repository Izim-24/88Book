import { useState } from "react";
import { CartItem } from "./CartPage";
import { CheckCircle } from "lucide-react";
import { ordersAPI } from "../../api/client";

interface CheckoutPageProps {
  items: Array<{
    id: string;
    title: string;
    author: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  onOrderComplete: () => void;
  onCancel: () => void;
}

export function CheckoutPage({
  items,
  total,
  onOrderComplete,
  onCancel,
}: CheckoutPageProps) {
  const [step, setStep] = useState<"form" | "confirmation">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const tax = subtotal * 0.08;
  const shipping = 5.99;
  const calculatedTotal = subtotal + tax + shipping;

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
      // Create order in backend
      const shippingAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`;
      const result = await ordersAPI.create(shippingAddress, "credit_card");

      if (result.success) {
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
    return (
      <main className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-card rounded-lg border border-border p-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="mb-4">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for your purchase! We've sent a confirmation email to{" "}
              <span className="font-medium text-foreground">
                {formData.email}
              </span>
              .
            </p>
            <div className="bg-muted rounded-lg p-6 mb-8">
              <h3 className="mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {item.title} x {item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${calculatedTotal.toFixed(2)}</span>
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
                {formData.address}, {formData.city}, {formData.state}{" "}
                {formData.zipCode}
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
            {/* Contact Information */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="mb-4">Contact Information</h2>
              <div>
                <label htmlFor="email" className="block mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="mb-4">Shipping Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="zipCode" className="block mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      required
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="mb-4">Payment Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="cardNumber" className="block mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    id="cardNumber"
                    name="cardNumber"
                    required
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="expiryDate" className="block mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      id="expiryDate"
                      name="expiryDate"
                      required
                      placeholder="MM/YY"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="cvv" className="block mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      id="cvv"
                      name="cvv"
                      required
                      placeholder="123"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-6 sticky top-24">
              <h2 className="mb-4">Order Summary</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
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
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-6 pb-6 border-b border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between font-semibold mb-6">
                <span>Total</span>
                <span className="text-lg">${calculatedTotal.toFixed(2)}</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Complete Order"}
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
                Your payment information is secure and encrypted
              </p>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
