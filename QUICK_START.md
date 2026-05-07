# Quick Start Guide for Book Selling Website

## ⚡ Quick Setup (5-10 minutes)

### Step 1: Setup Backend Database

**Windows (using Admin Command Prompt):**

```cmd
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env from template
copy .env.example .env
```

Edit `.env` file:

- Change `DB_PASSWORD` to your SQL Server password
- Rest can stay as default

**Create database and tables:**

```cmd
npm run migrate
```

**Start backend:**

```cmd
npm run dev
```

✅ Backend running on http://localhost:5000

---

### Step 2: Setup Frontend

**In a new terminal:**

```cmd
cd "Book Selling Website"
npm install
npm run dev
```

✅ Frontend running on http://localhost:5174

---

## 🧪 Quick Test

1. **Open browser**: http://localhost:5174
2. **Sign Up**: Click Account → Sign Up as Buyer
3. **Browse Books**: Click Browse (loads from API)
4. **Add to Cart**: Select a book → Add to Cart
5. **Checkout**: View Cart → Checkout
6. **Done!** 🎉

---

## 📝 Key Features Ready to Use

- ✅ User authentication (Buyer/Seller registration & login)
- ✅ Book browsing with search & filters
- ✅ Shopping cart with add/remove/update quantity
- ✅ Order checkout with address input
- ✅ Seller dashboard for managing books
- ✅ Order history & management
- ✅ JWT token-based security

---

## 🔧 If Something Goes Wrong

### Backend won't start?

```bash
# Check if port 5000 is available
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill process if needed, then restart
npm run dev
```

### Database error?

```bash
# Make sure SQL Server service is running
# Verify credentials in .env match your SQL Server setup
# Then re-run migrations
npm run migrate
```

### Frontend blank or API errors?

- Check browser console (F12 → Console tab)
- Verify `.env.local` has correct API_URL
- Ensure backend is running

---

## 🚀 What's Included

### Backend APIs

- Authentication (register, login, profile)
- Book management (CRUD)
- Shopping cart operations
- Order processing
- Seller analytics

### Frontend Components

- Homepage with featured books
- Browse page with search/filter
- Shopping cart page
- Checkout page
- User account page
- Seller dashboard

---

## 📚 Database Schema

**Tables created automatically:**

- `users` - User accounts (buyers/sellers)
- `books` - Book listings
- `cart_items` - Shopping carts
- `orders` - Order records
- `order_items` - Items in each order

---

## 🎯 Next Steps

After verifying everything works:

1. **Add sample books** via API or Seller interface
2. **Test full flow** (register → browse → cart → checkout)
3. **Explore seller features** (login as seller, add books)
4. **Check console logs** to understand data flow
5. **Customize styling** in `/src/styles/`

---

## 📖 Full Documentation

See `SETUP_GUIDE.md` for:

- Detailed API endpoints
- cURL examples for testing
- Troubleshooting guide
- Production deployment steps

---

**Happy Coding!** 📚✨
