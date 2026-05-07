## 🚀 Hướng dẫn nhanh để test ứng dụng

### Bước 1: Cài đặt dependencies
```bash
cd backend
npm install
```

### Bước 2: Chạy server
```bash
npm start
```

Bạn sẽ thấy:
```
✓ Server đang chạy tại http://localhost:3000

📝 Hướng dẫn sử dụng:

1. Truy cập trang chủ: GET http://localhost:3000/
2. Đặt theme: GET http://localhost:3000/set-theme/dark
3. Đăng nhập: POST http://localhost:3000/login (body: { "username": "user123" })
4. Xem profile: GET http://localhost:3000/profile
5. Đăng xuất: GET http://localhost:3000/logout
6. Xem thông tin session: GET http://localhost:3000/session-info
```

### Bước 3: Test API bằng Postman hoặc cURL

#### **Kịch bản 1: Thay đổi theme**

1. Mở browser hoặc Postman
2. Truy cập: `http://localhost:3000/set-theme/dark`
3. Response: Theme đã lưu trong cookie

#### **Kịch bản 2: Đăng nhập & Xem Profile**

**Bước 1**: Tạo POST request đến `http://localhost:3000/login`
```json
{
  "username": "student123"
}
```

**Bước 2**: Truy cập profile lần 1
```
GET http://localhost:3000/profile
```
Response sẽ hiển thị `profileVisitCount: 1`

**Bước 3**: Xem profile lần 2 (F5 hoặc truy cập lại)
```
GET http://localhost:3000/profile
```
Response sẽ hiển thị `profileVisitCount: 2`

**Bước 4**: Đăng xuất
```
GET http://localhost:3000/logout
```

**Bước 5**: Cố gắng xem profile sau logout
```
GET http://localhost:3000/profile
```
Response: Lỗi 401 - Chưa đăng nhập

---

### 📌 Lưu ý khi sử dụng Postman

- **Cookie**: Postman tự động lưu cookies từ response. Đảm bảo bạn không "Clear Cookies"
- **Session ID**: Lưu trong cookie `connect.sid`
- **Theme Cookie**: Lưu trong cookie `theme`

---

### 🎯 Các tính năng để test

| Tính năng | Cách test | Kết quả mong đợi |
|-----------|-----------|------------------|
| **Cookie (Theme)** | Đặt theme, trở lại /, refresh | Theme vẫn là dark |
| **Session** | Đăng nhập rồi xem /session-info | Thấy user info trong session |
| **Access Control** | Xem /profile trước/sau login | Trước login: 401, Sau: 200 |
| **Visit Counter** | Xem /profile nhiều lần | Bộ đếm tăng từ 1, 2, 3... |
| **Logout** | Logout rồi xem /profile | 401 - Chưa đăng nhập |

---

### 💡 Thực hành thêm

Bạn có thể cải tiến ứng dụng:

1. ✅ **Thêm validation**: Email format, password strength
2. ✅ **Thêm database**: MongoDB, MySQL
3. ✅ **Thêm hash password**: bcryptjs
4. ✅ **Thêm middleware bảo mật**: CORS, HTTPS
5. ✅ **Thêm frontend**: HTML form đăng nhập
6. ✅ **Thêm remember me**: Lưu session lâu hơn
7. ✅ **Thêm auto logout**: Session timeout
8. ✅ **Thêm audit log**: Ghi lại lịch sử đăng nhập

---

**Chúc bạn thực hành vui vẻ! 🎓**
