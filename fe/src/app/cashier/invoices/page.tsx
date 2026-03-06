'use client'

import { useState, useMemo } from 'react'
import {
  Search, X, Printer, RotateCcw, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, ShoppingCart, DollarSign, AlertCircle,
  CheckCircle2, XCircle, RefreshCw, Info, ChevronDown, Filter,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type PaymentMethod = 'Momo' | 'Tiền mặt' | 'Visa' | 'VNPay' | 'ZaloPay'
type OrderStatus = 'Thành công' | 'Đã trả hàng' | 'Đã hủy' | 'Đang xử lý'
type DateFilter = 'all' | 'today' | 'week'

interface OrderProduct {
  name: string
  sku: string
  qty: number
  unitPrice: number
  total: number
}

interface Order {
  id: string
  time: string
  date: string
  customer: string
  phone: string
  memberTier: string
  products: OrderProduct[]
  payment: PaymentMethod
  status: OrderStatus
  subtotal: number
  vat: number
  discount: number
  total: number
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ORDERS: Order[] = [
  {
    id: 'GM-99234', time: '14:20', date: '20/10/2025',
    customer: 'Lê Minh Tuấn', phone: '090xxxx123', memberTier: 'Gold Member',
    products: [
      { name: 'Sữa tươi TH True Milk 1L', sku: '892234578', qty: 2, unitPrice: 35000, total: 70000 },
      { name: 'Táo MwEnvy Size L', sku: '938651234', qty: 1.5, unitPrice: 180000, total: 270000 },
      { name: 'Nước suối Aquafina 500ml', sku: '763451290', qty: 4, unitPrice: 10000, total: 40000 },
    ],
    payment: 'Momo', status: 'Thành công',
    subtotal: 380000, vat: 30400, discount: 3800, total: 406600,
  },
  {
    id: 'GM-99230', time: '13:55', date: '20/10/2025',
    customer: 'Trần Thị B', phone: '091xxxx456', memberTier: 'Silver Member',
    products: [
      { name: 'Dầu ăn Neptune 1L', sku: '556782341', qty: 1, unitPrice: 65000, total: 65000 },
      { name: 'Mì tôm Hảo Hảo (thùng)', sku: '223459871', qty: 1, unitPrice: 85000, total: 85000 },
    ],
    payment: 'Tiền mặt', status: 'Đã trả hàng',
    subtotal: 150000, vat: 12000, discount: 0, total: 162000,
  },
  {
    id: 'GM-99228', time: '12:30', date: '20/10/2025',
    customer: 'Khách vãng lai', phone: '—', memberTier: '—',
    products: [
      { name: 'Bánh mì sandwich', sku: '112233445', qty: 2, unitPrice: 15000, total: 30000 },
      { name: 'Bơ Pháp Elle & Vire 200g', sku: '556677889', qty: 1, unitPrice: 58000, total: 58000 },
    ],
    payment: 'Visa', status: 'Thành công',
    subtotal: 88000, vat: 7040, discount: 0, total: 95040,
  },
  {
    id: 'GM-99225', time: '11:10', date: '20/10/2025',
    customer: 'Phạm Hữu Nghĩa', phone: '093xxxx789', memberTier: 'Platinum',
    products: [
      { name: 'Thịt bò Úc 500g', sku: '778899001', qty: 2, unitPrice: 250000, total: 500000 },
      { name: 'Rượu vang đỏ Casillero', sku: '334455667', qty: 1, unitPrice: 350000, total: 350000 },
      { name: 'Phô mai Brie 200g', sku: '445566778', qty: 1, unitPrice: 120000, total: 120000 },
    ],
    payment: 'VNPay', status: 'Thành công',
    subtotal: 970000, vat: 77600, discount: 48500, total: 999100,
  },
  {
    id: 'GM-99221', time: '10:45', date: '20/10/2025',
    customer: 'Nguyễn Thùy Linh', phone: '097xxxx321', memberTier: 'Silver Member',
    products: [
      { name: 'Sữa chua Vinamilk (hộp 4)', sku: '223344556', qty: 3, unitPrice: 36000, total: 108000 },
      { name: 'Nước cam Tropicana 1L', sku: '667788990', qty: 2, unitPrice: 45000, total: 90000 },
    ],
    payment: 'ZaloPay', status: 'Thành công',
    subtotal: 198000, vat: 15840, discount: 1980, total: 211860,
  },
  {
    id: 'GM-99218', time: '10:02', date: '20/10/2025',
    customer: 'Võ Đình Long', phone: '088xxxx654', memberTier: '—',
    products: [
      { name: 'Gạo ST25 5kg', sku: '889900112', qty: 1, unitPrice: 125000, total: 125000 },
    ],
    payment: 'Tiền mặt', status: 'Đã hủy',
    subtotal: 125000, vat: 10000, discount: 0, total: 135000,
  },
  {
    id: 'GM-99215', time: '09:20', date: '20/10/2025',
    customer: 'Bùi Minh Châu', phone: '076xxxx987', memberTier: 'Gold Member',
    products: [
      { name: 'Dâu tây Đà Lạt 500g', sku: '112233001', qty: 2, unitPrice: 80000, total: 160000 },
      { name: 'Kem tươi Anchor 250ml', sku: '332211009', qty: 1, unitPrice: 45000, total: 45000 },
    ],
    payment: 'Momo', status: 'Thành công',
    subtotal: 205000, vat: 16400, discount: 6150, total: 215250,
  },
  {
    id: 'GM-99210', time: '08:55', date: '19/10/2025',
    customer: 'Đinh Thị Lan Anh', phone: '091xxxx100', memberTier: 'Silver Member',
    products: [
      { name: 'Mì Ý De Cecco 500g', sku: '990011223', qty: 2, unitPrice: 42000, total: 84000 },
      { name: 'Cà chua bi hộp 400g', sku: '334455001', qty: 3, unitPrice: 28000, total: 84000 },
    ],
    payment: 'Visa', status: 'Thành công',
    subtotal: 168000, vat: 13440, discount: 1680, total: 179760,
  },
  {
    id: 'GM-99205', time: '08:10', date: '19/10/2025',
    customer: 'Hồ Minh Khôi', phone: '094xxxx222', memberTier: '—',
    products: [
      { name: 'Nước tăng lực Sting đỏ', sku: '556677001', qty: 6, unitPrice: 12000, total: 72000 },
      { name: 'Kẹo mút Chupa Chups 10c', sku: '778899221', qty: 1, unitPrice: 35000, total: 35000 },
    ],
    payment: 'Tiền mặt', status: 'Thành công',
    subtotal: 107000, vat: 8560, discount: 0, total: 115560,
  },
  {
    id: 'GM-99200', time: '07:30', date: '19/10/2025',
    customer: 'Trịnh Minh Châu', phone: '089xxxx333', memberTier: 'Gold Member',
    products: [
      { name: 'Sô-cô-la Lindt 85% 100g', sku: '221100334', qty: 3, unitPrice: 95000, total: 285000 },
      { name: 'Cà phê Highlands 200g', sku: '443322115', qty: 1, unitPrice: 120000, total: 120000 },
    ],
    payment: 'VNPay', status: 'Đã trả hàng',
    subtotal: 405000, vat: 32400, discount: 12150, total: 425250,
  },
  {
    id: 'GM-99196', time: '16:45', date: '18/10/2025',
    customer: 'Phan Văn Đức', phone: '079xxxx444', memberTier: 'Silver Member',
    products: [
      { name: 'Thịt heo ba chỉ 1kg', sku: '664455332', qty: 1, unitPrice: 180000, total: 180000 },
      { name: 'Rau muống sạch 500g', sku: '775544221', qty: 2, unitPrice: 15000, total: 30000 },
    ],
    payment: 'ZaloPay', status: 'Thành công',
    subtotal: 210000, vat: 16800, discount: 2100, total: 224700,
  },
  {
    id: 'GM-99191', time: '15:20', date: '18/10/2025',
    customer: 'Mai Thị Hồng Nhung', phone: '086xxxx555', memberTier: '—',
    products: [
      { name: 'Trứng gà ta 10 quả', sku: '998877665', qty: 2, unitPrice: 42000, total: 84000 },
    ],
    payment: 'Tiền mặt', status: 'Thành công',
    subtotal: 84000, vat: 6720, discount: 0, total: 90720,
  },
  {
    id: 'GM-99187', time: '14:00', date: '18/10/2025',
    customer: 'Cao Xuân Trường', phone: '082xxxx666', memberTier: 'Platinum',
    products: [
      { name: 'Whey Protein Gold Standard', sku: '554433221', qty: 1, unitPrice: 850000, total: 850000 },
      { name: 'Shaker bình lắc 700ml', sku: '443322110', qty: 1, unitPrice: 95000, total: 95000 },
    ],
    payment: 'Visa', status: 'Thành công',
    subtotal: 945000, vat: 75600, discount: 47250, total: 973350,
  },
  {
    id: 'GM-99183', time: '11:35', date: '18/10/2025',
    customer: 'Lâm Thị Bảo Châu', phone: '098xxxx777', memberTier: 'Gold Member',
    products: [
      { name: 'Phấn nền Maybelline', sku: '332211008', qty: 1, unitPrice: 280000, total: 280000 },
      { name: 'Kem dưỡng Neutrogena 50ml', sku: '221100997', qty: 2, unitPrice: 145000, total: 290000 },
    ],
    payment: 'Momo', status: 'Thành công',
    subtotal: 570000, vat: 45600, discount: 17100, total: 598500,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 7

const statusCfg: Record<OrderStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  'Thành công': {
    label: 'Thành công',
    cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  'Đã trả hàng': {
    label: 'Đã trả hàng',
    cls: 'bg-amber-50 text-amber-700 border border-amber-200',
    icon: <RefreshCw className="w-3.5 h-3.5" />,
  },
  'Đã hủy': {
    label: 'Đã hủy',
    cls: 'bg-red-50 text-red-700 border border-red-200',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  'Đang xử lý': {
    label: 'Đang xử lý',
    cls: 'bg-blue-50 text-blue-700 border border-blue-200',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
}

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN').format(n) + 'đ'

// ─── Order Detail Modal ───────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const timeline = [
    { label: 'Thanh toán thành công', time: `${order.time}, ${order.date}`, done: true },
    { label: 'Đã xuất hóa đơn', time: `${order.time.split(':')[0]}:${String(+order.time.split(':')[1] + 1).padStart(2, '0')}, ${order.date}`, done: true },
  ]
  if (order.status === 'Đã trả hàng') {
    timeline.push({ label: 'Khách trả hàng', time: `${order.time.split(':')[0]}:${String(+order.time.split(':')[1] + 30).padStart(2, '0')}, ${order.date}`, done: true })
  }
  if (order.status === 'Đã hủy') {
    timeline[0] = { label: 'Đơn hàng đã hủy', time: `${order.time}, ${order.date}`, done: false }
    timeline.splice(1)
  }

  const memberColor: Record<string, string> = {
    'Platinum': 'text-violet-600',
    'Gold Member': 'text-amber-500',
    'Silver Member': 'text-slate-500',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Chi tiết đơn hàng</h2>
            <p className="text-sm font-semibold text-indigo-600 mt-0.5">#{order.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors">
              <Printer className="w-4 h-4" />
              In hóa đơn
            </button>
            <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500 text-white font-medium text-sm hover:bg-rose-600 transition-colors">
              <RotateCcw className="w-4 h-4" />
              Tạo đơn trả
            </button>
          </div>

          {/* Timeline */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Trình trạng đơn hàng</p>
            <div className="space-y-3">
              {timeline.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${step.done ? 'bg-emerald-500' : 'bg-red-400'}`} />
                  <div>
                    <p className={`text-sm font-medium ${step.done ? 'text-gray-800' : 'text-red-600'}`}>{step.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Thông tin khách hàng</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tên:</span>
                <span className="font-semibold text-gray-800">{order.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">SĐT:</span>
                <span className="font-medium text-gray-700">{order.phone}</span>
              </div>
            </div>
          </div>

          {/* Product list */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Danh sách sản phẩm</p>
            <div className="space-y-3">
              {order.products.map((p, i) => (
                <div key={i} className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-snug">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">SKU: {p.sku}</p>
                    <p className="text-xs text-gray-500 mt-0.5">SL: {p.qty} × {fmt(p.unitPrice)}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 flex-shrink-0">{fmt(p.total)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="border-t border-dashed border-gray-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Tạm tính ({order.products.length} sản phẩm)</span>
              <span>{fmt(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>VAT (8%)</span>
              <span>{fmt(order.vat)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-rose-500">
                <span>Giảm giá thành viên</span>
                <span>-{fmt(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-100 font-bold text-base text-gray-900">
              <span>Tổng cộng</span>
              <span className="text-indigo-600">{fmt(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Filtered orders
  const filtered = useMemo(() => {
    return MOCK_ORDERS.filter((o) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q)

      const today = '20/10/2025'
      const thisWeekDates = ['18/10/2025', '19/10/2025', '20/10/2025']
      const matchDate =
        dateFilter === 'all' ||
        (dateFilter === 'today' && o.date === today) ||
        (dateFilter === 'week' && thisWeekDates.includes(o.date))

      const matchStatus = statusFilter === 'all' || o.status === statusFilter
      const matchPayment = paymentFilter === 'all' || o.payment === paymentFilter

      return matchSearch && matchDate && matchStatus && matchPayment
    })
  }, [search, dateFilter, statusFilter, paymentFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const clearFilters = () => {
    setStatusFilter('all')
    setPaymentFilter('all')
    setSearch('')
    setPage(1)
  }

  // Stats (all-time mock)
  const totalOrders = MOCK_ORDERS.length
  const revenue = MOCK_ORDERS.filter((o) => o.status === 'Thành công').reduce((s, o) => s + o.total, 0)
  const returned = MOCK_ORDERS.filter((o) => o.status === 'Đã trả hàng' || o.status === 'Đã hủy').length

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-30">
        <h1 className="text-xl font-bold text-gray-900">Lịch sử đơn hàng</h1>
      </header>

      <main className="flex-1 px-6 py-6 space-y-5">

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-400 mb-1">Tổng đơn hàng</p>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-extrabold text-gray-900">{totalOrders}</span>
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" /> +5%
              </span>
            </div>
          </div>
          <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-400 mb-1">Doanh thu ca</p>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-extrabold text-gray-900">
                {new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(revenue)}
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" /> +12%
              </span>
            </div>
          </div>
          <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-400 mb-1">Hủy / Trả hàng</p>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-extrabold text-gray-900">{returned}</span>
              <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                <TrendingDown className="w-3 h-3" /> -2%
              </span>
            </div>
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">

          {/* Date tabs + Search */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {(['all', 'today', 'week'] as DateFilter[]).map((v) => {
                const labels = { all: 'Tất cả', today: 'Hôm nay', week: 'Tuần này' }
                return (
                  <button
                    key={v}
                    onClick={() => { setDateFilter(v); setPage(1) }}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      dateFilter === v
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {labels[v]}
                  </button>
                )
              })}
            </div>
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Tìm mã đơn hoặc tên khách hàng..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
              />
            </div>
          </div>

          {/* Dropdown filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />

            {/* Status filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
              >
                <option value="all">Trạng thái: Tất cả</option>
                <option value="Thành công">Thành công</option>
                <option value="Đã trả hàng">Đã trả hàng</option>
                <option value="Đã hủy">Đã hủy</option>
                <option value="Đang xử lý">Đang xử lý</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Payment filter */}
            <div className="relative">
              <select
                value={paymentFilter}
                onChange={(e) => { setPaymentFilter(e.target.value); setPage(1) }}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
              >
                <option value="all">Thanh toán: Tất cả</option>
                <option value="Momo">Momo</option>
                <option value="Tiền mặt">Tiền mặt</option>
                <option value="Visa">Visa</option>
                <option value="VNPay">VNPay</option>
                <option value="ZaloPay">ZaloPay</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {(statusFilter !== 'all' || paymentFilter !== 'all' || search) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-rose-600 hover:bg-rose-50 transition-colors font-medium"
              >
                <X className="w-3.5 h-3.5" />
                Xóa lọc
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Mã đơn</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Thời gian</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Khách hàng</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sản phẩm</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tổng tiền</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Thanh toán</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400 text-sm">
                    Không tìm thấy đơn hàng nào.
                  </td>
                </tr>
              ) : (
                paginated.map((order) => {
                  const sc = statusCfg[order.status]
                  const firstProducts = order.products.slice(0, 2)
                  const extra = order.products.length - 2
                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-indigo-600 group-hover:text-indigo-700">
                          #{order.id}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                        <span className="font-medium text-gray-700">{order.time}</span>
                        <br />
                        <span className="text-xs text-gray-400">{order.date}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-800">{order.customer}</p>
                        <p className="text-xs text-gray-400">{order.phone}</p>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">
                        {firstProducts.map((p, i) => (
                          <span key={i} className="block text-xs leading-5 truncate max-w-[160px]">
                            {p.name}
                          </span>
                        ))}
                        {extra > 0 && (
                          <span className="text-xs text-indigo-500 font-medium">+{extra} sản phẩm</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-gray-800 whitespace-nowrap">
                        {fmt(order.total)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                          {order.payment}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.cls}`}>
                          {sc.icon}
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedOrder(order) }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Xem chi tiết"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {/* ── Pagination ── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/60">
            <p className="text-xs text-gray-400">
              Hiển thị{' '}
              <span className="font-medium text-gray-600">
                {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}
              </span>{' '}
              của <span className="font-medium text-gray-600">{filtered.length}</span> đơn hàng
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    p === safePage
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Detail Modal ── */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  )
}
