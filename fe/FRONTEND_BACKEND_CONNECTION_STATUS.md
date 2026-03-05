# 🔍 Trạng thái kết nối Frontend - Backend

## 📊 Tình trạng hiện tại

### ✅ Frontend (Port 3000)
- **Trạng thái:** Đang chạy
- **URL:** http://localhost:3000
- **Phương thức đăng nhập:** Kết nối TRỰC TIẾP database

### ❌ Backend (Port 5000)
- **Trạng thái:** KHÔNG được sử dụng
- **Lý do:** Backend trả về lỗi 500 khi xử lý login
- **Giải pháp tạm thời:** Frontend bỏ qua backend, kết nối thẳng database

## 🔧 Kiến trúc hiện tại

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ↓
┌─────────────────────────┐
│  Frontend (Port 3000)   │
│   Next.js API Routes    │
└──────────┬──────────────┘
           │
           ↓ (Direct Connection)
    ┌──────────────┐
    │   Database   │
    │  IdentityDB  │
    └──────────────┘

❌ Backend (Port 5000) - NOT USED
```

## 📝 Chi tiết

### File: src/app/api/auth/login/route.ts
- Kết nối trực tiếp database qua `getDbConnection()`
- Xác thực password bằng bcrypt
- Tạo JWT token
- **KHÔNG gọi backend ASP.NET Core**

### Logs từ server:
```
🔧 DB Config: { user: 'sa', ... }
🔍 Login attempt for: manager1@company.com
Database connected successfully
❌ Invalid password for: manager1@company.com
```

## 🎯 Để kết nối lại Backend

Nếu muốn sử dụng backend, cần:

1. **Sửa backend** để không trả về lỗi 500
2. **Khôi phục code cũ** trong `src/app/api/auth/login/route.ts`:
   ```typescript
   const response = await fetch(`${BACKEND_URL}/api/Auth/login`, {...})
   ```

3. **Hoặc giữ nguyên** - Frontend hoạt động tốt với database trực tiếp

## ⚠️ Password hiện tại

Chỉ có `admin@company.com` đã được reset password thành `Admin@123`.

Các tài khoản khác vẫn dùng password cũ từ backend seed data.
