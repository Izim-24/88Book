# 88Book - Website bán sách fullstack

88Book là project website bán sách gồm 3 phần chính:

- Frontend: giao diện người dùng viết bằng React + Vite.
- Backend: REST API viết bằng Node.js + Express.
- Database: SQL Server, lưu tài khoản, sách, giỏ hàng, đơn hàng, địa chỉ và wishlist.

Frontend gọi API qua `http://localhost:5000/api`. Backend kết nối SQL Server qua cấu hình trong `backend/.env`.

## Công nghệ sử dụng

Frontend:

- `React 18`: xây dựng UI component.
- `Vite`: dev server và build frontend.
- `Tailwind CSS`: styling.
- `lucide-react`: icon.
- `Context API`: quản lý auth state và cart state.

Backend:

- `Node.js` + `Express`: server API.
- `mssql`: kết nối SQL Server.
- `bcryptjs`: hash và kiểm tra mật khẩu.
- `jsonwebtoken`: tạo và xác thực JWT.
- `cors`: cho phép frontend gọi backend.
- `dotenv`: đọc biến môi trường từ `.env`.

Database:

- `SQL Server`.
- Script migration nằm trong `database/migrations`.
- Script seed/schema đầy đủ nằm trong `database/init.sql`.

## Cấu trúc project

```text
88Book-main/
├── README.md
├── package.json
├── package-lock.json
├── vite.config.ts
├── index.html
├── src/
├── backend/
├── database/
├── dist/
├── node_modules/
└── docker-compose.yml
```

Ý nghĩa các phần chính:

- `README.md`: tài liệu chính của toàn bộ project.
- `package.json`: khai báo script và dependency cho frontend.
- `package-lock.json`: khóa version dependency frontend để cài đặt ổn định.
- `vite.config.ts`: cấu hình Vite, React plugin, Tailwind plugin và alias `@`.
- `index.html`: HTML entry point cho Vite.
- `src/`: toàn bộ source frontend.
- `backend/`: toàn bộ source backend API.
- `database/`: SQL script và migration.
- `dist/`: frontend build output, được tạo sau khi chạy `npm run build`.
- `node_modules/`: dependency đã cài local, không nên commit lên git.
- `docker-compose.yml`: cấu hình chạy SQL Server và backend bằng Docker nếu máy có Docker.

## Cấu trúc frontend

```text
src/
├── main.tsx
├── api/
│   └── client.js
├── app/
│   ├── App.tsx
│   └── components/
├── contexts/
└── styles/
```

Các file frontend quan trọng:

- `src/main.tsx`: entry point của React app, mount app vào DOM.
- `src/app/App.tsx`: component gốc, quản lý routing nội bộ bằng state, load sách, điều hướng trang home/browse/cart/checkout/account/admin.
- `src/api/client.js`: API wrapper cho toàn bộ request từ frontend tới backend.
- `src/contexts/AuthContext.jsx`: quản lý đăng ký, đăng nhập, đăng xuất, lưu JWT vào `localStorage`.
- `src/contexts/CartContext.jsx`: quản lý giỏ hàng, gọi API lấy/thêm/sửa/xóa item.
- `src/styles/theme.css`: phần lớn CSS theme, layout, card, animation.
- `src/styles/tailwind.css`: import Tailwind và `tw-animate-css`.
- `src/styles/index.css`: import các file CSS chính.
- `src/styles/fonts.css`: cấu hình font.

Các component frontend:

- `Navigation.tsx`: thanh điều hướng, tìm kiếm, account/cart/admin button.
- `BookCard.tsx`: card hiển thị một quyển sách, nút wishlist và add to cart.
- `BookDetailsModal.tsx`: modal xem chi tiết sách.
- `BrowsePage.tsx`: trang duyệt sách, tìm kiếm, filter category, sort.
- `CartPage.tsx`: trang giỏ hàng, tăng/giảm số lượng, xóa item.
- `CheckoutPage.tsx`: form checkout và tạo đơn hàng.
- `AccountPage.tsx`: đăng nhập/đăng ký, profile, orders, addresses, wishlist.
- `AdminDashboard.tsx`: admin quản lý sách, user, recommendation.
- `ImageWithFallback.tsx`: ảnh có fallback khi load lỗi.

