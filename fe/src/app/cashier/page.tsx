'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  ShoppingBag,
  Bell,
  Settings,
  Search,
  Monitor,
  ReceiptText,
  Info,
  TrendingUp,
} from 'lucide-react'

// Mock data for demonstration — TODO: Replace with real API
const allTransactions = [
  { id: 'HD-2938', time: '10:45', customer: 'Trần Minh Tuấn',       itemCount: 5,  status: 'Thành công' },
  { id: 'HD-2937', time: '10:32', customer: 'Nguyễn Thị Ngọc Anh',  itemCount: 12, status: 'Thành công' },
  { id: 'HD-2936', time: '10:15', customer: 'Lê Hoàng Phúc',        itemCount: 2,  status: 'Thành công' },
  { id: 'HD-2935', time: '09:58', customer: 'Phạm Gia Huy',         itemCount: 8,  status: 'Thành công' },
  { id: 'HD-2934', time: '09:40', customer: 'Đặng Thảo My',         itemCount: 1,  status: 'Thành công' },
  { id: 'HD-2933', time: '09:22', customer: 'Võ Quang Huy',         itemCount: 6,  status: 'Thành công' },
  { id: 'HD-2932', time: '09:10', customer: 'Bùi Thanh Tâm',        itemCount: 3,  status: 'Thành công' },
  { id: 'HD-2931', time: '08:55', customer: 'Hồ Minh Khôi',         itemCount: 4,  status: 'Thành công' },
  { id: 'HD-2930', time: '08:40', customer: 'Lý Thị Thu Hương',     itemCount: 1,  status: 'Thành công' },
  { id: 'HD-2929', time: '08:25', customer: 'Vũ Đức Anh',           itemCount: 7,  status: 'Thành công' },
  { id: 'HD-2928', time: '08:10', customer: 'Trịnh Minh Châu',      itemCount: 2,  status: 'Đã hủy'     },
  { id: 'HD-2927', time: '07:55', customer: 'Đinh Thị Lan Anh',     itemCount: 5,  status: 'Thành công' },
  { id: 'HD-2926', time: '07:40', customer: 'Phan Văn Đức',         itemCount: 4,  status: 'Thành công' },
  { id: 'HD-2925', time: '07:25', customer: 'Mai Thị Hồng Nhung',   itemCount: 1,  status: 'Đã trả'     },
  { id: 'HD-2924', time: '07:10', customer: 'Cao Xuân Trường',      itemCount: 8,  status: 'Thành công' },
  { id: 'HD-2923', time: '06:55', customer: 'Lâm Thị Bảo Châu',    itemCount: 3,  status: 'Thành công' },
  { id: 'HD-2922', time: '06:40', customer: 'Đỗ Quốc Bảo',         itemCount: 2,  status: 'Thành công' },
  { id: 'HD-2921', time: '06:25', customer: 'Hà Thị Thu Thảo',     itemCount: 6,  status: 'Đã hủy'     },
  { id: 'HD-2920', time: '06:10', customer: 'Trần Thùy Dương',      itemCount: 4,  status: 'Thành công' },
  { id: 'HD-2919', time: '05:55', customer: 'Phạm Trí Tính',        itemCount: 9,  status: 'Thành công' },
  { id: 'HD-2918', time: '05:40', customer: 'Hồ Ngọc Thanh',        itemCount: 2,  status: 'Thành công' },
  { id: 'HD-2917', time: '05:25', customer: 'Nguyễn Hữu Nghĩa',    itemCount: 5,  status: 'Đã trả'     },
  { id: 'HD-2916', time: '05:10', customer: 'Lê Thị Mỹ Linh',      itemCount: 3,  status: 'Thành công' },
  { id: 'HD-2915', time: '04:55', customer: 'Vũ Thị Phương Linh',   itemCount: 7,  status: 'Thành công' },
  { id: 'HD-2914', time: '04:40', customer: 'Bùi Công Minh',        itemCount: 1,  status: 'Thành công' },
  { id: 'HD-2913', time: '04:25', customer: 'Đoàn Thị Ánh Tuyết',  itemCount: 4,  status: 'Đã hủy'     },
  { id: 'HD-2912', time: '04:10', customer: 'Hoàng Trọng Nghĩa',   itemCount: 6,  status: 'Thành công' },
  { id: 'HD-2911', time: '03:55', customer: 'Tô Thị Ngân Hà',      itemCount: 2,  status: 'Thành công' },
  { id: 'HD-2910', time: '03:40', customer: 'Dương Văn Khánh',      itemCount: 8,  status: 'Thành công' },
  { id: 'HD-2909', time: '03:25', customer: 'Châu Ngọc Bích',       itemCount: 3,  status: 'Thành công' },
  { id: 'HD-2908', time: '03:10', customer: 'Lưu Thị Diễm My',     itemCount: 5,  status: 'Đã trả'     },
  { id: 'HD-2907', time: '02:55', customer: 'Tạ Quang Vinh',        itemCount: 2,  status: 'Thành công' },
  { id: 'HD-2906', time: '02:40', customer: 'Ngô Thị Thanh Vân',   itemCount: 4,  status: 'Thành công' },
  { id: 'HD-2905', time: '02:25', customer: 'Kiều Minh Đức',        itemCount: 1,  status: 'Thành công' },
  { id: 'HD-2904', time: '02:10', customer: 'Trương Thị Cẩm Nhung', itemCount: 7,  status: 'Đã hủy'     },
  { id: 'HD-2903', time: '01:55', customer: 'Phùng Xuân Hải',       itemCount: 3,  status: 'Thành công' },
]

