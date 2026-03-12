'use client'

import { BoxIcon } from 'lucide-react'

export default function ProductManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
        <p className="text-gray-600 mt-1">Quản lý danh mục và thông tin sản phẩm</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <BoxIcon className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sắp ra mắt</h3>
        <p className="text-gray-600">Tính năng này đang được phát triển</p>
      </div>
    </div>
  )
}
