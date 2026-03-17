'use client'

import { useState } from 'react'
import { BarChart3, Download, Filter } from 'lucide-react'

interface DispatchReport {
  date: string
  totalDispatches: number
  totalQuantity: number
  totalSku: number
  successRate: number
  avgDeliveryTime: string
}

const DISPATCH_REPORTS: DispatchReport[] = [
  {
    date: '01/08/2024',
    totalDispatches: 5,
    totalQuantity: 1250,
    totalSku: 12,
    successRate: 100,
    avgDeliveryTime: '2.5 ngày'
  },
  {
    date: '02/08/2024',
    totalDispatches: 3,
    totalQuantity: 450,
    totalSku: 8,
    successRate: 100,
    avgDeliveryTime: '2 ngày'
  },
  {
    date: '03/08/2024',
    totalDispatches: 4,
    totalQuantity: 800,
    totalSku: 10,
    successRate: 95,
    avgDeliveryTime: '3 ngày'
  },
  {
    date: '04/08/2024',
    totalDispatches: 6,
    totalQuantity: 1500,
    totalSku: 15,
    successRate: 100,
    avgDeliveryTime: '2.8 ngày'
  },
  {
    date: '05/08/2024',
    totalDispatches: 4,
    totalQuantity: 900,
    totalSku: 11,
    successRate: 98,
    avgDeliveryTime: '2.3 ngày'
  }
]

export default function DispatchReportsPage() {
  const [dateRange, setDateRange] = useState({
    from: '2024-08-01',
    to: '2024-08-05'
  })

  const totalDispatches = DISPATCH_REPORTS.reduce((sum, r) => sum + r.totalDispatches, 0)
  const totalQuantity = DISPATCH_REPORTS.reduce((sum, r) => sum + r.totalQuantity, 0)
  const avgSuccessRate = (DISPATCH_REPORTS.reduce((sum, r) => sum + r.successRate, 0) / DISPATCH_REPORTS.length).toFixed(1)

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Báo cáo xuất hàng
          </h1>
          <p className="text-sm text-slate-500">
            Thống kê chi tiết về các phiếu xuất hàng
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Download size={18} />
          Xuất báo cáo
        </button>
      </div>

      {/* FILTER */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-600">Lọc theo ngày:</span>
          </div>
          <input
            type="date"
            className="px-3 py-2 border rounded-lg text-sm"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
          />
          <span className="text-slate-400">-</span>
          <input
            type="date"
            className="px-3 py-2 border rounded-lg text-sm"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
          />
          <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg">
            Áp dụng
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Tổng phiếu xuất</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{totalDispatches}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <BarChart3 size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Tổng số lượng</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{totalQuantity.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-emerald-600">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Tỷ lệ thành công</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{avgSuccessRate}%</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-emerald-600">✓</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Trung bình SKU/phiếu</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {(DISPATCH_REPORTS.reduce((sum, r) => sum + r.totalSku, 0) / DISPATCH_REPORTS.length).toFixed(1)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-amber-600">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED TABLE */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Chi tiết theo ngày</h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr className="text-left">
              <th className="p-4 font-medium">Ngày</th>
              <th className="p-4 font-medium">Tổng phiếu</th>
              <th className="p-4 font-medium">T���ng số lượng</th>
              <th className="p-4 font-medium">Tổng SKU</th>
              <th className="p-4 font-medium">Tỷ lệ thành công</th>
              <th className="p-4 font-medium">Thời gian giao hàng TB</th>
            </tr>
          </thead>
          <tbody>
            {DISPATCH_REPORTS.map((report) => (
              <tr key={report.date} className="border-t hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-800">{report.date}</td>
                <td className="p-4 text-slate-600">{report.totalDispatches}</td>
                <td className="p-4 text-slate-600">{report.totalQuantity.toLocaleString()}</td>
                <td className="p-4 text-slate-600">{report.totalSku}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    report.successRate === 100 ? 'bg-emerald-100 text-emerald-700' :
                    report.successRate >= 95 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {report.successRate}%
                  </span>
                </td>
                <td className="p-4 text-slate-600">{report.avgDeliveryTime}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-600">Tổng cộng phiếu</p>
              <p className="font-bold text-slate-800">{totalDispatches}</p>
            </div>
            <div>
              <p className="text-slate-600">Tổng cộng số lượng</p>
              <p className="font-bold text-slate-800">{totalQuantity.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-600">Tỷ lệ thành công TB</p>
              <p className="font-bold text-slate-800">{avgSuccessRate}%</p>
            </div>
            <div>
              <p className="text-slate-600">Số ngày báo cáo</p>
              <p className="font-bold text-slate-800">{DISPATCH_REPORTS.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
