'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated, hydrated } = useAuthStore()

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated || !user) return
    
    const portalMap: Partial<Record<typeof user.role, string>> = {
      ADMIN: '/admin/dashboard',
      STORE_MANAGER: '/store-manager',
      WAREHOUSE_MANAGER: '/warehouse-manager',
      WAREHOUSE_ADMIN: '/warehouse',
      WAREHOUSE_STAFF: '/warehouse-store',
      STAFF: '/cashier',
    }
    const portal = portalMap[user.role]
    if (portal) router.replace(portal)
  }, [hydrated, isAuthenticated, user, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to BHX</h1>
        <p className="text-lg text-gray-600">Redirecting...</p>
      </div>
    </div>
  )

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-4">Về chúng tôi</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Giới thiệu</a></li>
                <li><a href="#" className="hover:text-white">Liên hệ</a></li>
                <li><a href="#" className="hover:text-white">Tuyển dụng</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Chính sách</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Chính sách đổi trả</a></li>
                <li><a href="#" className="hover:text-white">Chính sách bảo mật</a></li>
                <li><a href="#" className="hover:text-white">Điều khoản sử dụng</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Câu hỏi thường gặp</a></li>
                <li><a href="#" className="hover:text-white">Hướng dẫn mua hàng</a></li>
                <li><a href="#" className="hover:text-white">Tra cứu đơn hàng</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Liên hệ</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Hotline: 1900-9999</li>
                <li>Email: support@bachhoa.vn</li>
                <li>Giờ làm việc: 7:00 - 21:00</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 Bách Hóa Xanh. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
