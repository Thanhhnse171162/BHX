import { Permission } from '@/shared/types'
import { canAccessModule } from '@/shared/auth/permission-map'

export interface NavItem {
  label: string
  href: string
  icon?: string
  requiredPermission?: Permission | Permission[]
  children?: NavItem[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const getOpsNavigation = (userPermissions: Permission[]): NavItem[] => {
  const items: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/ops',
      icon: 'Home',
    },
  ]

  if (canAccessModule(userPermissions, 'orderOnline') || canAccessModule(userPermissions, 'orderPos')) {
    items.push({
      label: 'Orders',
      href: '/ops/orders',
      icon: 'ShoppingCart',
      children: [],
    })
  }

  if (canAccessModule(userPermissions, 'inventory')) {
    items.push({
      label: 'Inventory',
      href: '/ops/inventory',
      icon: 'Package',
    })
  }

  if (canAccessModule(userPermissions, 'shifts')) {
    items.push({
      label: 'Shifts',
      href: '/ops/shifts',
      icon: 'Clock',
    })
  }

  if (canAccessModule(userPermissions, 'delivery')) {
    items.push({
      label: 'Delivery',
      href: '/ops/delivery',
      icon: 'Truck',
    })
  }

  if (canAccessModule(userPermissions, 'reports')) {
    items.push({
      label: 'Reports',
      href: '/ops/reports',
      icon: 'BarChart3',
    })
  }

  return items
}

export const getAdminNavigation = (): NavGroup[] => {
  return [
    {
      label: 'Doanh thu',
      items: [
        {
          label: 'Bảng điều khiển',
          href: '/admin/dashboard',
          icon: 'LayoutDashboard',
        },
      ],
    },
    {
      label: 'Người dùng & Phân quyền',
      items: [
        {
          label: 'Quản lý người dùng',
          href: '/admin/users',
          icon: 'Users',
        },
      ],
    },
    {
      label: 'Sản phẩm & Danh mục',
      items: [
        {
          label: 'Sản phẩm',
          href: '/admin/catalog/products',
          icon: 'Package2',
        },
        {
          label: 'Danh mục',
          href: '/admin/catalog/categories',
          icon: 'FolderTree',
        },
      ],
    },
    {
      label: 'Nhà cung cấp',
      items: [
        {
          label: 'Quản lý nhà cung cấp',
          href: '/admin/suppliers',
          icon: 'Truck',
        },
      ],
    },
    {
      label: 'Kho & Tồn kho',
      items: [
        {
          label: 'Quản lý kho',
          href: '/warehouses',
          icon: 'Building2',
        },
        {
          label: 'Yêu cầu nhập hàng',
          href: '/replenishment-admin',
          icon: 'PackageSearch',
        },
        {
          label: 'Cảnh báo tồn thấp',
          href: '/inventory-admin/alerts',
          icon: 'AlertTriangle',
        },
      ],
    },
    {
      label: 'Báo cáo',
      items: [
        // Sales Reports entry removed
        {
          label: 'Báo cáo hư hại',
          href: '/admin/reports',
          icon: 'BarChart3',
        },
      ],
    },
  ]
}

export const getCustomerNavigation = (): NavItem[] => {
  return [
    {
      label: 'Dashboard',
      href: '/customer',
      icon: 'Home',
    },
    {
      label: 'Orders',
      href: '/customer/orders',
      icon: 'ShoppingCart',
    },
    {
      label: 'Loyalty',
      href: '/customer/loyalty',
      icon: 'Heart',
    },
    {
      label: 'Profile',
      href: '/customer/profile',
      icon: 'User',
    },
  ]
}

export const getStaffNavigation = (): NavItem[] => {
  return [
    {
      label: 'Dashboard',
      href: '/staff',
      icon: 'Home',
    },
    {
      label: 'Attendance',
      href: '/staff/attendance',
      icon: 'Calendar',
    },
    {
      label: 'Tasks',
      href: '/staff/tasks',
      icon: 'CheckSquare',
    },
    {
      label: 'Schedule',
      href: '/staff/schedule',
      icon: 'Clock',
    },
    {
      label: 'My Performance',
      href: '/staff/kpi',
      icon: 'BarChart3',
    },
    {
      label: 'Announcements',
      href: '/staff/announcements',
      icon: 'Bell',
    },
  ]
}
