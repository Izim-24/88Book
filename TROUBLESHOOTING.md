# 📚 88Book - Troubleshooting & Setup Guide

## 🚀 Quick Start

### Prerequisites

- **Node.js** v16+ ([Download](https://nodejs.org/))
- **SQL Server** 2019+ ([Download](https://www.microsoft.com/en-us/sql-server/sql-server-downloads))
- **npm** or **yarn**

### Initial Setup

1. **Clone Repository & Install Dependencies**

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (from root)
cd ../
npm install
```

2. **Setup SQL Server Database**

```sql
-- Open SQL Server Management Studio (SSMS) and run:
CREATE DATABASE book_store;
GO
USE book_store;
GO
-- Then run the init.sql script located in database/init.sql
```

**Or using command line:**

```bash
sqlcmd -S localhost -U sa -P "Your_Password" -i database\init.sql
```

3. **Configure Environment Variables**

Create `.env` file in `backend/` folder:

```env
PORT=5000
NODE_ENV=development

# SQL Server Configuration
DB_HOST=localhost
DB_PORT=1433
DB_NAME=book_store
DB_USER=sa
DB_PASSWORD=YourStrong@Passw0rd
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# CORS
FRONTEND_URL=http://localhost:5174

# Email (Optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Stripe (Optional)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

4. **Run Database Migrations**

```bash
cd backend
npm run migrate
```

5. **Start the Application**

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
# Server will run on http://localhost:5000
```

**Terminal 2 - Frontend:**

```bash
npm run dev
# Frontend will run on http://localhost:5174
```

---

## 🐛 Common Issues & Solutions

### ❌ Problem: "Cannot find module 'mssql'"

**Solution:**

```bash
cd backend
npm install
```

### ❌ Problem: "Database connection failed: Connection refused"

**Solution:**

1. Verify SQL Server is running:
   - Windows: Check Services (Services.msc) for SQL Server instance
   - Or start SQL Server Management Studio
2. Check connection string in `.env`:

   ```env
   DB_HOST=localhost
   DB_PORT=1433
   DB_USER=sa
   DB_PASSWORD=YourPassword
   ```

3. Test connection:
   ```bash
   # Windows Command Prompt
   sqlcmd -S localhost -U sa -P "YourPassword"
   ```

### ❌ Problem: "JWT_SECRET is not configured"

**Solution:**
Add `JWT_SECRET` to `backend/.env`:

```env
JWT_SECRET=your_random_secret_key_minimum_32_characters_long
```

Restart backend server after making changes.

### ❌ Problem: "Port 5000 already in use"

**Solution:**

```bash
# Find process using port 5000
# Windows
netstat -ano | findstr :5000

# Kill process (replace PID with the process ID)
taskkill /PID <PID> /F

# Or use different port in .env
PORT=5001
```

### ❌ Problem: "CORS Error - localhost:5174 not allowed"

**Solution:**
Update `FRONTEND_URL` in `backend/.env`:

```env
FRONTEND_URL=http://localhost:5174
```

Restart backend after changes.

### ❌ Problem: "Invalid email or password" even with correct credentials

**Solution:**

1. Check if user exists in database:

   ```sql
   SELECT * FROM users WHERE email = 'your_email@example.com';
   ```

2. Reset database and re-register:
   ```bash
   # Drop and recreate database
   # Then run migrations again
   npm run migrate
   ```

### ❌ Problem: Frontend shows "Cannot POST /api/..."

**Solution:**

1. Verify backend is running on port 5000
2. Check `VITE_API_URL` in `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
3. Check `FRONTEND_URL` in `backend/.env`
4. Restart both servers

### ❌ Problem: "Token expired" - Users getting logged out frequently

**Solution:**
Update `JWT_EXPIRE` in `backend/.env`:

```env
JWT_EXPIRE=7d  # Increase to 7 days (default)
```

### ❌ Problem: "Cart items not showing" after adding books

**Solution:**

1. Check if book quantity > 0 in database:

   ```sql
   SELECT id, title, quantity FROM books;
   ```

2. Add test book via API or admin panel
3. Verify cart items are being saved:
   ```sql
   SELECT * FROM cart_items WHERE user_id = <your_user_id>;
   ```

### ❌ Problem: Book creation returning 500 error

**Solution:**

1. Check all required fields are provided:
   - title, author, price, category (required)
   - Only admins can create books

2. Ensure price is a valid number:
   ```
   price: 19.99  ✓ Correct
   price: "-10"  ✗ Invalid (negative)
   price: "abc"  ✗ Invalid (not a number)
   ```

### ❌ Problem: "Email already in use" but user doesn't exist

**Solution:**

```sql
-- Check for duplicate emails in database
SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;

-- Clean up duplicates if found
```

---

## 🔍 Debugging Tips

### Enable Detailed Logging

Backend (`backend/.env`):

```env
NODE_ENV=development  # Shows full error messages
```

### View Live Database

```sql
-- Check current users
SELECT id, email, full_name, role FROM users;

-- Check all books
SELECT id, title, author, price, quantity FROM books;

-- Check cart items
SELECT ci.*, b.title, b.price FROM cart_items ci
JOIN books b ON ci.book_id = b.id;

-- Check orders
SELECT * FROM orders ORDER BY created_at DESC;
```

### Test API Endpoints with Postman/Curl

**Register User:**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123","fullName":"Test User"}'
```

**Login:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'
```

**Get Books:**

```bash
curl http://localhost:5000/api/books?page=1&limit=20
```

---

## ✅ Recent Fixes Applied

### Fixed Issues (24 total)

**🔴 CRITICAL (2 fixed):**

- ✅ Fixed route ordering issue in orders API (admin routes now before parameterized routes)
- ✅ Fixed SQL syntax error in wishlist addition (IF NOT EXISTS pattern)

**🟠 MAJOR (3 fixed):**

- ✅ Fixed API endpoint mismatches (users profile routes corrected)
- ✅ Added JWT_SECRET validation in authentication middleware
- ✅ Improved token expiration error handling

**🟡 SIGNIFICANT (6 fixed):**

- ✅ Added quantity validation (must be positive integer)
- ✅ Added inventory checks before adding to cart
- ✅ Added price validation (must be positive number)
- ✅ Added pagination parameter validation (max limit: 100)
- ✅ Added email format validation
- ✅ Added password strength validation (min 8 characters)

**🟡 MODERATE & 🔵 MINOR issues** - Also improved error handling, input validation, and security measures

---

## 📊 Project Structure

```
88Book/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/      # Business logic (auth, books, cart, orders, users, admin)
│   ├── middleware/       # Authentication & authorization
│   ├── routes/          # API endpoints
│   ├── server.js        # Express app initialization
│   ├── package.json     # Backend dependencies
│   └── .env             # Environment variables (create this)
│
├── frontend/
│   ├── src/
│   │   ├── app/         # Main App component & pages
│   │   ├── api/         # API client
│   │   ├── contexts/    # AuthContext, CartContext
│   │   ├── styles/      # CSS & Tailwind
│   │   └── main.tsx     # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── .env             # Frontend API URL (create this)
│
├── database/
│   ├── init.sql         # Database schema
│   └── migrations/      # Migration scripts
│
├── docker-compose.yml   # Docker deployment
└── README.md
```

---

## 🚀 Deployment

### Build for Production

**Frontend:**

```bash
npm run build
# Creates optimized build in dist/
```

**Backend:**
No build needed - runs with Node.js directly

### Deploy to Azure

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for Azure deployment instructions.

---

## 📞 Need More Help?

1. **Check logs**: Review browser console (F12) and terminal output
2. **Database**: Verify tables exist with correct schema
3. **Restart**: Try restarting both backend and frontend servers
4. **Clear cache**: Delete node_modules and reinstall
   ```bash
   rm -r node_modules package-lock.json
   npm install
   ```
5. **Reset database**: Drop database and run init.sql again

---

## 📝 Version History

- **v1.1.0** - Fixed 24 bugs, added comprehensive validation, improved error handling
- **v1.0.0** - Initial release

---

**Last Updated:** May 2026
