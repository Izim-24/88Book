/* @ts-nocheck */
import { useState } from "react";
import { User, Package, MapPin, Settings, Heart, LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Book } from "./BookCard";
import { DeliveryTrackingDialog } from "./DeliveryTrackingDialog";
import { formatVND } from "../utils/format";

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  joinedDate: string;
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status:
    | "accepted"
    | "pending"
    | "processing"
    | "approved"
    | "shipped"
    | "delivered"
    | "cancelled";
  items: {
    bookTitle: string;
    quantity: number;
    price: number;
  }[];
}

export interface Address {
  id: string;
  label: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

interface AccountPageProps {
  user: UserProfile;
  orders: Order[];
  addresses: Address[];
  wishlist: Book[];
  isLoggedIn?: boolean;
  onLogout: () => void;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  onUpdateProfile: (profile: UserProfile) => void;
  onAddAddress: (address: Omit<Address, "id">) => void;
  onUpdateAddress: (address: Address) => void;
  onDeleteAddress: (id: string) => void;
  onRemoveFromWishlist: (bookId: string) => void;
  onCancelOrder: (orderId: string) => Promise<{ success: boolean; message?: string }>;
  onLogin?: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  onRegister?: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ success: boolean; message?: string }>;
}

export function AccountPage({
  user,
  orders,
  addresses,
  wishlist,
  isLoggedIn = false,
  onLogout,
  onChangePassword,
  onUpdateProfile,
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
  onRemoveFromWishlist,
  onCancelOrder,
  onLogin,
  onRegister,
}: AccountPageProps) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(user);
  const [addingAddress, setAddingAddress] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelSaving, setCancelSaving] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const confirmCancelOrder = async (orderId: string) => {
    setCancelSaving(true);
    setCancelError("");
    const result = await onCancelOrder(orderId.replace(/^ORD-/, ""));
    setCancelSaving(false);
    if (result.success) setCancelTarget(null);
    else setCancelError(result.message || "Could not cancel this order.");
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordForm.next.length < 8) return setPasswordMessage("New password must be at least 8 characters.");
    if (passwordForm.next !== passwordForm.confirm) return setPasswordMessage("New passwords do not match.");
    setPasswordSaving(true);
    const result = await onChangePassword(passwordForm.current, passwordForm.next);
    setPasswordSaving(false);
    setPasswordMessage(result.message || (result.success ? "Password changed." : "Could not change password."));
    if (result.success) setPasswordForm({ current: "", next: "", confirm: "" });
  };
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    fullName: "",
  });
  const [newAddress, setNewAddress] = useState({
    label: "",
    name: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Vietnam",
    isDefault: false,
  });


  const handleSaveProfile = () => {
    onUpdateProfile(profileForm);
    setEditingProfile(false);
  };

  const handleAddAddress = () => {
    onAddAddress(newAddress);
    setNewAddress({
      label: "",
      name: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Vietnam",
      isDefault: false,
    });
    setAddingAddress(false);
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
      case "processing":
      case "approved":
      case "accepted":
        return "bg-green-600";
      case "delivered":
        return "bg-green-500";
      case "shipped":
        return "bg-blue-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: Order["status"]) => {
    if (
      status === "accepted" ||
      status === "pending" ||
      status === "processing" ||
      status === "approved"
    ) {
      return "Accepted";
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      if (authMode === "login" && onLogin) {
        const result = await onLogin(authForm.email, authForm.password);
        if (!result.success) {
          setAuthError(result.message || "Login failed");
        }
      } else if (authMode === "register" && onRegister) {
        const result = await onRegister(
          authForm.email,
          authForm.password,
          authForm.fullName,
        );
        if (!result.success) {
          setAuthError(result.message || "Registration failed");
        }
      }
    } catch (error) {
      setAuthError("An error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Show login/register form if not logged in
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl mb-2">
                {authMode === "login" ? "Sign In" : "Create Account"}
              </CardTitle>
              <CardDescription>
                {authMode === "login"
                  ? "Welcome back! Please sign in to your account."
                  : "Join us and start shopping today!"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === "register" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={authForm.fullName}
                        onChange={(e) =>
                          setAuthForm({ ...authForm, fullName: e.target.value })
                        }
                        required
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={authForm.email}
                    onChange={(e) =>
                      setAuthForm({ ...authForm, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={authForm.password}
                    onChange={(e) =>
                      setAuthForm({ ...authForm, password: e.target.value })
                    }
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={authLoading}>
                  {authLoading
                    ? "Loading..."
                    : authMode === "login"
                      ? "Sign In"
                      : "Create Account"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">
                    {authMode === "login"
                      ? "Don't have an account?"
                      : "Already have an account?"}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setAuthError("");
                }}
              >
                {authMode === "login" ? "Create Account" : "Sign In"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div>
            <h1 className="mb-2">My Account</h1>
            <p className="text-muted-foreground">
              Manage your profile, orders, and preferences
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="addresses" className="gap-2">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Addresses</span>
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Wishlist</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!editingProfile ? (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Full Name</Label>
                      <p>{user.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p>{user.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p>{user.phone}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Member Since
                      </Label>
                      <p>{user.joinedDate}</p>
                    </div>
                    <Button onClick={() => setEditingProfile(true)}>
                      Edit Profile
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile}>Save Changes</Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setProfileForm(user);
                          setEditingProfile(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>
                  View your past and current orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="mb-4" onClick={() => setTrackingOrderId("demo")}>Preview demo delivery map</Button>
                {orders.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <p className="text-muted-foreground">No orders yet. Start shopping to see your orders here!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">Order #{order.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.date}
                            </p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                            >
                              <span>
                                {item.bookTitle} × {item.quantity}
                              </span>
                              <span>
                                {formatVND(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span>{formatVND(order.total)}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setTrackingOrderId(order.id.replace(/^ORD-/, ""))}>Track delivery</Button>
                          {order.status === "accepted" && cancelTarget !== order.id && (
                            <Button variant="outline" size="sm" onClick={() => { setCancelTarget(order.id); setCancelError(""); }}>Cancel order</Button>
                          )}
                        </div>
                        {cancelTarget === order.id && (
                          <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-2">
                            <p className="text-sm">Cancel this order and return its books to stock?</p>
                            {cancelError && <p role="alert" className="text-sm text-destructive">{cancelError}</p>}
                            <div className="flex gap-2">
                              <Button size="sm" variant="destructive" disabled={cancelSaving} onClick={() => confirmCancelOrder(order.id)}>{cancelSaving ? "Cancelling..." : "Confirm cancellation"}</Button>
                              <Button size="sm" variant="outline" disabled={cancelSaving} onClick={() => setCancelTarget(null)}>Keep order</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Saved Addresses</CardTitle>
                <CardDescription>
                  Manage your shipping and billing addresses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="border border-border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{address.label}</p>
                          {address.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm mt-1">{address.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {address.street}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.city}, {address.state} {address.zipCode}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.country}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteAddress(address.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

                {!addingAddress ? (
                  <Button
                    variant="outline"
                    onClick={() => setAddingAddress(true)}
                    className="w-full"
                  >
                    Add New Address
                  </Button>
                ) : (
                  <div className="border border-border rounded-lg p-4 space-y-4">
                    <h3 className="font-medium">Add New Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="label">Label</Label>
                        <Input
                          id="label"
                          placeholder="e.g., Home, Office"
                          value={newAddress.label}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              label: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="addressName">Full Name</Label>
                        <Input
                          id="addressName"
                          value={newAddress.name}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="street">Street Address</Label>
                        <Input
                          id="street"
                          value={newAddress.street}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              street: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={newAddress.city}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              city: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={newAddress.state}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              state: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          value={newAddress.zipCode}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              zipCode: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={newAddress.country}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              country: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddAddress}>Save Address</Button>
                      <Button
                        variant="outline"
                        onClick={() => setAddingAddress(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Wishlist</CardTitle>
                <CardDescription>Books you've saved for later</CardDescription>
              </CardHeader>
              <CardContent>
                {wishlist.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Your wishlist is empty. Add books you'd like to read!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlist.map((book) => (
                      <div
                        key={book.id}
                        className="border border-border rounded-lg p-4 space-y-3"
                      >
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-full h-48 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium">{book.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {book.author}
                          </p>
                          <p className="font-medium mt-1">
                            {formatVND(book.price)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRemoveFromWishlist(book.id)}
                          className="w-full"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session</CardTitle>
                <CardDescription>Sign out of your account on this device.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={onLogout} className="gap-2">
                  <LogOut className="w-4 h-4" /> Sign Out
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update the password used to sign in.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div><Label htmlFor="current-password">Current password</Label><Input id="current-password" type="password" autoComplete="current-password" required value={passwordForm.current} onChange={(event) => setPasswordForm({ ...passwordForm, current: event.target.value })} /></div>
                  <div><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={passwordForm.next} onChange={(event) => setPasswordForm({ ...passwordForm, next: event.target.value })} /></div>
                  <div><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" autoComplete="new-password" required value={passwordForm.confirm} onChange={(event) => setPasswordForm({ ...passwordForm, confirm: event.target.value })} /></div>
                  {passwordMessage && <p role="status" className="text-sm">{passwordMessage}</p>}
                  <Button type="submit" disabled={passwordSaving}>{passwordSaving ? "Saving..." : "Change password"}</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <DeliveryTrackingDialog orderId={trackingOrderId} onClose={() => setTrackingOrderId(null)} />
      </div>
    </div>
  );
}
