'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/shared/ui/PageHeader'
import { useAuthStore } from '@/store/auth.store'

interface DashboardStats {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Redirect to admin if not authenticated
    if (!token) {
      router.push('/login')
      return
    }

    // For now, just show placeholder stats
    // In production, fetch real data from API
    const placeholderStats: DashboardStats = {
      totalUsers: 250,
      totalProducts: 1500,
      totalOrders: 3420,
      totalRevenue: 125000000,
    }
    
    setStats(placeholderStats)
    setIsLoading(false)
  }, [token, router])

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Dashboard"
          subtitle="Tổng quan hệ thống"
          breadcrumbs={[
            { label: 'Trang chủ', href: '/dashboard' },
          ]}
        />
        <div className="card flex justify-center items-center py-12">
          <div className="text-gray-600">Đang tải dữ liệu...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Dashboard"
        subtitle="Tổng quan hệ thống quản lý Bách Hóa Xanh"
        breadcrumbs={[
          { label: 'Trang chủ', href: '/dashboard' },
        ]}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Users */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng người dùng</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.totalUsers.toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.totalProducts.toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 7a3 3 0 110-6 3 3 0 010 6zM7 14a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.totalOrders.toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.31-1.243A1 1 0 005 4H3z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {(stats.totalRevenue / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}M
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.16 5.314l4.897-1.596A1 1 0 0114 4.001V2a1 1 0 10-2 0v.88l-5.118 1.667A1 1 0 006 5.882V6a1 1 0 002 0v-.118a1 1 0 00.16-.568z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Chào mừng, {user?.email || 'Admin'}!
        </h3>
        <p className="text-gray-600">
          Đây là bảng điều khiển tổng quan của hệ thống quản lý Bách Hóa Xanh. 
          Sử dụng menu bên trái để điều hướng đến các chức năng khác nhau như quản lý sản phẩm, 
          quản lý người dùng, báo cáo doanh số, và nhiều hơn nữa.
        </p>
      </div>

      {/* Quick Links */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Liên kết nhanh</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a 
            href="/admin/catalog/products"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <p className="font-medium text-gray-900">Sản phẩm</p>
            <p className="text-sm text-gray-600">Quản lý danh mục sản phẩm</p>
          </a>
          <a 
            href="/admin/users"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <p className="font-medium text-gray-900">Người dùng</p>
            <p className="text-sm text-gray-600">Quản lý tài khoản người dùng</p>
          </a>
          <a 
            href="/admin/orders"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <p className="font-medium text-gray-900">Đơn hàng</p>
            <p className="text-sm text-gray-600">Quản lý đơn hàng bán hàng</p>
          </a>
          <a 
            href="/admin/reports"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <p className="font-medium text-gray-900">Báo cáo</p>
            <p className="text-sm text-gray-600">Xem báo cáo doanh số</p>
          </a>
        </div>
      </div>
    </div>
  )
}
