# 🧪 Hướng dẫn kiểm tra chi tiết các chức năng

## 📝 **Cách 1: Kiểm tra bằng cURL (Command Line)**

### Mở PowerShell/Terminal

Mở một cửa sổ PowerShell mới (không đóng cửa sổ đang chạy server)

---

## ✅ **KỊCH BẠN 1: Kiểm tra Theme (Cookie)**

### Bước 1: Xem trang chủ (theme mặc định = light)
```powershell
curl http://localhost:3000/
```

**Kết quả mong đợi:**
```json
{
  "message": "Welcome to 88Book",
  "theme": "light",
  "loginStatus": "Chưa đăng nhập",
  "username": null
}
```

### Bước 2: Đặt theme thành dark
```powershell
curl http://localhost:3000/set-theme/dark
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "message": "Theme đã được đặt thành dark",
  "theme": "dark"
}
```

### Bước 3: Quay lại trang chủ (theme sẽ vẫn là dark - lưu trong cookie)
```powershell
curl http://localhost:3000/
```

**Kết quả mong đợi:**
```json
{
  "message": "Welcome to 88Book",
  "theme": "dark",
  "loginStatus": "Chưa đăng nhập",
  "username": null
}
```

**✅ Test đạt**: Theme từ cookie được lưu và sử dụng lại

---

## ✅ **KỊCH BẠN 2: Kiểm tra Session & Đăng nhập**

### Bước 1: Xem hướng dẫn đăng nhập
```powershell
curl http://localhost:3000/login
```

**Kết quả mong đợi:**
```json
{
  "message": "Trang đăng nhập",
  "instruction": "Gửi POST request đến /login với body: { \"username\": \"tên_người_dùng\" }",
  "example": {
    "method": "POST",
    "url": "/login",
    "body": {
      "username": "user123"
    }
  }
}
```

### Bước 2: Đăng nhập (gửi username)
```powershell
$body = @{username = "student123"} | ConvertTo-Json

curl -Method POST `
     -Uri http://localhost:3000/login `
     -Headers @{"Content-Type"="application/json"} `
     -Body $body `
     -SessionVariable session
```

Hoặc cách truyền thống hơn:
```powershell
curl -Method POST http://localhost:3000/login `
     -Headers @{"Content-Type"="application/json"} `
     -Body '{"username":"student123"}'
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "user": {
    "username": "student123",
    "loginTime": "2024-12-15T10:30:45.000Z"
  }
}
```

### Bước 3: Xem thông tin cá nhân (lần 1)
```powershell
curl http://localhost:3000/profile
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "message": "Thông tin cá nhân",
  "user": {
    "username": "student123",
    "loginTime": "2024-12-15T10:30:45.000Z",
    "loginTimeFormatted": "15/12/2024 10:30:45",
    "timeSinceLoginSeconds": 2,
    "profileVisitCount": 1,
    "totalPageViewsInSession": 1
  },
  "note": "Số lần truy cập được tính trong cùng một phiên (session)"
}
```

**✅ Lưu ý**: `profileVisitCount: 1` (lần đầu truy cập)

### Bước 4: Xem profile lần 2 (bộ đếm tăng)
```powershell
curl http://localhost:3000/profile
```

**Kết quả mong đợi:**
```json
{
  ...
  "profileVisitCount": 2,  // ← Tăng từ 1 lên 2
  "totalPageViewsInSession": 2
}
```

**✅ Lưu ý**: `profileVisitCount: 2` (bộ đếm tăng)

### Bước 5: Xem profile lần 3
```powershell
curl http://localhost:3000/profile
```

**Kết quả mong đợi:**
```json
{
  ...
  "profileVisitCount": 3,  // ← Tăng lên 3
  "totalPageViewsInSession": 3
}
```

**✅ Test đạt**: Bộ đếm tăng với mỗi lần truy cập

---

## ✅ **KỊCH BẠN 3: Kiểm tra Kiểm soát Truy cập (Access Control)**

### Bước 1: Đăng xuất
```powershell
curl http://localhost:3000/logout
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "message": "Đăng xuất thành công",
  "logoutUser": "student123",
  "redirect": "/"
}
```

### Bước 2: Cố gắng xem profile sau khi logout (sẽ bị chặn)
```powershell
curl http://localhost:3000/profile
```

**Kết quả mong đợi:**
```json
{
  "success": false,
  "message": "Chưa đăng nhập. Vui lòng đăng nhập trước.",
  "redirect": "/login"
}
```

**✅ Test đạt**: Session bị xóa, không thể truy cập /profile

---

## 📡 **Cách 2: Kiểm tra bằng Postman (Dễ hơn, có UI)**

### Bước 1: Tải & Cài Postman
- Tải từ: https://www.postman.com/downloads/
- Hoặc sử dụng: **Thunder Client** (extension VS Code)

### Bước 2: Import Collection
1. Mở Postman → **Import**
2. Chọn file: `POSTMAN_COLLECTION.json` từ thư mục backend
3. Postman sẽ tự động tạo các request

