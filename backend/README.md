# Book Store API - Setup Guide

## Prerequisites

- Node.js (v16+)
- SQL Server (2019+)
- npm or yarn

## Installation

1. **Create `.env` file** (copy from `.env.example`):

```bash
cp .env.example .env
```

2. **Configure your environment variables in `.env`**:
   - Set SQL Server credentials
   - Set JWT secret
   - Set FRONTEND_URL

3. **Install dependencies**:

```bash
npm install
```

4. **Create SQL Server database**:

```bash
# Use SSMS and create a database named book_store
```

5. **Run migrations to create tables**:

```bash
npm run migrate
```

6. **Start the server**:

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (protected)

### Books

- `GET /api/books` - Get all books (with filtering, pagination, search)
- `GET /api/books/:id` - Get book details
- `POST /api/books` - Create book (sellers only)
- `PUT /api/books/:id` - Update book (sellers only)
- `DELETE /api/books/:id` - Delete book (sellers only)

### Shopping Cart

- `GET /api/cart` - Get user's cart (protected)
- `POST /api/cart` - Add item to cart (protected)
- `PUT /api/cart/:cartItemId` - Update cart item quantity (protected)
- `DELETE /api/cart/:cartItemId` - Remove from cart (protected)
- `DELETE /api/cart` - Clear entire cart (protected)

### Orders

- `POST /api/orders` - Create order from cart (protected)
- `GET /api/orders` - Get user's orders (protected)
- `GET /api/orders/:orderId` - Get order details (protected)
- `PUT /api/orders/:orderId/cancel` - Cancel order (protected)

### Seller Dashboard

- `GET /api/seller/books` - Get seller's books (protected, sellers only)
- `GET /api/seller/orders` - Get seller's orders (protected, sellers only)
- `GET /api/seller/stats` - Get seller statistics (protected, sellers only)
- `PUT /api/seller/orders/:orderId/status` - Update order status (protected, sellers only)

## Example Requests

### Register

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

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get Books

```bash
curl "http://localhost:5000/api/books?page=1&limit=20&search=harry&category=fiction&minPrice=5&maxPrice=30"
```

### Add to Cart (with token)

```bash
curl -X POST http://localhost:5000/api/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "bookId": 1,
    "quantity": 2
  }'
```

## Project Structure

```
backend/
├── config/
│   └── database.js         # Database connection
├── controllers/
│   ├── authController.js   # Auth logic
│   ├── bookController.js   # Book operations
│   ├── cartController.js   # Cart operations
│   ├── orderController.js  # Order operations
│   └── sellerController.js # Seller operations
├── middleware/
│   └── auth.js             # JWT authentication
├── routes/
│   ├── auth.js
│   ├── books.js
│   ├── cart.js
│   ├── orders.js
│   ├── seller.js
│   └── users.js
├── migrations/
│   └── run.js              # Database schema setup
├── .env.example
├── .env                    # Local environment (create this)
├── server.js               # Express app entry point
└── package.json
```

## Notes

- All protected endpoints require JWT token in `Authorization` header
- Format: `Authorization: Bearer <token>`
- Sellers can only manage their own books and orders
- Database transactions ensure data integrity
