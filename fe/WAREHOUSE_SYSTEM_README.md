# Warehouse Staff System - Hệ Thống Quản Lý Kho

## Tổng Quan

Hệ thống Warehouse Staff được thiết kế dành riêng cho nhân viên kho (role_id = 4) với email có đuôi `@company.com`. Hệ thống cung cấp đầy đủ các chức năng quản lý kho bao gồm:

- **Dashboard**: Tổng quan thống kê kho hàng
- **Stock In / Stock Out**: Ghi nhận nhập/xuất kho
- **Inventory List**: Danh sách tồn kho chi tiết
- **Low Stock Alerts**: Cảnh báo hàng sắp hết
- **Inventory Checks**: Lịch sử kiểm kê
- **Staff Attendance**: Chấm công nhân viên

## Đăng Nhập

### Yêu Cầu
- Email phải có đuôi `@company.com`
- Role ID phải là **4** (Warehouse Staff) trong database

### Ví Dụ User Đăng Nhập
```
Email: thanh@company.com
Password: [mật khẩu của bạn]
Role ID: 4
```

Sau khi đăng nhập thành công, hệ thống sẽ tự động redirect đến `/warehouse`

## Cấu Trúc Hệ Thống

```
/warehouse
├── /                           # Dashboard - Trang chủ
├── /inventory                  # Danh sách tồn kho
├── /stock-movement            # Nhập/Xuất kho
├── /low-stock                 # Cảnh báo hàng sắp hết
├── /checks                    # Lịch sử kiểm kê
└── /attendance                # Chấm công nhân viên
```

## Tính Năng Chi Tiết

### 1. Dashboard (`/warehouse`)
- **Statistics Cards**: 
  - Total Products: Tổng số mặt hàng
  - In Stock Items: Số lượng hàng trong kho
  - Low Stock Items: Số lượng hàng sắp hết
  - Out of Stock: Số lượng hàng đã hết
  
- **Inventory List**: Bảng danh sách hàng hóa với trạng thái
- **Low Stock Alerts**: Cảnh báo hàng cần đặt lại
- **Inventory Check History**: Lịch sử kiểm kê
- **Staff Attendance**: Thống kê chấm công
- **Recent Stock Movements**: Nhập/xuất kho gần đây

### 2. Stock In / Stock Out (`/warehouse/stock-movement`)
- **Record Stock In**: Ghi nhận hàng nhập kho
  - Thông tin: SKU, số lượng, lý do, ghi chú
  - Lý do: Supplier Delivery, Purchase Order, Return from Store, Other
  
- **Record Stock Out**: Ghi nhận hàng xuất kho
  - Thông tin: SKU, số lượng, lý do, ghi chú
  - Lý do: Store Transfer, Customer Order, Damaged Items, Expired Items, Other

- **Movement History**: Lịch sử tất cả các lần nhập/xuất
- **Filter by Type**: Lọc theo loại (All, Stock In, Stock Out)
- **Statistics**: Thống kê tổng nhập/xuất theo ngày

### 3. Inventory List (`/warehouse/inventory`)
- **Search & Filter**: Tìm kiếm theo tên/SKU và lọc theo trạng thái
- **Detailed View**: Xem chi tiết từng sản phẩm
  - Product Name, SKU, Category
  - Quantity, Unit
  - Status (In Stock, Low Stock, Out of Stock)
  - Last Updated
  
- **Export**: Xuất báo cáo Excel/PDF
- **Summary Statistics**: Tổng hợp số liệu

### 4. Low Stock Alerts (`/warehouse/low-stock`)
- **Alert Cards**: Hiển thị từng mặt hàng sắp hết với:
  - Current stock vs Minimum quantity
  - Days until reorder
  - Urgent flag (≤2 days)
  - Visual progress bar
  
- **Actions**:
  - Reorder Now: Đặt hàng ngay
  - View Details: Xem chi tiết
  
- **Summary Stats**: Tổng cảnh báo, mục khẩn cấp, trung bình ngày đặt lại

### 5. Inventory Checks (`/warehouse/checks`)
- **Check History**: Lịch sử các lần kiểm kê với:
  - Date & Time
  - Checked By (người kiểm)
  - Items Checked
  - Discrepancies (sai lệch)
  - Duration (thời gian)
  
- **Start New Check**: Bắt đầu kiểm kê mới
- **View Reports**: Xem báo cáo chi tiết
- **Export PDF**: Xuất báo cáo PDF
- **Next Scheduled Check**: Lịch kiểm kê tiếp theo

