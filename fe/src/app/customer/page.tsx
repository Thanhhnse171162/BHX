import Link from 'next/link'
import { Header } from '@/shared/ui/Header'
import { HeroBanner } from '@/features/promotions/components/HeroBanner'
import { CategoryGrid } from '@/features/catalog/components/CategoryGrid'
import { PromoBlocks } from '@/features/catalog/components/PromoBlocks'
import { ProductBlock } from '@/features/catalog/components/ProductBlock'

export default function CustomerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header hideDeliveryAndCart />

      <main className="container mx-auto px-4 py-6 space-y-8">
        <HeroBanner />
        <CategoryGrid />
        <PromoBlocks />
        <ProductBlock title="Rau củ tươi mỗi ngày" />
      </main>

      <footer className="bg-gray-900 text-white mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-white mb-4">Về chúng tôi</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-sm text-gray-300 hover:text-green-400">Giới thiệu</Link></li>
                <li><Link href="/stores" className="text-sm text-gray-300 hover:text-green-400">Hệ thống cửa hàng</Link></li>
                <li><Link href="/careers" className="text-sm text-gray-300 hover:text-green-400">Tuyển dụng</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Hỗ trợ khách hàng</h4>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-sm text-gray-300 hover:text-green-400">Trung tâm trợ giúp</Link></li>
                <li><Link href="/shipping" className="text-sm text-gray-300 hover:text-green-400">Chính sách giao hàng</Link></li>
                <li><Link href="/returns" className="text-sm text-gray-300 hover:text-green-400">Đổi trả hàng</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Chính sách</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-sm text-gray-300 hover:text-green-400">Bảo mật thông tin</Link></li>
                <li><Link href="/terms" className="text-sm text-gray-300 hover:text-green-400">Điều khoản sử dụng</Link></li>
                <li><Link href="/payment" className="text-sm text-gray-300 hover:text-green-400">Thanh toán</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Liên hệ</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>📞 Hotline: 1900 xxxx</li>
                <li>📧 Email: support@bhx.vn</li>
                <li>⏰ 8:00 - 21:00 hàng ngày</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
            <p>© 2024 GR-SCMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