const PAGE_SIZE = 9

const statusConfig: Record<string, { dot: string; badge: string }> = {
  'Thành công': { dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700' },
  'Đã hủy':     { dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700' },
  'Đã trả':     { dot: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700' },
}

export default function CashierDashboard() {
  const router = useRouter()
  const [txSearch, setTxSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Real data states
  const [invoiceCount, setInvoiceCount] = useState(0)
  const [productCount, setProductCount] = useState(0)
  const [revenue, setRevenue] = useState(0)
  const [revenuePercent, setRevenuePercent] = useState(0)
  const [loadingStats, setLoadingStats] = useState(true)

  // F1 shortcut to open POS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault()
        router.push('/cashier/pos')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  // Fetch daily statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true)
        // Call API endpoints for real data
        // These endpoints should be created in the backend
        const [invoiceRes, productRes, revenueRes] = await Promise.allSettled([
          fetch('/api/cashier/invoices/today/count'),
          fetch('/api/cashier/products/today/count'),
          fetch('/api/cashier/revenue/today'),
        ])

        if (invoiceRes.status === 'fulfilled' && invoiceRes.value.ok) {
          const data = await invoiceRes.value.json()
          setInvoiceCount(data.count || 0)
        }

        if (productRes.status === 'fulfilled' && productRes.value.ok) {
          const data = await productRes.value.json()
          setProductCount(data.count || 0)
        }

        if (revenueRes.status === 'fulfilled' && revenueRes.value.ok) {
          const data = await revenueRes.value.json()
          setRevenue(data.total || 0)
          setRevenuePercent(data.percentChange || 0)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan hôm nay</h1>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-8">
        {/* Stats row — 3 equal cards */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {/* Số hóa đơn hôm nay */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-6 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Số hóa đơn hôm nay</p>
              <p className="text-3xl font-bold text-gray-900 leading-tight">
                {loadingStats ? (
                  <span className="text-lg text-gray-400">—</span>
                ) : (
                  invoiceCount
                )}
              </p>
            </div>
          </div>

          {/* Số sản phẩm đã bán */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-6 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Số sản phẩm đã bán</p>
              <p className="text-3xl font-bold text-gray-900 leading-tight">
                {loadingStats ? (
                  <span className="text-lg text-gray-400">—</span>
                ) : (
                  productCount
                )}
              </p>
            </div>
          </div>

          {/* Doanh thu ca */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-6 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Doanh thu ca</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-gray-900 leading-tight">
                  {loadingStats ? (
                    <span className="text-lg text-gray-400">—</span>
                  ) : (
                    `${(revenue / 1000000).toFixed(1)}M`
                  )}
                </p>
                {!loadingStats && (
                  <span className={`text-sm font-semibold flex items-center gap-0.5 pb-1 ${revenuePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className="w-3.5 h-3.5" />
                    {revenuePercent >= 0 ? '+' : ''}{revenuePercent}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lower section: transactions + quick actions — balanced 3:2 split, equal height */}
        <div className="grid grid-cols-[3fr_2fr] gap-6 items-start">
          {/* Recent Transactions */}
          {(() => {
            const filtered = allTransactions.filter(
              (tx) =>
                tx.id.toLowerCase().includes(txSearch.toLowerCase()) ||
                tx.customer.toLowerCase().includes(txSearch.toLowerCase())
            )
            const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
            const safePage = Math.min(currentPage, Math.max(1, totalPages))
            const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
            const start = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
            const end = Math.min(safePage * PAGE_SIZE, filtered.length)

            const getPageNums = () => {
              const pages: (number | '...')[] = []
              if (totalPages <= 5) {
                for (let i = 1; i <= totalPages; i++) pages.push(i)
              } else {
                pages.push(1)
                if (safePage > 3) pages.push('...')
                for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i)
                if (safePage < totalPages - 2) pages.push('...')
                pages.push(totalPages)
              }
              return pages
            }

            return (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="px-5 pt-4 pb-3 border-b border-gray-200">
                  <h2 className="text-base font-semibold text-gray-900">Lịch sử đơn hàng gần đây</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Xem thông tin chi tiết các giao dịch bán lẻ mới nhất tại cửa hàng.</p>
                  {/* Search */}
                  <div className="relative mt-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo mã đơn hàng hoặc tên khách hàng..."
                      value={txSearch}
                      onChange={(e) => { setTxSearch(e.target.value); setCurrentPage(1) }}
                      className="w-full pl-9 pr-4 py-2 text-base bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Table */}
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-center px-4 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide border-b border-r border-gray-200">Mã HD</th>
                      <th className="text-center px-4 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide border-b border-r border-gray-200">Thời gian</th>
                      <th className="text-center px-4 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide border-b border-r border-gray-200">Khách hàng</th>
                      <th className="text-center px-4 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide border-b border-r border-gray-200">Số SP</th>
                      <th className="text-center px-4 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-base text-gray-400">Không tìm thấy giao dịch phù hợp</td>
                      </tr>
                    ) : paged.map((tx, idx) => {
                      const cfg = statusConfig[tx.status] ?? { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-700' }
                      return (
                        <tr key={tx.id} className={`hover:bg-gray-50 transition-colors ${idx < paged.length - 1 ? 'border-b border-gray-200' : ''}`}>
                          <td className="px-4 py-3.5 border-r border-gray-200 text-center">
                            <span className="text-base font-semibold text-green-600">{tx.id}</span>
                          </td>
                          <td className="px-4 py-3.5 border-r border-gray-200 text-center">
                            <span className="text-base text-gray-700">{tx.time}</span>
                          </td>
                          <td className="px-4 py-3.5 border-r border-gray-200 text-center">
                            <span className="text-base text-gray-800 font-medium">{tx.customer}</span>
                          </td>
                          <td className="px-4 py-3.5 border-r border-gray-200 text-center">
                            <span className="text-base text-gray-700">{tx.itemCount}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${cfg.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Hiển thị <span className="font-medium text-gray-700">{start} - {end}</span> trên tổng số <span className="font-medium text-gray-700">{filtered.length}</span> hóa đơn
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="px-3.5 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >Trước</button>
                    {getPageNums().map((p, i) =>
                      p === '...' ? (
                        <span key={`dots-${i}`} className="px-2 text-sm text-gray-400">...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p as number)}
                          className={`w-9 h-9 text-sm rounded-lg border transition-colors ${
                            safePage === p
                              ? 'bg-green-600 border-green-600 text-white font-semibold'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >{p}</button>
                      )
                    )}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages || totalPages === 0}
                      className="px-3.5 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >Sau</button>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Quick Actions */}
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-gray-900">Thao tác nhanh</h2>

            <div className="bg-white rounded-xl border border-gray-200 flex flex-col gap-3 p-4">
              {/* Mở POS bán hàng - main CTA */}
              <Link
                href="/cashier/pos"
                className="bg-green-700 hover:bg-green-800 active:bg-green-900 text-white rounded-xl py-5 px-6 flex items-center gap-4 transition-colors shadow-sm"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Monitor className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold tracking-wide">MỞ POS BÁN HÀNG</p>
                  <p className="text-green-200 text-sm mt-0.5">Bắt đầu giao dịch mới ngay bây giờ</p>
                </div>
              </Link>

              {/* Secondary actions row */}
              <div className="flex flex-col gap-3">
                <Link
                  href="/cashier/invoices"
                  className="bg-gray-50 border border-gray-200 rounded-xl py-4 flex flex-col items-center gap-2 hover:bg-gray-100 hover:border-gray-300 transition-all"
                >
                  <ReceiptText className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Tra cứu HD</span>
                </Link>
              </div>

              {/* Tip */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700 leading-relaxed">
                  <em>Mẹo: Nhấn phím tắt <kbd className="font-semibold not-italic bg-blue-100 px-1 py-0.5 rounded text-blue-800 text-[10px]">F1</kbd> từ bất cứ đâu để mở màn hình bán hàng nhanh.</em>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
