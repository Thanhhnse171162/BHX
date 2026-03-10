'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ShoppingBag,
  Calendar,
  Download,
  X,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type OrderStatus = 'Thành công' | 'Đang xử lý' | 'Đã hủy' | 'Đã trả hàng'

interface Order {
  id: string
  customer: string
  phone: string
  date: string
  time: string
  items: number
  total: number
  status: OrderStatus
  paymentMethod: string
  cashier: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const ALL_ORDERS: Order[] = [
  { id: 'DH-5821', customer: 'Nguyễn Thị Lan Anh',   phone: '0912 345 678', date: '10/03/2026', time: '10:52', items: 6,  total: 385000,  status: 'Thành công',   paymentMethod: 'Thẻ',       cashier: 'Minh Tuấn' },
  { id: 'DH-5820', customer: 'Trần Văn Hùng',         phone: '0987 654 321', date: '10/03/2026', time: '10:41', items: 2,  total: 122000,  status: 'Đang xử lý',  paymentMethod: 'Tiền mặt',  cashier: 'Thu Hà' },
  { id: 'DH-5819', customer: 'Lê Thị Hoa',            phone: '0909 111 222', date: '10/03/2026', time: '10:28', items: 9,  total: 540000,  status: 'Thành công',   paymentMethod: 'Ví điện tử', cashier: 'Minh Tuấn' },
  { id: 'DH-5818', customer: 'Phạm Quốc Tuấn',        phone: '0933 456 789', date: '10/03/2026', time: '10:15', items: 1,  total: 89000,   status: 'Đã hủy',       paymentMethod: 'Tiền mặt',  cashier: 'Thu Hà' },
  { id: 'DH-5817', customer: 'Hoàng Minh Đức',        phone: '0976 234 567', date: '10/03/2026', time: '09:58', items: 4,  total: 278000,  status: 'Thành công',   paymentMethod: 'Thẻ',       cashier: 'Quang Huy' },
  { id: 'DH-5816', customer: 'Võ Thị Thu Thảo',       phone: '0901 987 654', date: '10/03/2026', time: '09:40', items: 11, total: 630000,  status: 'Thành công',   paymentMethod: 'Ví điện tử', cashier: 'Minh Tuấn' },
  { id: 'DH-5815', customer: 'Bùi Thanh Nam',         phone: '0944 321 098', date: '10/03/2026', time: '09:22', items: 3,  total: 195000,  status: 'Đã trả hàng', paymentMethod: 'Thẻ',       cashier: 'Thu Hà' },
  { id: 'DH-5814', customer: 'Đinh Thị Kiều My',      phone: '0918 765 432', date: '10/03/2026', time: '09:10', items: 7,  total: 421000,  status: 'Thành công',   paymentMethod: 'Tiền mặt',  cashier: 'Quang Huy' },
  { id: 'DH-5813', customer: 'Lý Văn Phát',           phone: '0962 543 210', date: '10/03/2026', time: '08:55', items: 2,  total: 67000,   status: 'Thành công',   paymentMethod: 'Tiền mặt',  cashier: 'Minh Tuấn' },
  { id: 'DH-5812', customer: 'Hồ Thị Ngọc Bích',     phone: '0905 876 543', date: '10/03/2026', time: '08:40', items: 5,  total: 314000,  status: 'Đã hủy',       paymentMethod: 'Thẻ',       cashier: 'Thu Hà' },
  { id: 'DH-5811', customer: 'Trương Minh Khải',      phone: '0981 234 567', date: '09/03/2026', time: '17:30', items: 8,  total: 502000,  status: 'Thành công',   paymentMethod: 'Ví điện tử', cashier: 'Quang Huy' },
  { id: 'DH-5810', customer: 'Phan Thị Mai Liên',     phone: '0928 765 432', date: '09/03/2026', time: '17:15', items: 4,  total: 248000,  status: 'Thành công',   paymentMethod: 'Tiền mặt',  cashier: 'Minh Tuấn' },
  { id: 'DH-5809', customer: 'Đỗ Quang Vinh',         phone: '0953 987 654', date: '09/03/2026', time: '17:00', items: 1,  total: 45000,   status: 'Thành công',   paymentMethod: 'Tiền mặt',  cashier: 'Thu Hà' },
  { id: 'DH-5808', customer: 'Ngô Thị Thanh Vân',     phone: '0934 123 456', date: '09/03/2026', time: '16:45', items: 6,  total: 389000,  status: 'Đã trả hàng', paymentMethod: 'Thẻ',       cashier: 'Quang Huy' },
  { id: 'DH-5807', customer: 'Vũ Đăng Khoa',          phone: '0916 456 789', date: '09/03/2026', time: '16:30', items: 3,  total: 163000,  status: 'Thành công',   paymentMethod: 'Ví điện tử', cashier: 'Thu Hà' },
  { id: 'DH-5806', customer: 'Châu Thị Bảo Ngọc',    phone: '0906 789 012', date: '09/03/2026', time: '16:15', items: 10, total: 715000,  status: 'Thành công',   paymentMethod: 'Thẻ',       cashier: 'Minh Tuấn' },
]

const STATUS_OPTIONS: OrderStatus[] = ['Thành công', 'Đang xử lý', 'Đã hủy', 'Đã trả hàng']

const statusConfig: Record<OrderStatus, { icon: React.ReactNode; cls: string }> = {
  'Thành công':   { icon: <CheckCircle size={12} />, cls: 'bg-green-50 text-green-700' },
  'Đang xử lý':  { icon: <Clock size={12} />,        cls: 'bg-blue-50 text-blue-700' },
  'Đã hủy':      { icon: <XCircle size={12} />,      cls: 'bg-red-50 text-red-600' },
  'Đã trả hàng': { icon: <RefreshCw size={12} />,    cls: 'bg-yellow-50 text-yellow-700' },
}

const PAGE_SIZE = 10

// ─── Detail modal ─────────────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const sc = statusConfig[order.status]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-[15px] font-bold text-gray-900">Chi tiết đơn hàng</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3 text-[13px]">
          <Row label="Mã đơn" value={<span className="font-mono font-semibold text-gray-800">{order.id}</span>} />
          <Row label="Khách hàng" value={order.customer} />
          <Row label="Số điện thoại" value={order.phone} />
          <Row label="Ngày / Giờ" value={`${order.date} lúc ${order.time}`} />
          <Row label="Số sản phẩm" value={`${order.items} sản phẩm`} />
          <Row label="Thanh toán" value={order.paymentMethod} />
          <Row label="Thu ngân" value={order.cashier} />
          <Row
            label="Trạng thái"
            value={
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.cls}`}>
                {sc.icon} {order.status}
              </span>
            }
          />
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="font-semibold text-gray-600">Tổng tiền</span>
            <span className="text-lg font-bold text-green-700">{order.total.toLocaleString('vi-VN')} ₫</span>
          </div>
        </div>
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[13px] transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const filtered = useMemo(() => {
    let list = ALL_ORDERS
    if (statusFilter !== 'Tất cả') list = list.filter((o) => o.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          o.phone.includes(q),
      )
    }
    return list
  }, [search, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // stats
  const stats = useMemo(() => ({
    total: ALL_ORDERS.length,
    success: ALL_ORDERS.filter((o) => o.status === 'Thành công').length,
    pending: ALL_ORDERS.filter((o) => o.status === 'Đang xử lý').length,
    cancelled: ALL_ORDERS.filter((o) => o.status === 'Đã hủy').length,
    revenue: ALL_ORDERS.filter((o) => o.status === 'Thành công').reduce((s, o) => s + o.total, 0),
  }), [])

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag size={20} className="text-green-600" />
            Quản lý đơn hàng
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Theo dõi và xử lý tất cả đơn hàng trong ngày</p>
        </div>
        <button className="flex items-center gap-2 text-[13px] font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
          <Download size={15} />
          Xuất Excel
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Tổng đơn', value: stats.total, cls: 'text-gray-800' },
          { label: 'Thành công', value: stats.success, cls: 'text-green-700' },
          { label: 'Đang xử lý', value: stats.pending, cls: 'text-blue-600' },
          { label: 'Đã hủy', value: stats.cancelled, cls: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm mã đơn, khách hàng, SĐT..."
            className="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-400 focus:bg-white transition-all"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['Tất cả', ...STATUS_OPTIONS].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto text-[12px] text-gray-500">
          <Calendar size={13} />
          <span>Hôm nay: 10/03/2026</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Mã đơn', 'Khách hàng', 'Ngày / Giờ', 'SL', 'Tổng tiền', 'Thanh toán', 'Thu ngân', 'Trạng thái', ''].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 text-[13px]">
                    Không tìm thấy đơn hàng nào
                  </td>
                </tr>
              ) : (
                paged.map((order, idx) => {
                  const sc = statusConfig[order.status]
                  return (
                    <tr
                      key={order.id}
                      className={`border-t border-gray-50 hover:bg-green-50/30 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/20' : ''}`}
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-gray-700">{order.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800">{order.customer}</div>
                        <div className="text-[11px] text-gray-400">{order.phone}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{order.date} {order.time}</td>
                      <td className="py-3 px-4 text-gray-600">{order.items}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800 whitespace-nowrap">{order.total.toLocaleString('vi-VN')} ₫</td>
                      <td className="py-3 px-4 text-gray-500">{order.paymentMethod}</td>
                      <td className="py-3 px-4 text-gray-500">{order.cashier}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.cls}`}>
                          {sc.icon} {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-[12px] text-gray-500">
            Hiển thị {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} đơn
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-colors ${
                  p === page ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  )
}
