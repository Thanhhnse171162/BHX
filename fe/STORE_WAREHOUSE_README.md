# Store Warehouse Management System

## 📋 Tổng quan

Hệ thống quản lý kho cửa hàng (Store Warehouse) được thiết kế riêng cho nhân viên kho tại các cửa hàng (Store #001, #002, etc.), khác biệt với hệ thống kho tổng (Central Warehouse).

## 🔐 Xác thực & Phân quyền

### Yêu cầu truy cập:
- **Email**: Phải có đuôi `@company.com`
- **Role ID**: Phải là `4` (Warehouse Staff - Manage inventory)

### Kiểm tra trong code:
```typescript
// Layout authentication check
if (user && (user.roleId !== 4 || !user.email?.endsWith('@company.com'))) {
  router.push('/')
  return
}
```

## 🚀 Truy cập hệ thống

**URL**: `/warehouse-store`

**Test Account**:
- Email: `manager2@company.com` (hoặc bất kỳ email nào với role_id = 4)
- Role ID: 4 (Warehouse Staff)
- Email phải có đuôi: `@company.com`

## 📊 Cấu trúc Menu

### 1. **Dashboard** (`/warehouse-store`)
Trang tổng quan hiển thị:
- ✅ Tổng số sản phẩm tại cửa hàng
- ✅ Số lượng hàng trong kho (storage)
- ✅ Số lượng hàng trên quầy (on shelf)
- ✅ Sản phẩm sắp hết
- ✅ Sản phẩm hết hàng
- ✅ **Hàng chờ nhận từ kho tổng** (Pending from Central)
- ✅ **Hàng đang chờ xuất ra quầy** (Waiting for Shelf)

### 2. **Receive Goods** (`/warehouse-store/receive-goods`)
Nhận hàng từ kho tổng:
- 📦 Danh sách phiếu chuyển hàng từ kho tổng
- ✔️ Xác nhận số lượng thực nhận
- ⚠️ Báo thiếu / hư hỏng
- 🔄 Cập nhật tồn kho tự động
- 📝 Lưu lịch sử nhận hàng

**Trạng thái phiếu chuyển**:
- `pending`: Chờ gửi
- `in-transit`: Đang vận chuyển
- `delivered`: Đã giao (sẵn sàng nhận)
- `confirmed`: Đã xác nhận

### 3. **Transfer to Shelf** (`/warehouse-store/transfer-to-shelf`)
Xuất hàng từ kho ra quầy bán:
- 📋 Chọn sản phẩm từ kho
- 🔢 Nhập số lượng xuất
- ⚡ Đề xuất tự động cho sản phẩm sắp hết trên quầy
- 🔄 Cập nhật tồn kho tự động
- 📝 Lưu lịch sử xuất quầy

**Tính năng đề xuất**:
- Hệ thống tự động phát hiện sản phẩm trên quầy sắp hết
- Gợi ý số lượng cần bổ sung (min stock x 2)

### 4. **Inventory List** (`/warehouse-store/inventory`)
Danh sách tồn kho cửa hàng:
- 📊 Hiển thị đầy đủ: Product, SKU, In Storage, On Shelf, Total
- 🔍 Tìm kiếm theo tên/SKU
- 🏷️ Lọc theo danh mục
- 📈 Lọc theo trạng thái (In Stock, Low Stock, Out of Stock, Need Restock)
- 📥 Xuất Excel

**Status gồm**:
- ✅ `In Stock`: Đầy đủ
- ⚠️ `Low Stock`: Sắp hết
- ❌ `Out of Stock`: Hết hàng
- 🔄 `Need Restock`: Cần nhập thêm

### 5. **Low Stock Alerts** (`/warehouse-store/low-stock`)
Cảnh báo sản phẩm gần hết:
- 🚨 Phân loại độ ưu tiên (Critical / Warning)
- 📊 Progress bar hiển thị mức tồn
- 💡 Đề xuất số lượng cần nhập
- ➡️ Tạo yêu cầu nhập hàng nhanh

**Mức độ cảnh báo**:
- 🔴 **Critical**: < 60% mức tối thiểu
- 🟠 **Warning**: 60% - 100% mức tối thiểu

### 6. **Restock Request** (`/warehouse-store/restock-request`)
Yêu cầu nhập hàng từ kho tổng:
- ➕ Tạo yêu cầu nhập hàng mới
- 📝 Chọn sản phẩm và số lượng
- 📋 Theo dõi trạng thái yêu cầu
- 💬 Thêm ghi chú

**Trạng thái yêu cầu**:
- ⏳ `Pending`: Chờ duyệt
- ✅ `Approved`: Đã duyệt
- 🚚 `Delivering`: Đang giao
- ✔️ `Completed`: Hoàn thành
- ❌ `Rejected`: Từ chối

### 7. **Inventory Check** (`/warehouse-store/inventory-check`)
Kiểm kê định kỳ cửa hàng:
- 📋 Bắt đầu phiên kiểm kê
- 🔢 So sánh thực tế với hệ thống
- ⚠️ Báo chênh lệch tự động
- 📝 Lưu lịch sử kiểm kê
- 📊 Xuất báo cáo

**Quy trình**:
1. Nhấn "Bắt đầu kiểm kê"
2. Nhập số lượng thực tế từng sản phẩm
3. Hệ thống tự động tính chênh lệch
4. Hoàn thành và cập nhật hệ thống

### 8. **Damaged / Expired** (`/warehouse-store/damaged-expired`)
Quản lý hàng hư hỏng và hết hạn:
- 📝 Ghi nhận hàng hư hỏng
- 📅 Ghi nhận hàng hết hạn
- ➖ Trừ tồn kho tự động
- 📋 Lưu biên bản
- 📊 Thống kê hàng loại bỏ

**Loại ghi nhận**:
- 🔴 **Damaged**: Hư hỏng (vận chuyển, lưu kho, bao bì, chất lượng)
- 🟠 **Expired**: Hết hạn (hết HSD, gần hết hạn, thu hồi)

## 🎨 Theme & Design

### Color Scheme:
- **Primary**: Blue (#1e40af) - Phân biệt với kho tổng (green)
- **Success**: Green
- **Warning**: Orange
- **Danger**: Red
- **Info**: Yellow

### Layout:
- Sidebar: 256px width, blue theme
- Header: White with shadow
- Content: Gray-50 background

## 📁 Cấu trúc Files

```
src/
├── app/
│   └── warehouse-store/
│       ├── layout.tsx                    # Layout với auth guard
│       ├── page.tsx                      # Dashboard
│       ├── receive-goods/
│       │   └── page.tsx
│       ├── transfer-to-shelf/
│       │   └── page.tsx
│       ├── inventory/
│       │   └── page.tsx
│       ├── low-stock/
│       │   └── page.tsx
│       ├── restock-request/
│       │   └── page.tsx
│       ├── inventory-check/
│       │   └── page.tsx
│       ├── damaged-expired/
│       │   └── page.tsx
│       └── out-of-stock/
│           └── page.tsx
│
└── shared/
    └── ui/
        ├── StoreWarehouseSidebar/
        │   └── index.tsx
        └── StoreWarehouseHeader/
            └── index.tsx
```

## 🔄 Khác biệt với Warehouse (Kho tổng)

| Tính năng | Central Warehouse (Kho tổng) | Store Warehouse (Kho cửa hàng) |
|-----------|------------------------------|--------------------------------|
| **Route** | `/warehouse` | `/warehouse-store` |
| **Role ID** | 2 (Warehouse Manager) | 4 (Warehouse Staff) |
| **Theme** | Green (#2d6e3e) | Blue (#1e40af) |
| **Stock Location** | Tổng kho | Storage + On Shelf |
| **Transfer** | Chuyển ra chi nhánh | Xuất ra quầy bán |
| **Receive** | Nhập từ nhà cung cấp | Nhận từ kho tổng |
| **Focus** | Quản lý tổng thể | Quản lý cửa hàng cụ thể |

## 📊 Mock Data

Tất cả các trang hiện tại đang sử dụng mock data để demo. Khi tích hợp backend, cần:

1. Thay thế mock data bằng API calls
2. Kết nối với database (IdentityDB)
3. Implement real-time updates
4. Add authentication middleware
5. Handle loading states và error handling

## 🧪 Testing

### Test Authentication:
1. Đăng nhập với email không có đuôi `@company.com` → Redirect về home
2. Đăng nhập với role_id khác 4 → Redirect về home
3. Đăng nhập với email `@company.com` và role_id = 4 → Truy cập thành công

### Test Navigation:
- Kiểm tra tất cả menu items navigate đúng
- Kiểm tra active state của menu
- Kiểm tra responsive design

### Test Features:
- ✅ Dashboard hiển thị đúng statistics
- ✅ Receive Goods: confirm nhận hàng
- ✅ Transfer to Shelf: xuất hàng ra quầy
- ✅ Inventory List: filter và search
- ✅ Low Stock: alerts và suggestions
- ✅ Restock Request: tạo và theo dõi
- ✅ Inventory Check: kiểm kê và chênh lệch
- ✅ Damaged/Expired: ghi nhận và loại bỏ

## 🚀 Getting Started

1. **Development**:
   ```bash
   npm run dev
   ```

2. **Truy cập**:
   - Đăng nhập với account có role_id = 4 và email @company.com
   - Navigate đến: `http://localhost:3000/warehouse-store`

3. **Production**:
   ```bash
   npm run build
   npm start
   ```

## 📝 Notes

- ⚠️ Tất cả component hiện tại là **client-side** (`'use client'`)
- 🔄 Cần implement API integration cho production
- 📊 Mock data phục vụ demo và development
- 🎨 Design system consistent với theme blue cho Store Warehouse
- 🔐 Authentication guard được implement trong layout.tsx

## 🎯 Next Steps

1. **Backend Integration**:
   - Connect to IdentityDB
   - Implement real API endpoints
   - Add proper error handling

2. **Features Enhancement**:
   - Real-time notifications
   - Barcode scanning
   - Print reports
   - Image upload for damaged goods

3. **Performance**:
   - Add loading skeletons
   - Implement pagination
   - Cache frequently accessed data

4. **Testing**:
   - Unit tests
   - Integration tests
   - E2E tests

---

**Created**: March 2, 2026  
**Version**: 1.0.0  
**Status**: Ready for Integration ✅
