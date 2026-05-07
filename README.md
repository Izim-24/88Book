# Book Selling Website - Fullstack

Du an website ban sach gom 3 thanh phan chinh: `frontend` (giao dien), `backend` (API + business logic), va `database` (luu tru du lieu).

## 1) Tong quan kien truc

- `frontend` (React + Vite) goi REST API toi `backend`.
- `backend` (Express + SQL Server) xu ly xac thuc, phan quyen, gio hang, don hang, quan ly sach.
- `database` (SQL Server) luu users, books, cart, orders va order_items.
- Xac thuc su dung JWT: token duoc luu o frontend (`localStorage`) va gui qua header `Authorization: Bearer <token>`.

## 2) Frontend

### Cong nghe dang dung

- `React 18` cho UI component.
- `Vite` cho dev server/build nhanh.
- `Tailwind CSS` + bo component UI (Radix UI, MUI) cho style.
- `Context API` cho global state:
  - `AuthContext` quan ly dang nhap/dang ky/dang xuat.
  - `CartContext` dong bo du lieu gio hang.

### Cac khu vuc chuc nang chinh

- **Trang chu + danh muc sach**
  - Hien thi sach noi bat, category pho bien.
  - Chuyen nhanh sang trang browse theo category.
- **Browse**
  - Tim kiem theo ten/tac gia.
  - Loc theo category.
  - Sap xep theo tieu de, gia, rating.
- **Chi tiet sach**
  - Mo modal xem mo ta, gia, thong tin sach.
  - Them vao gio hang.
- **Gio hang**
  - Xem danh sach item da them.
  - Tang/giam so luong, xoa item.
- **Checkout**
  - Nhap thong tin lien he, dia chi, thanh toan.
  - Goi API tao don hang.
- **Account**
  - Dang ky, dang nhap, dang xuat.
  - Hien thi profile va cac thong tin tai khoan.
- **Seller dashboard**
  - Them/sua/xoa sach.
  - Xem danh sach sach cua seller.

### API client tren frontend

File `src/api/client.js` dong vai tro wrapper cho toan bo request:

- Tu dong gan token JWT vao header neu da dang nhap.
- Nhom API theo module:
  - `authAPI`: register, login, me.
  - `booksAPI`: CRUD sach + filter/pagination.
  - `cartAPI`: CRUD gio hang.
  - `ordersAPI`: tao don, lay don, huy don, endpoint admin.
  - `sellerAPI`: sach/don/thong ke cua seller.
  - `usersAPI`: profile user.

## 3) Backend

### Cong nghe dang dung

- `Node.js` + `Express`.
- `mssql` ket noi SQL Server.
- `jsonwebtoken` + `bcryptjs` cho auth.
- `cors`, `dotenv`, `express-validator`.

### Cau truc backend

- `backend/server.js`: khoi tao app, middleware, mount routes, error handling.
- `backend/routes/*.js`: dinh nghia endpoint.
- `backend/controllers/*.js`: xu ly nghiep vu.
- `backend/middleware/auth.js`: `authenticateToken` va `authorizeRole`.
- `backend/config/database.js`: pool ket noi DB.

### Chuc nang backend theo module

- **Auth**
  - Dang ky tai khoan (`buyer` mac dinh).
  - Dang nhap, cap JWT.
  - Lay thong tin user hien tai (`/auth/me`).
  - Admin co the tao tai khoan admin khac (`/auth/admin`).
- **Books**
  - Lay danh sach sach (co filter/search/sort/pagination).
  - Xem chi tiet sach.
  - Seller tao/sua/xoa sach cua minh.
- **Cart**
  - Them sach vao gio.
  - Cap nhat so luong.
  - Xoa item / xoa toan bo gio hang.
- **Orders**
  - Tao don tu gio hang.
  - Lay danh sach don cua user.
  - Xem chi tiet don.
  - Huy don.
  - Admin duyet/cap nhat trang thai don.
- **Seller**
  - Lay sach cua seller.
  - Lay don lien quan seller.
  - Lay thong ke (so sach, ton kho, doanh thu, don hang).
  - Cap nhat trang thai don o scope seller.
- **Users**
  - Lay/cap nhat profile.
  - Doi mat khau.
  - Lay public profile theo user id.

## 4) Database

### He quan tri

- `SQL Server`.

### Migration/schema hien tai

- Tao bang chinh: `database/migrations/run.js`.
- Them cot rating cho books: `database/migrations/add-rating-column.js`.

### Cac bang va y nghia

- `users`
  - Luu tai khoan, role (`buyer`/`seller`/`admin`), thong tin dang nhap.
- `books`
  - Luu catalog sach, thong tin gia, ton kho, seller so huu, rating.
- `cart_items`
  - Luu gio hang theo tung user.
- `orders`
  - Header don hang: tong tien, dia chi giao, phuong thuc thanh toan, trang thai.
- `order_items`
  - Chi tiet tung dong hang trong don, so luong, gia chot tai thoi diem dat.

### Quan he du lieu

- `users (1) -> (n) books` qua `seller_id`.
- `users (1) -> (n) cart_items` qua `user_id`.
- `users (1) -> (n) orders` qua `user_id`.
- `orders (1) -> (n) order_items` qua `order_id`.
- `books (1) -> (n) cart_items / order_items` qua `book_id`.

## 5) Luong nghiep vu chinh

### Mua sach

1. User dang ky/dang nhap.
2. Frontend goi `GET /api/books` de browse.
3. User them sach vao gio (`POST /api/cart`).
4. Checkout goi `POST /api/orders`.
5. Backend tao order + order_items, cap nhat ton kho, clear cart.

### Quan ly ban hang (seller)

1. Seller dang nhap.
2. Tao/sua/xoa sach qua `POST/PUT/DELETE /api/books/:id`.
3. Theo doi don qua `GET /api/seller/orders`.
4. Cap nhat trang thai don qua `PUT /api/seller/orders/:orderId/status`.

## 6) Chay du an local

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

### Database migration

```bash
node database/migrations/run.js
node database/migrations/add-rating-column.js
```

## 7) Bien moi truong

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=1433
DB_NAME=book_store
DB_USER=sa
DB_PASSWORD=your_sqlserver_password
JWT_SECRET=your_secret
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5174
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

### Frontend (`.env.local`)

```env
VITE_API_URL=http://localhost:5000/api
```
