# 88Book - Cửa hàng sách trực tuyến

## 📖 Giới thiệu

**88Book** là một website bán sách trực tuyến hiện đại với giao diện thân thiện, responsive và dễ sử dụng. Website này được thiết kế để cung cấp trải nghiệm mua sắm tuyệt vời cho người dùng.

## 🎨 Tính năng chính

### 1. **Giao diện Responsive**

- Tự động điều chỉnh trên các thiết bị (desktop, tablet, mobile)
- Hamburger menu trên điện thoại
- Bố cục linh hoạt

### 2. **Tìm kiếm và Lọc**

- Tìm kiếm sách theo tên hoặc tác giả
- Lọc theo danh mục (Tiểu thuyết, Phát triển bản thân, Công nghệ, Lịch sử)
- Sắp xếp theo: Mới nhất, Giá, Phổ biến nhất

### 3. **Giỏ Hàng**

- Thêm/xóa sách khỏi giỏ hàng
- Điều chỉnh số lượng
- Tính toán tổng tiền tự động
- Lưu giỏ hàng vào localStorage

### 4. **Chi tiết Sản phẩm**

- Hiển thị thông tin chi tiết sách
- Đánh giá sao (rating)
- Số lượng đánh giá
- Mô tả chi tiết

### 5. **Yêu thích**

- Đánh dấu sách yêu thích
- Hiển thị trực quan với biểu tượng trái tim

### 6. **Navigation**

- Thanh menu chính
- Tìm kiếm toàn trang
- Quản lý tài khoản
- Thông tin giỏ hàng

### 7. **Footer**

- Thông tin về cửa hàng
- Hỗ trợ khách hàng
- Mạng xã hội
- Đăng ký nhận tin

## 📱 Cấu trúc File

```
88Book/
├── index.html              # Trang chính HTML
├── css/
│   ├── style.css          # Stylesheet chính
│   └── responsive.css     # CSS cho responsive design
├── js/
│   ├── main.js            # JavaScript logic chính
│   └── data.js            # Dữ liệu sách
└── README.md              # File hướng dẫn này
```

## 🚀 Cách sử dụng

### 1. **Mở website**

- Mở file `index.html` trong trình duyệt web
- Hoặc sử dụng server cục bộ (Live Server)

### 2. **Duyệt sách**

- Xem danh sách sách nổi bật
- Sử dụng lọc danh mục để tìm thể loại yêu thích
- Sắp xếp theo giá hoặc lượt xem

### 3. **Tìm kiếm**

- Nhập tên sách hoặc tác giả vào ô tìm kiếm
- Nhấn Enter hoặc click nút tìm kiếm

### 4. **Xem chi tiết**

- Click vào sách bất kỳ để xem thông tin chi tiết
- Hiển thị modal với toàn bộ mô tả sách

### 5. **Mua sắm**

- Click "Thêm vào giỏ hàng" để thêm sách
- Quản lý giỏ hàng từ icon shopping cart
- Điều chỉnh số lượng hoặc xóa sách

### 6. **Yêu thích**

- Click icon trái tim để đánh dấu yêu thích
- Biểu tượng sẽ thay đổi màu đỏ

## 🛠️ Công nghệ sử dụng

- **HTML5** - Cấu trúc semantic
- **CSS3** - Styling với Grid, Flexbox, Animation
- **JavaScript (Vanilla)** - Không phụ thuộc thư viện
- **Font Awesome** - Biểu tượng (CDN)
- **localStorage** - Lưu giỏ hàng trên trình duyệt

## 📋 Dữ liệu Sách

Hiện tại có **15 quyển sách mẫu** với các thông tin:

- `id` - ID duy nhất
- `title` - Tên sách
- `author` - Tác giả
- `price` - Giá gốc
- `salePrice` - Giá khuyến mãi
- `category` - Danh mục
- `rating` - Đánh giá (0-5)
- `reviews` - Số đánh giá
- `icon` - Emoji đại diện
- `description` - Mô tả chi tiết

## ✨ Các tính năng nổi bật

### Responsive Design

- Desktop: Hiển thị 4-5 sách trên hàng
- Tablet: Hiển thị 2-3 sách trên hàng
- Mobile: Hiển thị 1-2 sách trên hàng

### Performance

- Lightweight - Không phụ thuộc framework nặng
- Smooth animations
- Local storage caching

### User Experience

- Intuitive navigation
- Clear product information
- Easy checkout flow
- Real-time cart updates

## 🎯 Phát triển tiếp theo

Danh sách chức năng có thể thêm:

1. **Backend Integration**
   - API kết nối cơ sở dữ liệu
   - Authentication (đăng nhập/đăng ký)
   - Xử lý thanh toán

2. **Chức năng bổ sung**
   - Lịch sử đơn hàng
   - Đánh giá/bình luận từ người dùng
   - Wishlist riêng per user
   - Quick view popup
   - So sánh sản phẩm

3. **Admin Panel**
   - Quản lý sách
   - Quản lý đơn hàng
   - Thống kê bán hàng
   - Quản lý người dùng

4. **Marketing**
   - Email marketing
   - Discount codes
   - Flash sales
   - Product recommendations

5. **SEO & Analytics**
   - Search engine optimization
   - Google Analytics
   - Meta tags optimization

## 🐛 Troubleshooting

### Giỏ hàng không lưu được

- Kiểm tra xem localStorage có bị vô hiệu hóa không
- Xóa cache trình duyệt

### Ảnh không hiển thị

- Website sử dụng emoji làm biểu tượng sách
- Nếu emoji không hiển thị, hãy cập nhật trình duyệt

### Trang không responsive

- Đảm bảo viewport meta tag đã được thiết lập đúng
- Xóa CSS cũ nếu có xung đột

## 📞 Liên hệ & Hỗ trợ

Để báo cáo lỗi hoặc gợi ý tính năng, vui lòng liên hệ:

- Email: supportΔ88book.com
- Phone: 1-800-BOOKS
- Website: www.88book.com

## 📄 Giấy phép

© 2024 88Book. Tất cả quyền được bảo lưu.

---

**Cảm ơn vì sử dụng 88Book! Happy Reading! 📚**

## Quick Start

This is a code bundle for Book Selling Website. The original project is available at https://www.figma.com/design/ams6X6WXkeciKseoxbKTJK/Book-Selling-Website.

### Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.