### 6. Staff Attendance (`/warehouse/attendance`)
- **Daily Attendance**: Chấm công hàng ngày
  - Check-in / Check-out times
  - Hours worked
  - Present / Absent status
  
- **Statistics**:
  - Total Staff
  - Check-ins / Check-outs
  - Absent count
  - Average hours worked
  
- **Weekly Summary**: Tổng hợp theo tuần
- **Late Arrivals**: Danh sách đi muộn
- **Export Report**: Xuất báo cáo chấm công

## UI Components

### Sidebar
- Màu xanh lá chủ đạo (#2d6e3e)
- Logo/Brand ở đầu
- Navigation menu với icons
- Active state highlight

### Header
- Welcome message với tên user
- Role badge: "Warehouse Staff | BK02"
- Avatar
- Logout button

### Cards & Tables
- Statistics cards với gradient backgrounds
- Clean white tables với hover effects
- Color-coded status badges:
  - Green: In Stock, Present, Completed
  - Orange: Low Stock, Late
  - Red: Out of Stock, Absent, Urgent

## Permissions

Warehouse Staff có các quyền sau:
- `INVENTORY_READ`: Xem thông tin kho
- `INVENTORY_WRITE`: Cập nhật thông tin kho
- `SHIFT_READ`: Xem ca làm việc

## Security

### Route Protection
- Middleware kiểm tra role_id = 4 và email @company.com
- Redirect về `/login` nếu không đủ điều kiện
- Layout component double-check authentication

### Authentication Flow
1. User đăng nhập tại `/login`
2. Backend verify credentials và trả về role_id
3. Frontend check `isWarehouseStaffUser(roleId, email)`
4. Nếu match, redirect đến `/warehouse`
5. Middleware và layout verify lại quyền truy cập

## Cài Đặt & Chạy

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Truy cập: `http://localhost:3000`

## Database Schema

### Roles Table
```sql
id | name               | description
---|-------------------|----------------------------------
4  | Warehouse Staff   | Warehouse Staff - Manage inventory
```

### Users Table
Warehouse staff users cần có:
- `role_id = 4`
- `email` kết thúc bằng `@company.com`
- `status = 'ACTIVE'`

## Troubleshooting

### Không thể đăng nhập vào warehouse?
1. Kiểm tra email có đuôi `@company.com`
2. Verify role_id = 4 trong database
3. Check account status = 'ACTIVE'
4. Clear cookies và thử lại

### Bị redirect về login page?
- Middleware đang block do không đủ permissions
- Check cookies: `auth_token` và `user_role`
- Verify token chưa expire

### UI không hiển thị đúng?
1. Clear browser cache
2. Check console errors
3. Verify Tailwind CSS đã compile
4. Run `npm run dev` để rebuild

## Technical Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: Zustand
- **Auth**: JWT Tokens + Cookies

## File Structure

```
src/
├── app/
│   └── warehouse/
│       ├── layout.tsx                 # Layout với auth check
│       ├── page.tsx                   # Dashboard
│       ├── inventory/
│       │   └── page.tsx              # Inventory list
│       ├── stock-movement/
│       │   └── page.tsx              # Stock in/out
│       ├── low-stock/
│       │   └── page.tsx              # Low stock alerts
│       ├── checks/
│       │   └── page.tsx              # Inventory checks
│       └── attendance/
│           └── page.tsx              # Staff attendance
├── shared/
│   ├── ui/
│   │   ├── WarehouseSidebar/
│   │   │   └── index.tsx             # Sidebar component
│   │   └── WarehouseHeader/
│   │       └── index.tsx             # Header component
│   ├── utils/
│   │   └── role.ts                   # isWarehouseStaffUser()
│   └── auth/
│       └── permission-map.ts         # WAREHOUSE_STAFF permissions
└── types/
    └── index.ts                      # WAREHOUSE_STAFF type
```

## API Integration (Future)

Để kết nối với backend:

```typescript
// Example API calls
import { apiClient } from '@/shared/api/http'

// Get inventory
const inventory = await apiClient.get('/warehouse/inventory')

// Record stock in
await apiClient.post('/warehouse/stock-in', {
  sku: 'APL123',
  quantity: 100,
  reason: 'Supplier Delivery'
})

// Get low stock alerts
const alerts = await apiClient.get('/warehouse/low-stock')
```

## Liên Hệ & Hỗ Trợ

Nếu có vấn đề hoặc cần hỗ trợ, vui lòng liên hệ:
- Email: support@company.com
- Phone: 0123-456-789

---

**Version**: 1.0.0  
**Last Updated**: February 26, 2024  
**Created By**: Development Team
