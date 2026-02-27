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
      label: 'Tổng quan',
      items: [
        {
          label: 'Dashboard',
          href: '/admin/dashboard',
          icon: 'LayoutDashboard',
        },
      ],
    },
    {
      label: 'Người dùng & Phân quyền',
      items: [
        {
          label: 'Users Management',
          href: '/admin/users',
          icon: 'Users',
        },
        {
          label: 'Roles & Permissions',
          href: '/admin/users/roles',
          icon: 'ShieldCheck',
        },
      ],
    },
    {
      label: 'Sản phẩm & Danh mục',
      items: [
        {
          label: 'Products',
          href: '/admin/catalog/products',
          icon: 'Package2',
        },
        {
          label: 'Categories',
          href: '/admin/catalog/categories',
          icon: 'FolderTree',
        },
      ],
    },
    {
      label: 'Kho & Tồn kho',
      items: [
        {
          label: 'Inventory Overview',
          href: '/inventory-admin',
          icon: 'Warehouse',
        },
        {
          label: 'Item Stock',
          href: '/inventory-admin/stock',
          icon: 'PackageCheck',
        },
        {
          label: 'Low-stock Alerts',
          href: '/inventory-admin/alerts',
          icon: 'AlertTriangle',
        },
        {
          label: 'Inventory Logs',
          href: '/inventory-admin/logs',
          icon: 'ScrollText',
        },
      ],
    },
    {
      label: 'Đơn hàng',
      items: [
        {
          label: 'Online Orders',
          href: '/admin/orders/online',
          icon: 'ShoppingCart',
        },
        {
          label: 'POS Orders',
          href: '/admin/orders/pos',
          icon: 'Store',
        },
        {
          label: 'Order Status',
          href: '/admin/orders',
          icon: 'ListChecks',
        },
      ],
    },
    {
      label: 'Khách hàng & Loyalty',
      items: [
        {
          label: 'Customers',
          href: '/admin/customers',
          icon: 'UserCircle',
        },
        {
          label: 'Loyalty & Points',
          href: '/admin/loyalty',
          icon: 'Award',
        },
      ],
    },
    {
      label: 'Khuyến mãi',
      items: [
        {
          label: 'Promotions',
          href: '/admin/promotions',
          icon: 'Tag',
        },
        {
          label: 'Coupons',
          href: '/admin/promotions/coupons',
          icon: 'Ticket',
        },
      ],
    },
    {
      label: 'Báo cáo',
      items: [
        {
          label: 'Sales Reports',
          href: '/admin/reports/sales',
          icon: 'TrendingUp',
        },
        {
          label: 'Inventory Reports',
          href: '/admin/reports/inventory',
          icon: 'PackageOpen',
        },
        {
          label: 'Profit & Loss',
          href: '/admin/reports/finance',
          icon: 'DollarSign',
        },
        {
          label: 'All Reports',
          href: '/admin/reports',
          icon: 'BarChart3',
        },
      ],
    },
    {
      label: 'Hệ thống',
      items: [
        {
          label: 'Configuration',
          href: '/admin/system/config',
          icon: 'Settings',
        },
        {
          label: 'Security',
          href: '/admin/system/security',
          icon: 'Lock',
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
