'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  ShoppingBag,
  Search,
  Monitor,
  ReceiptText,
  Info,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'

interface InvoiceListItem {
  id: string
  invoiceNumber: string
  customerName: string
  itemCount: number
  time: string
  status: string
}

const PAGE_SIZE = 5

const statusConfig: Record<string, { dot: string; badge: string }> = {
  'Thành công': { dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700' },
  'Đã hủy':     { dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700' },
  'Đã trả':     { dot: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700' },
  'Đang xử lý': { dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700' },
}

export default function CashierDashboard() {
  const router = useRouter()
  const { token, user } = useAuthStore()
  const [txSearch, setTxSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Real data states
  const [invoiceCount, setInvoiceCount] = useState(0)
  const [productCount, setProductCount] = useState(0)
  const [revenue, setRevenue] = useState(0)
  const [loadingStats, setLoadingStats] = useState(true)
  
  // Invoice list states
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)

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
        const storeId = user?.workplaceType === 'STORE' ? user?.workplaceId : user?.storeId
        const query = storeId ? `?storeId=${encodeURIComponent(String(storeId))}` : ''

        // Call API endpoints for real data
        const [invoiceRes, productRes, revenueRes] = await Promise.allSettled([
          fetch(`/api/cashier/invoices/today/count${query}`, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
          fetch(`/api/cashier/products/today/count${query}`, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
          fetch(`/api/cashier/revenue/today${query}`, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
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
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [token, user?.storeId, user?.workplaceId, user?.workplaceType])

  // Fetch today's invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoadingInvoices(true)
        const storeId = user?.workplaceType === 'STORE' ? user?.workplaceId : user?.storeId
        const query = storeId ? `?storeId=${encodeURIComponent(String(storeId))}` : ''
        
        const res = await fetch(`/api/cashier/invoices/list${query}`, {
          headers: {
            accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: 'no-store',
        })

        if (res.ok) {
          const data = await res.json()
          setInvoices(data.invoices || [])
        } else {
          setInvoices([])
        }
      } catch (error) {
        console.error('Failed to fetch invoices:', error)
        setInvoices([])
      } finally {
        setLoadingInvoices(false)
      }
    }

    fetchInvoices()
  }, [token, user?.storeId, user?.workplaceId, user?.workplaceType])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan hôm nay</h1>
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

          {/* Doanh thu*/}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-6 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Doanh thu</p>
              <p className="text-3xl font-bold text-gray-900 leading-tight">
                {loadingStats ? (
                  <span className="text-lg text-gray-400">—</span>
                ) : (
                  <span>{new Intl.NumberFormat('vi-VN').format(revenue)} <span className="text-lg font-semibold">đ</span></span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Lower section: transactions + quick actions — balanced 3:2 split, equal height */}
        <div className="grid grid-cols-[3fr_2fr] gap-6 items-start">
          {/* Recent Transactions */}
          {(() => {
            const filtered = invoices.filter(
              (tx) =>
                tx.invoiceNumber.toLowerCase().includes(txSearch.toLowerCase()) ||
                tx.customerName.toLowerCase().includes(txSearch.toLowerCase())
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
                      <th className="text-center px-4 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingInvoices ? (
                      <tr>
                        <td colSpan={4} className="text-center py-10">
                          <div className="flex items-center justify-center gap-2 text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Đang tải dữ liệu...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paged.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-base text-gray-400">{invoices.length === 0 ? 'Chưa có giao dịch hôm nay' : 'Không tìm thấy giao dịch phù hợp'}</td>
                      </tr>
                    ) : paged.map((tx, idx) => {
                      const cfg = statusConfig[tx.status] ?? { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-700' }
                      return (
                        <tr key={tx.id} className={`hover:bg-gray-50 transition-colors ${idx < paged.length - 1 ? 'border-b border-gray-200' : ''}`}>
                          <td className="px-4 py-3.5 border-r border-gray-200 text-center">
                            <span className="text-base font-semibold text-green-600">{tx.invoiceNumber}</span>
                          </td>
                          <td className="px-4 py-3.5 border-r border-gray-200 text-center">
                            <span className="text-base text-gray-700">{tx.time}</span>
                          </td>
                          <td className="px-4 py-3.5 border-r border-gray-200 text-center">
                            <span className="text-base text-gray-800 font-medium">{tx.customerName}</span>
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