UI helper còn giữ lại:

- `ui/button.tsx`: button dùng chung.
- `ui/badge.tsx`: badge dùng chung.
- `ui/card.tsx`: card layout dùng chung.
- `ui/input.tsx`: input dùng chung.
- `ui/label.tsx`: label form.
- `ui/separator.tsx`: đường phân cách.
- `ui/tabs.tsx`: tabs trong account page.
- `ui/utils.ts`: hàm `cn()` để merge class name.

## Cấu trúc backend

```text
backend/
├── package.json
├── package-lock.json
├── server.js
├── .env.example
├── .env
├── Dockerfile
├── config/
├── controllers/
├── middleware/
└── routes/
```

Các file backend quan trọng:

- `backend/package.json`: script và dependency backend.
- `backend/package-lock.json`: khóa version dependency backend.
- `backend/server.js`: tạo Express app, cấu hình CORS/body parser, mount routes, health check và error handler.
- `backend/.env.example`: mẫu biến môi trường cần có.
- `backend/.env`: cấu hình local thật, không nên commit vì có password/token.
- `backend/Dockerfile`: build backend container nếu chạy Docker.
- `backend/config/database.js`: tạo connection pool tới SQL Server và helper `query()`.
- `backend/middleware/auth.js`: middleware `authenticateToken` và `authorizeRole`.

Routes backend:

- `backend/routes/auth.js`: route đăng ký, đăng nhập, lấy user hiện tại, tạo admin.
- `backend/routes/books.js`: route lấy sách, recommendation, CRUD sách.
- `backend/routes/cart.js`: route giỏ hàng.
- `backend/routes/orders.js`: route đơn hàng user và admin.
- `backend/routes/admin.js`: route dashboard admin.
- `backend/routes/users.js`: route profile, đổi mật khẩu, địa chỉ, wishlist.

Controllers backend:

- `authController.js`: xử lý register/login/JWT/admin account.
- `bookController.js`: xử lý sách, filter/search/sort, recommendation, CRUD sách.
- `cartController.js`: xử lý thêm/sửa/xóa/clear giỏ hàng.
- `orderController.js`: tạo đơn, xem đơn, hủy đơn, duyệt đơn, đổi trạng thái đơn.
- `adminController.js`: quản lý user, sách, recommendation, orders, stats.
- `userController.js`: profile, đổi mật khẩu, địa chỉ, wishlist.

## Cấu trúc database

```text
database/
├── init.sql
└── migrations/
    ├── run.js
    ├── add-rating-column.js
    └── add_wishlist_address.js
```

Ý nghĩa:

- `database/init.sql`: script SQL tổng hợp để tạo database/table và seed data. Có thể dùng trong SSMS nếu muốn chạy SQL thủ công.
- `database/migrations/run.js`: migration chính, tạo các bảng quan trọng cho app.
- `database/migrations/add-rating-column.js`: migration bổ sung cột `rating` cho bảng `books`.
- `database/migrations/add_wishlist_address.js`: migration bổ sung bảng `user_addresses` và `wishlists`.

Các bảng chính:

- `users`: tài khoản người dùng, email, password hash, full name, role.
- `books`: danh sách sách, giá, category, tồn kho, ảnh, rating, admin tạo sách.
- `cart_items`: item trong giỏ hàng theo từng user.
- `orders`: thông tin đơn hàng, tổng tiền, trạng thái, địa chỉ giao hàng, phương thức thanh toán.
- `order_items`: chi tiết sách trong từng đơn hàng.
- `user_addresses`: địa chỉ giao hàng của user.
- `wishlists`: sách user đã lưu vào wishlist.
- `featured_recommendations`: danh sách sách được admin chọn làm recommendation.

