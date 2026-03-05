'use client'

import { FileText } from 'lucide-react'

export default function InvoicesPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <h1 className="text-xl font-bold text-gray-900">Lịch sử hóa đơn</h1>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-blue-600" />
          </div>
          <p className="text-gray-500 text-lg font-medium">Lịch sử hóa đơn</p>
          <p className="text-gray-400 text-sm mt-1">Tính năng đang được phát triển</p>
        </div>
      </div>
    </div>
  )
}