### Bước 3: Chạy lần lượt
- ✅ **1. Trang chủ** - Xem theme mặc định (light)
- ✅ **2a. Đặt theme - Dark** - Lưu theme vào cookie
- ✅ **1. Trang chủ** - Kiểm tra theme thay đổi thành dark
- ✅ **3b. Đăng nhập** - Đăng nhập với username
- ✅ **4a. Xem profile (lần 1)** - profileVisitCount = 1
- ✅ **4b. Xem profile (lần 2)** - profileVisitCount = 2
- ✅ **4c. Xem profile (lần 3)** - profileVisitCount = 3
- ✅ **5. Đăng xuất** - Xóa session
- ✅ **6. Cố gắng xem profile** - Lỗi 401 (chưa login)

---

## 🌐 **Cách 3: Kiểm tra bằng Browser**

Browser chỉ hỗ trợ GET request, vì vậy ta chỉ test được các GET:

### Kiểm tra Theme
1. Truy cập: `http://localhost:3000/`
2. Truy cập: `http://localhost:3000/set-theme/dark`
3. Truy cập lại: `http://localhost:3000/` (theme vẫn là dark)

### Kiểm tra Session (sau khi dùng Postman đăng nhập)
- Truy cập: `http://localhost:3000/profile` (nếu đã login qua Postman)
- Truy cập: `http://localhost:3000/logout`
- Truy cập lại: `http://localhost:3000/profile` (sẽ lỗi)

---

## 🧪 **Cách 4: Kiểm tra bằng Thunder Client (Trong VS Code)**

### Bước 1: Cài Thunder Client
1. Mở VS Code → Extensions
2. Tìm "Thunder Client" → Click Install

### Bước 2: Test API
1. Nhấn **Thunder Client** icon trên sidebar
2. Tạo request:
   - **Request 1**: GET `http://localhost:3000/`
   - **Request 2**: GET `http://localhost:3000/set-theme/dark`
   - **Request 3**: POST `http://localhost:3000/login` với body: `{"username":"student123"}`
   - **Request 4**: GET `http://localhost:3000/profile`

---

## 📊 **Bảng Tóm tắt Kiểm tra**

| # | Chức năng | Method | URL | Input | Kết quả mong đợi | Status |
|---|-----------|--------|-----|-------|-------------------|--------|
| 1 | Xem trang chủ | GET | `/` | - | Hiển thị theme light | 200 ✅ |
| 2 | Đặt theme dark | GET | `/set-theme/dark` | - | Cookie theme=dark | 200 ✅ |
| 3 | Xem trang chủ | GET | `/` | - | Hiển thị theme dark | 200 ✅ |
| 4 | Đăng nhập | POST | `/login` | `{username}` | Session lưu username | 200 ✅ |
| 5 | Xem profile (1) | GET | `/profile` | - | profileVisitCount: 1 | 200 ✅ |
| 6 | Xem profile (2) | GET | `/profile` | - | profileVisitCount: 2 | 200 ✅ |
| 7 | Xem profile (3) | GET | `/profile` | - | profileVisitCount: 3 | 200 ✅ |
| 8 | Đăng xuất | GET | `/logout` | - | Session xóa | 200 ✅ |
| 9 | Xem profile | GET | `/profile` | - | Lỗi chưa login | 401 ❌ |

---

## 🔍 **Cách Debug nâng cao**

### Xem session info
```powershell
curl http://localhost:3000/session-info
```

**Kết quả:**
```json
{
  "sessionId": "abc123def456xyz",
  "user": {
    "username": "student123",
    "loginTime": "2024-12-15T10:30:45.000Z"
  },
  "cookies": {
    "theme": "dark"
  },
  "sessionData": {
    "profileVisitCount": 3,
    "viewCount": 3
  }
}
```

### Xóa theme cookie
```powershell
curl http://localhost:3000/logout-theme
```

---

## 💡 **Lưu ý quan trọng**

### Khi dùng cURL
- **Cookie tự động**: cURL không tự động lưu cookie như browser/Postman
- **Giải pháp**: Dùng Postman hoặc Thunder Client (tự động quản lý cookie)
- **Hoặc**: Dùng `-c` flag để lưu cookie:
  ```powershell
  curl -c cookies.txt http://localhost:3000/set-theme/dark
  curl -b cookies.txt http://localhost:3000/
  ```

### Khi dùng Postman
- ✅ Tự động quản lý cookie
- ✅ Tự động quản lý session
- ✅ Giao diện dễ dùng
- ❌ Phải cài thêm phần mềm

### Khi dùng Browser
- ✅ Không cần cài gì thêm
- ✅ Tự động quản lý cookie/session
- ❌ Chỉ hỗ trợ GET request

### Khi dùng Thunder Client
- ✅ Tự động quản lý cookie
- ✅ Tự động quản lý session
- ✅ Ngay trong VS Code
- ✅ Nhẹ, không cần cài riêng

---

## 🎯 **Kết luận**

**Khuyến nghị**: Dùng **Postman** hoặc **Thunder Client** để test vì:
1. ✅ Tự động quản lý cookie & session
2. ✅ Hiển thị kết quả rõ ràng
3. ✅ Lưu được các request để test lại sau
4. ✅ Dễ debug

**Happy Testing! 🚀**
