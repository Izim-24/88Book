# ✅ Getting Started Checklist

Use this checklist to verify everything is set up correctly.

## Prerequisites

- [ ] Node.js v16+ installed (`node --version`)
- [ ] SQL Server + SSMS installed OR Docker installed
- [ ] npm/yarn installed (`npm --version`)
- [ ] Code editor (VS Code recommended)
- [ ] Terminal/Command Prompt ready

## Backend Setup

### Database Configuration

- [ ] SQL Server service is running
- [ ] SSMS can connect to your SQL Server instance
- [ ] Database created: `book_store`

### Backend Installation

- [ ] Navigate to backend: `cd backend`
- [ ] Install dependencies: `npm install` (no errors)
- [ ] Copy env file: `cp .env.example .env`
- [ ] Edit `.env` with your SQL Server password
- [ ] Run migrations: `npm run migrate` ✅ (should show success message)

### Backend Running

- [ ] Start backend: `npm run dev`
- [ ] Server shows: "🚀 Server running on http://localhost:5000"
- [ ] Health check passes: `curl http://localhost:5000/api/health`
- [ ] Response shows: `{"status": "Server is running", ...}`

## Frontend Setup

### Frontend Installation

- [ ] Navigate to frontend: `cd "Book Selling Website"`
- [ ] Install dependencies: `npm install` (no errors)
- [ ] Check `.env.local` has: `VITE_API_URL=http://localhost:5000/api`

### Frontend Running

- [ ] Start frontend: `npm run dev`
- [ ] Shows: "Local: http://localhost:5174"
- [ ] Open browser: http://localhost:5174
- [ ] Homepage loads without errors

## Application Testing

### Navigation

- [ ] Homepage displays hero section
- [ ] "Browse" button works and navigates
- [ ] "Account" button is visible
- [ ] Cart icon visible in header

### Authentication

- [ ] Click Account → Sign Up
- [ ] Register as Buyer (fill form, submit)
- [ ] Success message appears
- [ ] Redirected to home page
- [ ] Logout button visible
- [ ] Click Logout
- [ ] Login form appears
- [ ] Login with credentials (should work)

### Book Browsing (No Auth Required)

- [ ] Navigate to Browse page
- [ ] Books load from API (should see book cards)
- [ ] Search box works
- [ ] Category filter works
- [ ] Price range filter works
- [ ] Click on a book → shows details

### Shopping Cart (Auth Required)

- [ ] Login first
- [ ] Browse page: Add book to cart
- [ ] Success message appears
- [ ] Cart icon shows count (should be > 0)
- [ ] Navigate to Cart page
- [ ] Items show in cart
- [ ] Can update quantity
- [ ] Can remove items
- [ ] Total price calculates correctly

### Checkout (Auth Required)

- [ ] Add items to cart
- [ ] Click "Proceed to Checkout"
- [ ] Checkout page loads
- [ ] Can enter shipping address
- [ ] Can select payment method
- [ ] "Place Order" button works
- [ ] Order confirmation appears
- [ ] Cart clears after order
- [ ] Order appears in Account page

### Seller Features (Seller Login)

- [ ] Register as Seller (in Sign Up form)
- [ ] Login as seller
- [ ] Account page has "Seller Dashboard" tab
- [ ] Can see seller stats
- [ ] Can navigate to "Your Books"
- [ ] Can add new book (fill form, submit)
- [ ] New book appears in list

### Account Management (Auth Required)

- [ ] Login as buyer
- [ ] Click Account
- [ ] "Profile" tab shows user info
- [ ] Can view order history (if orders exist)
- [ ] Can view addresses
- [ ] Can view wishlist

## API Validation

### Register New User (Terminal)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","fullName":"Test User","role":"buyer"}'
```

- [ ] Response status: 201 Created
- [ ] Response includes token
- [ ] Token is JWT string (JWT format: xxx.yyy.zzz)

### Get Books

```bash
curl http://localhost:5000/api/books
```

- [ ] Response status: 200 OK
- [ ] Books array returned
- [ ] Each book has: id, title, author, price, etc.

### Add to Cart (With Token)

```bash
# First get a token from login/register above
curl -X POST http://localhost:5000/api/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{"bookId":1,"quantity":1}'
```

- [ ] Response status: 200 OK
- [ ] Success message returned

### Get Cart

```bash
curl -H "Authorization: Bearer <YOUR_TOKEN>" \
  http://localhost:5000/api/cart
```

- [ ] Response status: 200 OK
- [ ] Cart items returned
- [ ] Item count matches added items

## Browser Console Check

- [ ] Open DevTools: F12
- [ ] Go to Console tab
- [ ] No red error messages
- [ ] API requests show in Network tab
- [ ] No CORS errors

## Performance Check

- [ ] Homepage loads in <2 seconds
- [ ] Browse page loads books in <3 seconds
- [ ] No freezing or lag
- [ ] Buttons respond immediately
- [ ] Typing in search is responsive

## Backup & Security

- [ ] `.env` file is in `.gitignore` (don't commit passwords)
- [ ] Database backups can be created from SSMS backup task
- [ ] JWT secret is randomized and strong
- [ ] Passwords are hashed (can verify in DB)

## Troubleshooting Log

If you encounter issues, document them here:

### Issue: Port 5000 already in use

- Solution: Kill process or use different port in `.env`
- Resolved: [ ]

### Issue: Database connection failed

- Solution: Check SQL Server is running, verify credentials
- Resolved: [ ]

### Issue: Books not loading

- Solution: Check backend console for errors, verify API URL
- Resolved: [ ]

### Issue: Authentication not working

- Solution: Check JWT secret, verify token is saved to localStorage
- Resolved: [ ]

---

## Final Verification

Once all checkboxes are marked:

- [ ] Entire system is working correctly
- [ ] Ready for production development
- [ ] Ready to add new features
- [ ] Documentation is complete
- [ ] Can start building custom features

---

## Next Steps

Once verified, you can:

1. Add payment gateway (Stripe/PayPal)
2. Add email notifications
3. Implement reviews & ratings
4. Create admin dashboard
5. Deploy to production
6. Optimize performance

**Congratulations!** Your book selling website is fully functional! 🎉📚
