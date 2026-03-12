'use client'

import { BarChart3 } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo</h1>
        <p className="text-gray-600 mt-1">Xem phân tích và tạo báo cáo</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sắp ra mắt</h3>
        <p className="text-gray-600">Tính năng này đang được phát triển</p>
      </div>
    </div>
  )
}
