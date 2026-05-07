# Full Stack Book Selling Website - Setup Guide

## Project Overview

This is a complete **full-stack e-commerce platform** with:

- **Frontend**: React + TypeScript + Vite (responsive UI)
- **Backend**: Node.js + Express + SQL Server (REST API)
- **Authentication**: JWT-based auth with role-based access (Buyer/Seller)
- **Features**: Book browsing, shopping cart, checkout, seller dashboard, order management

## Project Structure

```
btl_web/
├── Book Selling Website/          # Frontend (React/Vite)
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js         # API wrapper & endpoints
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx   # Authentication state
│   │   │   └── CartContext.jsx   # Cart state management
│   │   ├── app/
│   │   │   └── components/       # React components
│   │   └── main.tsx
│   ├── .env.local                # Frontend environment
│   └── package.json
│
└── backend/                       # Backend (Node.js/Express)
    ├── config/
    │   └── database.js           # SQL Server connection
    ├── controllers/              # Business logic
    ├── middleware/
    │   └── auth.js              # JWT authentication
    ├── routes/                   # API routes
    ├── migrations/
    │   └── run.js               # Database setup
    ├── server.js                # Express server
    ├── package.json
    ├── .env.example
    └── README.md
```

## Prerequisites

- **Node.js** v16+ and npm/yarn
- **SQL Server** 2019+
- **Git** (optional)

### Install SQL Server

**Windows:**

- Install SQL Server + SQL Server Management Studio (SSMS)
- During installation, set sa/user credentials and enable TCP connection
- Remember this password - you'll need it for database configuration

**macOS:**

```bash
brew install --cask microsoft-azure-data-studio
```

**Linux (Ubuntu):**

```bash
sudo apt-get install mssql-tools18 unixodbc-dev
```

## Backend Setup

### 1. Navigate to backend directory

```bash
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env` file

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your SQL Server credentials:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=1433
DB_NAME=book_store
DB_USER=sa
DB_PASSWORD=your_sqlserver_password
JWT_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:5174
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

### 4. Create SQL Server database

```bash
# Using SQL Server Management Studio (SSMS)
# Create a new database named book_store
```

### 5. Run migrations to create tables

```bash
npm run migrate
```

Expected output: ✅ All tables created successfully!

### 6. Start backend server

```bash
# Development with auto-reload
npm run dev

# Or production
npm start
```

Server should run on: **http://localhost:5000**

## Frontend Setup

### 1. Navigate to frontend directory

```bash
cd "Book Selling Website"
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start development server

```bash
npm run dev
```

Frontend should run on: **http://localhost:5174**

## Running the Full Application

### Terminal 1: Start Backend

```bash
cd backend
npm run dev
```

### Terminal 2: Start Frontend

```bash
cd "Book Selling Website"
npm run dev
```

Both should be running:

- Frontend: http://localhost:5174
- Backend: http://localhost:5000
- API: http://localhost:5000/api

## Key Features & How to Test

### 1. **User Authentication**

- Click "Account" or menu icon
- Click "Sign Up" or "Sign In"
- Register as a **Buyer** or **Seller**
- Login with your credentials

### 2. **Browse Books** (No login required)

- Visit "Browse" page
- Search by title/author
- Filter by category or price
- Books data comes from API

### 3. **Shopping Cart** (Requires login)

- Add books to cart (redirects to login if needed)
- View/update quantities in cart
- Proceed to checkout

### 4. **Checkout & Orders** (Requires login)

- Enter shipping address
- Select payment method
- Complete order
- View order in Account page

### 5. **Seller Dashboard** (Requires seller login)

- Login as seller
- Navigate to Account page
- See "Seller Dashboard" tab
- Manage books and view sales

### 6. **Admin Functions**

- API supports user roles: buyer, seller, admin
- Sellers can only manage their own books
- Protected endpoints require JWT token

## API Endpoints (Backend)

### Authentication

```bash
POST   /api/auth/register       # Register new user
POST   /api/auth/login          # Login (returns JWT token)
GET    /api/auth/me             # Get current user (protected)
```

### Books

```bash
GET    /api/books               # Get all books (with filters)
GET    /api/books/:id           # Get single book
POST   /api/books               # Create book (sellers only)
PUT    /api/books/:id           # Update book (sellers only)
DELETE /api/books/:id           # Delete book (sellers only)
```

### Shopping Cart

```bash
GET    /api/cart                # Get user cart (protected)
POST   /api/cart                # Add to cart (protected)
PUT    /api/cart/:id            # Update quantity (protected)
DELETE /api/cart/:id            # Remove item (protected)
```

### Orders

```bash
POST   /api/orders              # Create order (protected)
GET    /api/orders              # Get user orders (protected)
GET    /api/orders/:id          # Get order details (protected)
PUT    /api/orders/:id/cancel   # Cancel order (protected)
```

### Seller APIs

```bash
GET    /api/seller/books        # Seller's books (protected, sellers only)
GET    /api/seller/orders       # Seller's orders (protected, sellers only)
GET    /api/seller/stats        # Seller statistics (protected, sellers only)
PUT    /api/seller/orders/:id/status  # Update order status (protected)
```

## Testing with cURL

### Register a new user

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "fullName": "John Doe",
    "role": "buyer"
  }'
```

### Login and get token

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response will include JWT token - use it in Authorization header

### Get all books

```bash
curl http://localhost:5000/api/books
```

### Add to cart (with token)

```bash
curl -X POST http://localhost:5000/api/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "bookId": 1,
    "quantity": 2
  }'
```

## Troubleshooting

### SQL Server Connection Error

- Verify SQL Server service is running and port `1433` is open
- Check credentials in `.env`
- Ensure database `book_store` exists

### Port Already in Use

- Backend (5000): Find process using port, kill it
- Frontend (5174): Vite will use next available port

### API Not Found Errors

- Ensure backend server is running (Terminal 1)
- Check `.env.local` in frontend for correct API URL
- API should be: `http://localhost:5000/api`

### Database Tables Not Created

- Run: `npm run migrate` in backend directory
- Check SQL Server is running
- Verify DB_NAME, DB_USER, DB_PASSWORD in `.env`

### Blank Homepage/No Books Showing

- Check backend console for errors
- Verify database has data (migrations ran)
- Check browser console (F12) for API errors

## Next Steps

1. **Add payment integration** (Stripe/PayPal)
2. **Add email notifications**
3. **Implement reviews & ratings**
4. **Add admin dashboard**
5. **Deploy to production** (Heroku, AWS, Azure, etc.)

## Support

For issues, check:

- Backend console for errors
- Frontend browser console (F12)
- `.env` file configuration
- Database connection status

Happy selling! 📚🛍️