Quan hệ dữ liệu chính:

- Một user có thể có nhiều sách nếu user đó là admin.
- Một user có nhiều cart item.
- Một user có nhiều order.
- Một order có nhiều order item.
- Một book có thể nằm trong nhiều cart item/order item/wishlist.

## Luồng hoạt động chính

Đăng ký và đăng nhập:

1. Frontend gọi `POST /api/auth/register` hoặc `POST /api/auth/login`.
2. Backend kiểm tra email/password.
3. Backend trả JWT.
4. Frontend lưu JWT vào `localStorage`.
5. Các request cần đăng nhập sẽ gửi header `Authorization: Bearer <token>`.

Mua sách:

1. Frontend gọi `GET /api/books` để lấy danh sách sách.
2. User thêm sách vào giỏ bằng `POST /api/cart`.
3. User checkout bằng `POST /api/orders`.
4. Backend tạo `orders`, tạo `order_items`, trừ tồn kho, xóa giỏ hàng.

Admin quản lý:

1. Admin đăng nhập.
2. Admin vào dashboard.
3. Admin tạo/sửa/xóa sách.
4. Admin xem user/orders/stats.
5. Admin cập nhật trạng thái đơn hàng.

## Cài đặt project

Yêu cầu:

- Node.js v16 trở lên.
- npm.
- SQL Server 2019 trở lên.
- SQL Server TCP/IP bật ở port `1433`.

Cài frontend:

```powershell
cd C:\Users\quang\Desktop\88Book-main\88Book-main
npm install
```

Cài backend:

```powershell
cd C:\Users\quang\Desktop\88Book-main\88Book-main\backend
npm install
```

## Cấu hình môi trường

Backend dùng file:

```text
backend/.env
```

Mẫu cấu hình:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=1433
DB_NAME=book_store
DB_USER=sa
DB_PASSWORD=your_sqlserver_password
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

