import { PageHeader } from '@/shared/ui/PageHeader'
import Link from 'next/link'

export default function AdminCatalogPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Danh mục"
        subtitle="Quản lý danh mục sản phẩm và các gói liên quan"
        breadcrumbs={[
          { label: 'Quản trị', href: '/admin' },
          { label: 'Danh mục', href: '/admin/catalog' },
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Package Catalog */}
        <div className="card space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Danh mục sản phẩm</h2>
          <p className="text-sm text-gray-600">
            Quản lý danh mục sản phẩm, cấu hình sản phẩm và phân loại để hiển thị cho khách hàng.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link
              href="/admin/catalog/products"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Quản lý sản phẩm
            </Link>
            <Link
              href="/admin/catalog/categories"
              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-800 hover:bg-gray-50 transition-colors"
            >
              Quản lý danh mục
            </Link>
          </div>
        </div>

        {/* Package Inventory */}
        <div className="card space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Tồn kho sản phẩm</h2>
          <p className="text-sm text-gray-600">
            Kết nối tồn kho với sản phẩm trong catalog, theo dõi số lượng và điều chỉnh stock.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link
              href="/admin/inventory"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Xem tồn kho
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


