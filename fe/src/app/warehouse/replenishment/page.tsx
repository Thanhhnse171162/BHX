'use client'

import { RefreshCw } from 'lucide-react'

export default function ReplenishmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bổ sung hàng</h1>
        <p className="text-gray-600 mt-1">Quản lý bổ sung tồn kho và đặt hàng lại</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <RefreshCw className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sắp ra mắt</h3>
        <p className="text-gray-600">Tính năng này đang được phát triển</p>
      </div>
    </div>
  )
}