FRONTEND_URL=http://localhost:5174
```

Frontend có thể dùng file `.env` hoặc `.env.local` ở thư mục gốc:

```env
VITE_API_URL=http://localhost:5000/api
```

Nếu không có `VITE_API_URL`, frontend mặc định gọi:

```text
http://localhost:5000/api
```

## Chuẩn bị database

Tạo database trong SQL Server:

```sql
CREATE DATABASE book_store;
```

Sau đó chạy migration:

```powershell
cd C:\Users\quang\Desktop\88Book-main\88Book-main\backend
npm run migrate
```

Kiểm tra SQL Server có mở port chưa:

```powershell
Test-NetConnection localhost -Port 1433
```

Nếu `TcpTestSucceeded : True` là backend có thể kết nối tới SQL Server.

## Chạy project

Chạy backend:

```powershell
cd C:\Users\quang\Desktop\88Book-main\88Book-main\backend
npm run dev
```

Backend chạy tại:

```text
http://localhost:5000
```

Health check:

```powershell
curl http://localhost:5000/api/health
```

Chạy frontend:

```powershell
cd C:\Users\quang\Desktop\88Book-main\88Book-main
npm run dev
```

Frontend chạy tại:

```text
http://localhost:5174
```

## API endpoints

Auth:

- `POST /api/auth/register`: đăng ký user mới.
- `POST /api/auth/login`: đăng nhập.
- `GET /api/auth/me`: lấy user hiện tại, cần JWT.
- `POST /api/auth/admin`: admin tạo admin account khác.

Books:

- `GET /api/books`: lấy sách, có pagination/filter/search/sort.
- `GET /api/books/recommendations`: lấy sách recommendation.
- `GET /api/books/:id`: xem chi tiết sách.
- `POST /api/books`: admin tạo sách.
- `PUT /api/books/:id`: admin cập nhật sách.
- `DELETE /api/books/:id`: admin xóa sách.

Cart:

- `GET /api/cart`: lấy giỏ hàng.
- `POST /api/cart`: thêm sách vào giỏ.
- `PUT /api/cart/:cartItemId`: cập nhật số lượng.
- `DELETE /api/cart/:cartItemId`: xóa một item.
- `DELETE /api/cart`: xóa toàn bộ giỏ.

Orders:

- `POST /api/orders`: tạo đơn hàng.
- `GET /api/orders`: lấy đơn hàng của user.
- `GET /api/orders/:orderId`: xem chi tiết đơn.
- `PUT /api/orders/:orderId/cancel`: hủy đơn.
- `GET /api/orders/admin/pending`: admin lấy đơn pending.
- `PUT /api/orders/:orderId/approve`: admin duyệt đơn.
- `PUT /api/orders/:orderId/status`: admin cập nhật trạng thái đơn.

Users:

- `GET /api/users/profile`: lấy profile.
- `PUT /api/users/profile`: cập nhật profile.
- `PUT /api/users/change-password`: đổi mật khẩu.
- `GET /api/users/public/:userId`: xem public profile.
- `GET /api/users/addresses`: lấy địa chỉ.
- `POST /api/users/addresses`: thêm địa chỉ.
- `PUT /api/users/addresses/:id`: sửa địa chỉ.
- `DELETE /api/users/addresses/:id`: xóa địa chỉ.
- `GET /api/users/wishlist`: lấy wishlist.
- `POST /api/users/wishlist`: thêm sách vào wishlist.
- `DELETE /api/users/wishlist/:bookId`: xóa sách khỏi wishlist.

Admin:

- `GET /api/admin/users`: lấy danh sách user.
- `POST /api/admin/users`: tạo user.
- `PUT /api/admin/users/:userId`: cập nhật user.
- `DELETE /api/admin/users/:userId`: xóa user.
- `PUT /api/admin/users/:userId/role`: đổi role.
- `GET /api/admin/books`: lấy sách cho admin dashboard.
- `GET /api/admin/recommendations`: lấy recommendation.
- `PUT /api/admin/recommendations`: cập nhật recommendation.
- `GET /api/admin/orders`: lấy đơn hàng admin.
- `GET /api/admin/stats`: lấy thống kê.
- `PUT /api/admin/orders/:orderId/status`: cập nhật trạng thái đơn.

## Ví dụ request

Đăng ký:

```powershell
curl -X POST http://localhost:5000/api/auth/register `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"user@example.com\",\"password\":\"password123\",\"fullName\":\"Nguyen Van A\"}"
```

Đăng nhập:

```powershell
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"user@example.com\",\"password\":\"password123\"}"
```

Lấy sách:

```powershell
curl "http://localhost:5000/api/books?page=1&limit=20&search=harry"
```

Thêm vào giỏ hàng:

```powershell
curl -X POST http://localhost:5000/api/cart `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_JWT_TOKEN" `
  -d "{\"bookId\":1,\"quantity\":2}"
```

## Build và kiểm tra

Build frontend:

```powershell
npm run build
```

Kiểm tra syntax backend/database:

```powershell
Get-ChildItem -Recurse -File backend,database -Filter *.js |
  Where-Object { $_.FullName -notmatch '\\node_modules\\' } |
  ForEach-Object { node --check $_.FullName }
```

Audit dependency:

```powershell
npm audit
cd backend
npm audit
```

## Ghi chú quan trọng

- Không commit `.env` vì có thông tin mật.
- Không commit `node_modules`; cài lại bằng `npm install`.
- `package-lock.json` nên được giữ trong git để dependency ổn định.
- Backend mặc định chạy ở port `5000`.
- Frontend mặc định chạy ở port `5174`.
- SQL Server cần bật TCP/IP và port `1433`.
- User thường có role `buyer`.
- Admin có role `admin`.
