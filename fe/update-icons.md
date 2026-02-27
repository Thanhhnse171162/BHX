# Icons đã được cập nhật trong Staff Portal

## Layout (layout.tsx) ✅
- Sidebar icons: Home, Calendar, CheckSquare, Clock, BarChart3, Bell
- Navigation icons: ChevronLeft, ChevronRight
- Logout icon: LogOut

## Dashboard (page.tsx) ✅  
- Quick Actions: Clock, CheckSquare, Calendar
- KPI Cards buttons: Edit2 
- On-Time Rate badge: BarChart2

## Các icons còn lại cần update thủ công:

### Dashboard
- Award (replace 🏆)
- Building2 (replace 🏢)
- ThumbsUp (replace 👍)  
- Star (replace ⭐)

### Attendance
- Check, LogOut icons trong buttons
- Clock icons

### Tasks
- Search, Check, Calendar, MoreVertical icons

### Schedule  
- ChevronLeft, ChevronRight, Clock
- MapPin, Briefcase, User icons

### KPI/Performance
- Edit2, Award, Building2, ThumbsUp, Star, Sparkles icons

### Announcements
- AlertTriangle, FileText, PartyPopper, Megaphone
- User, Clock, ChevronRight icons

## Import statement cần thêm:
```tsx
import { 
  // Navigation
  Home, Calendar, CheckSquare, Clock, BarChart3, Bell, ChevronLeft, ChevronRight,
  // Actions  
  LogOut, Edit2, Check, Search, MoreVertical,
  // Status
  Award, Building2, ThumbsUp, Star, Sparkles,
  // UI
  MapPin, Briefcase, User, AlertTriangle, FileText, PartyPopper, Megaphone
} from 'lucide-react'
```
