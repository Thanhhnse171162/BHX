# Staff Portal - Hướng dẫn sử dụng

## Tổng quan
Staff Portal là giao diện dành riêng cho nhân viên cửa hàng (Store Staff) với role ID = 5 và email có đuôi @company.com.

## Yêu cầu đăng nhập
- **Role ID**: 5 (STAFF)
- **Email**: Phải có đuôi `@company.com`
- **Ví dụ**: `staff@company.com`, `john.doe@company.com`

## Cấu trúc Routes

### Routes chính
- `/staff` - Dashboard/Home
- `/staff/attendance` - Lịch sử chấm công
- `/staff/tasks` - Danh sách công việc
- `/staff/tasks/[id]` - Chi tiết công việc
- `/staff/schedule` - Lịch làm việc
- `/staff/kpi` - Chỉ số hiệu suất
- `/staff/announcements` - Thông báo

## Tính năng chính

### 1. Dashboard (`/staff`)
- **Welcome Card**: Hiển thị thông tin nhân viên
- **Check In/Out**: Chấm công vào/ra ca
- **Shift Status**: Thông tin ca làm việc hiện tại
- **Daily Tasks**: Nhiệm vụ trong ngày
- **Profile Card**: Thông tin cá nhân
- **Work Targets**: Mục tiêu công việc
- **Announcements**: Thông báo nhanh

### 2. Attendance (`/staff/attendance`)
- Lịch sử chấm công
- Bộ lọc theo thời gian (All, Week, Month)
- Trạng thái: Present, Late, Absent
- Thống kê tháng hiện tại

### 3. Tasks (`/staff/tasks`)
- Danh sách công việc
- Bộ lọc: All, Today, Week, Month
- Chế độ xem: List/Calendar
- Độ ưu tiên: High, Medium, Low
- Trạng thái: Pending, In Progress, Completed

### 4. Task Detail (`/staff/tasks/[id]`)
- Mô tả chi tiết
- Checklist công việc
- Ghi chú và bình luận
- Upload hình ảnh
- Request help

### 5. Schedule (`/staff/schedule`)
- Lịch làm việc theo tuần/tháng
- Thông tin ca làm việc
- Tổng số giờ làm việc
- Request time off
- Swap shift

### 6. KPI (`/staff/kpi`)
- Chỉ số hiệu suất cá nhân
- Tasks completed
- Customer satisfaction
- On-time rate
- Items stocked
- Performance trend chart
- Goals & achievements
- Team ranking

### 7. Announcements (`/staff/announcements`)
- Thông báo công ty
- Bộ lọc: All, Unread, Urgent
- Phân loại: General, Urgent, Policy, Event
- Notifications panel

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Authentication**: JWT with HTTP-only cookies

### Key Files

#### Types & Config
```
src/
  shared/
    types/
      index.ts                 # User, Role, Permission types
    utils/
      role.ts                  # Role helper functions
    config/
      nav.ts                   # Staff navigation config
    auth/
      permission-map.ts        # Staff permissions
```

#### Pages
```
src/
  app/
    (staff)/
      layout.tsx              # Staff layout với sidebar
      page.tsx                # Dashboard
      attendance/
        page.tsx              # Attendance history
      tasks/
        page.tsx              # Task list
        [id]/
          page.tsx            # Task detail
      schedule/
        page.tsx              # Schedule calendar
      kpi/
        page.tsx              # KPI metrics
      announcements/
        page.tsx              # Announcements
```

#### Middleware
```
src/
  app/
    middleware.ts             # Route protection
```

## Authentication Flow

1. User đăng nhập với email @company.com
2. Backend trả về `roleId = 5`
3. Frontend map `roleId = 5` -> `role = 'STAFF'`
4. Kiểm tra email có đuôi @company.com
5. Nếu pass, redirect đến `/staff`
6. Middleware kiểm tra quyền truy cập

## Permission Map

Staff có các quyền sau:
```typescript
STAFF: [
  'ORDER_POS_READ',
  'ORDER_POS_WRITE',
  'SHIFT_READ',
  'INVENTORY_READ',
]
```

## Color Scheme

- **Primary**: Emerald (#10B981, #059669)
- **Secondary**: Blue, Purple, Orange
- **Background**: Gray-50
- **Text**: Gray-900, Gray-600

## Icons

Sử dụng emoji cho icons:
- 🏠 Dashboard
- 📅 Attendance
- ✅ Tasks
- 🕒 Schedule
- 📊 KPI
- 🔔 Announcements

## API Integration (TODO)

Các endpoint cần implement:
```
POST /api/staff/check-in
POST /api/staff/check-out
GET  /api/staff/attendance
GET  /api/staff/tasks
PUT  /api/staff/tasks/:id
GET  /api/staff/schedule
GET  /api/staff/kpi
GET  /api/staff/announcements
```

## Testing

### Test với mock data
1. Login với email: `staff@company.com`
2. Backend response cần: `{ roleId: 5, email: "staff@company.com" }`
3. Redirect tự động đến `/staff`

### Test cases
- ✅ Login với roleId = 5 và email @company.com
- ✅ Redirect về /staff
- ✅ Access các trang con
- ✅ Middleware bảo vệ routes
- ✅ Logout và clear session

## Responsive Design

- **Desktop**: Full sidebar navigation
- **Tablet**: Collapsible sidebar
- **Mobile**: Bottom navigation (TODO)

## Future Enhancements

- [ ] Real-time notifications
- [ ] Push notifications cho mobile
- [ ] Offline mode với Service Worker
- [ ] Camera integration cho attendance
- [ ] QR code scanning
- [ ] Performance analytics
- [ ] Team chat/messaging
- [ ] File attachments trong tasks
- [ ] Calendar sync (Google Calendar, Outlook)
- [ ] Mobile app (React Native)

## Development

### Run dev server
```bash
npm run dev
```

### Build for production
```bash
npm run build
npm start
```

### Environment variables
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Troubleshooting

### Issue: Không redirect đến /staff sau login
- Kiểm tra roleId từ backend = 5
- Kiểm tra email có đuôi @company.com
- Clear cookies và login lại

### Issue: Middleware redirect về /login
- Kiểm tra cookie `auth_token` và `user_role`
- Verify user role = 'STAFF'

### Issue: Layout không hiển thị
- Kiểm tra user object trong Zustand store
- Verify typeof window !== 'undefined'

## Support

Liên hệ: dev@company.com
