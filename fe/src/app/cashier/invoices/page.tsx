'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Search, X, Printer, ChevronLeft, ChevronRight,
  AlertCircle,
  CheckCircle2, Info, ChevronDown, Filter, Loader2,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'

type OrderStatus = 'Thành công' | 'Đang xử lý'
type DateFilter = 'all' | 'today' | 'week'

interface SaleItemFromApi {
  id: string
  productId: string
  productName: string
  sku?: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

interface SalePaymentFromApi {
  id: string
  paymentMethod: string
  amount: number
  status: string
  paymentDate?: string
  transactionReference?: string
}

interface SaleFromApi {
  id: string
  saleNumber: string
  storeId: string
  cashierId: string
  customerId: string | null
  saleDate: string
  subtotal: number
  totalAmount: number
  paymentMethod: string
  paymentStatus: string
  status: string
  notes?: string | null
  items: SaleItemFromApi[]
  payments?: SalePaymentFromApi[]
}

interface OrderProduct {
  name: string
  sku: string
  qty: number
  unitPrice: number
  total: number
}

interface Order {
  id: string
  code: string
  saleDateISO: string
  time: string
  date: string
  customer: string
  phone: string
  memberTier: string
  products: OrderProduct[]
  payment: string
  paymentRaw: string
  status: OrderStatus
  statusRaw: string
  subtotal: number
  vat: number
  discount: number
  total: number
}

interface InvoicePrintItem {
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  discount: number
  lineTotal: number
}

interface InvoicePrintData {
  saleId: string
  saleNumber: string
  saleDate: string
  storeId: string
  cashierId: string
  items: InvoicePrintItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: string
  paymentStatus: string
  cashReceived: number | null
  cashChange: number | null
  transactionReference: string | null
}

const PAGE_SIZE = 7

const STORE_NAME_BY_ID: Record<string, string> = {
  'b0000001-0001-0001-0001-000000000001': 'GR-SCMS',
}

const statusCfg: Record<OrderStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  'Thành công': {
    label: 'Thành công',
    cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  'Đang xử lý': {
    label: 'Đang xử lý',
    cls: 'bg-blue-50 text-blue-700 border border-blue-200',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
}

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN').format(n) + 'đ'

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const openInvoicePrintView = (invoice: InvoicePrintData, storeName: string, cashierName: string) => {
  if (typeof window === 'undefined') return

  const paid = String(invoice.paymentStatus || '').toUpperCase() === 'PAID'
  const saleDate = new Date(invoice.saleDate)
  const dateText = Number.isNaN(saleDate.getTime()) ? invoice.saleDate : saleDate.toLocaleDateString('vi-VN')
  const timeText = Number.isNaN(saleDate.getTime()) ? '' : saleDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

  const rows = invoice.items.map((p) => `
    <tr>
      <td>
        <div class="product-name">${escapeHtml(p.productName)}</div>
        <div class="sku">SKU: ${escapeHtml(p.sku)}</div>
      </td>
      <td class="center">${p.quantity}</td>
      <td class="right">${fmt(p.unitPrice)}</td>
      <td class="right">${fmt(p.lineTotal)}</td>
    </tr>
  `).join('')

  const qrValue = encodeURIComponent(invoice.saleNumber)
  const qrUrl = `https://quickchart.io/qr?text=${qrValue}&size=170`

  const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hoa don ${escapeHtml(invoice.saleNumber)}</title>
  <style>
    :root { --green:#006a4e; --green2:#0a7d57; --gray:#f3f4f6; --text:#1f2937; --muted:#6b7280; --yellow:#f7be00; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Arial, Helvetica, sans-serif; background:#efefef; color:var(--text); }
    .topbar { background:var(--green); color:#ffd44d; font-weight:900; font-style:italic; padding:10px 14px; font-size:20px; letter-spacing:.3px; }
    .sheet-wrap { padding:18px; display:flex; justify-content:center; }
    .sheet { width:420px; background:#fff; border-radius:6px; overflow:hidden; box-shadow:0 8px 22px rgba(0,0,0,.12); }
    .header { padding:18px 18px 10px; border-bottom:1px solid #ececec; }
    .title-row { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
    .brand { color:var(--green2); font-weight:900; font-size:34px; line-height:1; letter-spacing:.2px; }
    .meta-small { color:var(--muted); font-size:11px; margin-top:5px; }
    .badge { background:#dff7ea; color:#1f9d63; border:1px solid #bce9d1; border-radius:999px; font-size:11px; padding:3px 8px; font-weight:700; display:inline-block; }
    .code { font-size:20px; font-weight:700; margin-top:8px; }
    .grid2 { margin-top:12px; display:grid; grid-template-columns:1fr 1fr; gap:8px 20px; font-size:11px; color:var(--muted); }
    .grid2 b { color:#111827; font-weight:700; }
    .content { padding:14px 18px 0; }
    .section-title { font-size:13px; font-weight:800; margin-bottom:8px; color:#374151; }
    .table { width:100%; border-collapse:collapse; font-size:12px; }
    .table th { text-align:left; background:#f7f7f7; color:#6b7280; font-weight:700; font-size:10px; padding:8px; border:1px solid #ebebeb; text-transform:uppercase; }
    .table td { padding:9px 8px; border:1px solid #efefef; vertical-align:top; }
    .table .center { text-align:center; }
    .table .right { text-align:right; }
    .product-name { font-weight:700; color:#1f2937; }
    .sku { font-size:10px; color:#9ca3af; margin-top:2px; }
    .totals { margin-top:0; background:var(--yellow); padding:14px 18px; }
    .totals .line { display:flex; justify-content:space-between; color:#3b3b3b; font-size:14px; margin:4px 0; }
    .totals .sum { display:flex; justify-content:space-between; margin-top:8px; font-size:30px; font-weight:900; color:#1e1e1e; }
    .qr-wrap { text-align:center; padding:20px 16px 12px; }
    .qr-box { display:inline-flex; border:1px solid #ddd; padding:8px; background:#fff; }
    .qr-box img { width:120px; height:120px; display:block; }
    .footer-note { font-size:11px; color:#6b7280; margin-top:8px; }
    @media print {
      body { background:#fff; }
      .topbar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .sheet { box-shadow:none; width:100%; }
      .totals { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .sheet-wrap { padding:0; }
    }
  </style>
</head>
<body>
  <div class="topbar">BACH HOA XANH</div>
  <div class="sheet-wrap">
    <div class="sheet">
      <div class="header">
        <div class="title-row">
          <div>
            <div class="brand">BACH HOA XANH</div>
            <div class="meta-small">CUA HANG<br>${escapeHtml(storeName)}</div>
          </div>
          <div style="text-align:right">
            <div class="badge">${paid ? 'DA THANH TOAN' : 'CHUA THANH TOAN'}</div>
            <div class="meta-small" style="margin-top:8px">SO HOA DON</div>
            <div class="code">${escapeHtml(invoice.saleNumber)}</div>
          </div>
        </div>
        <div class="grid2">
          <div><span>THOI GIAN GIAO DICH</span><br><b>${escapeHtml(`${dateText} ${timeText}`.trim())}</b></div>
          <div><span>SALE ID</span><br><b>${escapeHtml(invoice.saleId)}</b></div>
          <div><span>NHAN VIEN (CASHIER)</span><br><b>${escapeHtml(cashierName)}</b></div>
          <div><span>PHUONG THUC THANH TOAN</span><br><b>${escapeHtml(String(invoice.paymentMethod || '').toUpperCase())}</b></div>
        </div>
      </div>
      <div class="content">
        <div class="section-title">Chi tiet gio hang</div>
        <table class="table">
          <thead>
            <tr>
              <th>SAN PHAM / SKU</th>
              <th class="center">SL</th>
              <th class="right">DON GIA</th>
              <th class="right">THANH TIEN</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
      <div class="totals">
        <div class="line"><span>Tam tinh:</span><b>${fmt(invoice.subtotal || 0)}</b></div>
        <div class="line"><span>Giam gia:</span><b>${fmt(invoice.discount || 0)}</b></div>
        <div class="line"><span>Thue (VAT):</span><b>${fmt(invoice.tax || 0)}</b></div>
        <div class="sum"><span>TONG THANH TOAN</span><span>${fmt(invoice.total || 0)}</span></div>
      </div>
      <div class="qr-wrap">
        <div class="qr-box"><img src="${qrUrl}" alt="QR" /></div>
        <div class="footer-note">Cam on quy khach da mua sam tai Bach Hoa Xanh.</div>
      </div>
    </div>
  </div>
</body>
</html>`

  const printWindow = window.open('', '_blank', 'width=520,height=900')
  if (!printWindow) return
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  window.setTimeout(() => {
    printWindow.print()
  }, 350)
}

const extractSalesArray = (payload: any): SaleFromApi[] => {
  if (Array.isArray(payload)) return payload as SaleFromApi[]
  if (Array.isArray(payload?.data)) return payload.data as SaleFromApi[]
  if (Array.isArray(payload?.items)) return payload.items as SaleFromApi[]
  return []
}

const mapPaymentLabel = (raw: string): string => {
  const v = String(raw || '').toUpperCase()
  if (v === 'MOMO') return 'Momo'
  if (v === 'CASH') return 'Tiền mặt'
  return raw || 'Khác'
}

const mapOrderStatus = (status: string, paymentStatus: string): OrderStatus => {
  const s = String(status || '').toUpperCase()
  const p = String(paymentStatus || '').toUpperCase()

  if (s.includes('CANCEL') || s.includes('VOID')) return 'Thành công'
  if (s.includes('RETURN') || s.includes('REFUND') || p.includes('REFUND')) return 'Thành công'
  if (s.includes('COMPLETE') || s.includes('SUCCESS') || p === 'PAID' || p === 'COMPLETED' || p === 'SUCCESS') return 'Thành công'
  return 'Đang xử lý'
}

const mapSaleToOrder = (sale: SaleFromApi): Order => {
  const d = new Date(sale.saleDate)
  const products = (sale.items || []).map((item) => ({
    name: item.productName,
    sku: item.sku || '—',
    qty: item.quantity,
    unitPrice: item.unitPrice,
    total: item.lineTotal,
  }))

  const subtotal = sale.subtotal ?? 0
  const total = sale.totalAmount ?? subtotal
  const vat = Math.max(0, total - subtotal)

  return {
    id: sale.id,
    code: sale.saleNumber || sale.id,
    saleDateISO: sale.saleDate,
    time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    date: d.toLocaleDateString('vi-VN'),
    customer: sale.customerId ? `KH ${sale.customerId.slice(0, 8)}` : 'Khách vãng lai',
    phone: '—',
    memberTier: '—',
    products,
    payment: mapPaymentLabel(sale.paymentMethod),
    paymentRaw: sale.paymentMethod,
    status: mapOrderStatus(sale.status, sale.paymentStatus),
    statusRaw: sale.status,
    subtotal,
    vat,
    discount: 0,
    total,
  }
}

function OrderDetailModal({ order, onClose, onPrint }: { order: Order; onClose: () => void; onPrint: () => void }) {
  const timeline = [
    { label: order.status === 'Thành công' ? 'Thanh toán thành công' : 'Đơn hàng đang xử lý', time: `${order.time}, ${order.date}`, done: order.status === 'Thành công' },
    { label: 'Đã xuất hóa đơn', time: `${order.time}, ${order.date}`, done: order.status === 'Thành công' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Chi tiết đơn hàng</h2>
            <p className="text-sm font-semibold text-indigo-600 mt-0.5">#{order.code}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={onPrint}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              In hóa đơn
            </button>
          </div>

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

          <div className="border-t border-dashed border-gray-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Tạm tính ({order.products.length} sản phẩm)</span>
              <span>{fmt(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>VAT</span>
              <span>{fmt(order.vat)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-rose-500">
                <span>Giảm giá</span>
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

export default function InvoicesPage() {
  const { user, token } = useAuthStore()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const buildPrintDataFromPayload = (payload: any, order: Order): InvoicePrintData => {
    const sale = payload?.data && typeof payload.data === 'object' ? payload.data : payload
    const saleId = String(sale?.saleId || sale?.id || order.id)
    const saleNumber = String(sale?.saleNumber || order.code)
    const saleDate = String(sale?.saleDate || order.saleDateISO)
    const storeId = String(sale?.storeId || user?.workplaceId || user?.storeId || '')
    const cashierId = String(sale?.cashierId || user?.id || '')

    const itemsFromApi = Array.isArray(sale?.items) ? sale.items : []
    const items: InvoicePrintItem[] = (itemsFromApi.length > 0 ? itemsFromApi : order.products).map((item: any) => ({
      productName: String(item?.productName || item?.name || ''),
      sku: String(item?.sku || '—'),
      quantity: Number(item?.quantity ?? item?.qty ?? 0),
      unitPrice: Number(item?.unitPrice ?? 0),
      discount: Number(item?.discount ?? 0),
      lineTotal: Number(item?.lineTotal ?? item?.total ?? 0),
    }))

    return {
      saleId,
      saleNumber,
      saleDate,
      storeId,
      cashierId,
      items,
      subtotal: Number(sale?.subtotal ?? order.subtotal ?? 0),
      discount: Number(sale?.discount ?? order.discount ?? 0),
      tax: Number(sale?.tax ?? order.vat ?? 0),
      total: Number(sale?.total ?? sale?.totalAmount ?? order.total ?? 0),
      paymentMethod: String(sale?.paymentMethod || order.paymentRaw || ''),
      paymentStatus: String(sale?.paymentStatus || order.statusRaw || ''),
      cashReceived: sale?.cashReceived ?? null,
      cashChange: sale?.cashChange ?? null,
      transactionReference: sale?.transactionReference ?? null,
    }
  }

  const resolveStoreName = (storeId: string) => {
    const key = String(storeId || '').toLowerCase()
    return STORE_NAME_BY_ID[key] || 'GR-SCMS'
  }

  const resolveCashierName = (cashierId: string) => {
    if (user?.id && String(user.id).toLowerCase() === String(cashierId).toLowerCase()) {
      return user.name || 'Nhân viên'
    }
    return user?.name || `Nhân viên ${String(cashierId).slice(0, 8)}`
  }

  const handlePrintInvoice = async (order: Order) => {
    try {
      const res = await fetch(`/api/sales/${order.id}`, {
        headers: {
          accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      })

      const body = await res.json().catch(() => null)
      const printData = buildPrintDataFromPayload(body, order)
      const storeName = resolveStoreName(printData.storeId)
      const cashierName = resolveCashierName(printData.cashierId)
      openInvoicePrintView(printData, storeName, cashierName)
    } catch {
      const fallback = buildPrintDataFromPayload(null, order)
      openInvoicePrintView(fallback, resolveStoreName(fallback.storeId), resolveCashierName(fallback.cashierId))
    }
  }

  useEffect(() => {
    let cancelled = false

    const fetchSales = async () => {
      setLoading(true)
      setError(null)

      try {
        const storeId = user?.workplaceType === 'STORE' ? user?.workplaceId : user?.storeId
        const query = storeId ? `?storeId=${encodeURIComponent(String(storeId))}` : ''
        const res = await fetch(`/api/sales${query}`, {
          headers: {
            accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: 'no-store',
        })

        const body = await res.json().catch(() => null)
        const sales = res.ok ? extractSalesArray(body) : []
        const lastErr = body?.message || body?.error || `API lỗi ${res.status}`

        if (sales.length === 0) {
          if (cancelled) return
          setOrders([])
          setError(lastErr)
          return
        }

        if (!cancelled) {
          setOrders(sales.map(mapSaleToOrder))
        }
      } catch (err: any) {
        if (!cancelled) {
          setOrders([])
          setError(err?.message || 'Không thể tải lịch sử đơn hàng')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSales()

    return () => {
      cancelled = true
    }
  }, [token, user?.storeId, user?.workplaceId, user?.workplaceType])

  const handleOpenDetail = async (order: Order) => {
    setSelectedOrder(order)
    setLoadingDetail(true)

    try {
      const res = await fetch(`/api/sales/${order.id}`, {
        headers: {
          accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      })

      const body = await res.json().catch(() => null)
      if (!res.ok) return

      const sale = (body?.data || body) as SaleFromApi
      if (!sale?.id) return

      setSelectedOrder(mapSaleToOrder(sale))
    } catch {
      // Keep current selected order data if detail call fails.
    } finally {
      setLoadingDetail(false)
    }
  }

  const filtered = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 6)

    return orders.filter((o) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        o.code.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q)

      const saleDate = new Date(o.saleDateISO)
      const matchDate =
        dateFilter === 'all' ||
        (dateFilter === 'today' && saleDate >= todayStart) ||
        (dateFilter === 'week' && saleDate >= weekStart)

      const matchStatus = statusFilter === 'all' || o.status === statusFilter
      const matchPayment = paymentFilter === 'all' || o.payment === paymentFilter

      return matchSearch && matchDate && matchStatus && matchPayment
    })
  }, [orders, search, dateFilter, statusFilter, paymentFilter])

  const paymentOptions = useMemo(() => {
    return Array.from(new Set(orders.map((o) => o.payment))).filter(Boolean)
  }, [orders])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const clearFilters = () => {
    setStatusFilter('all')
    setPaymentFilter('all')
    setSearch('')
    setPage(1)
  }

  const totalOrders = orders.length
  const revenue = orders.filter((o) => o.status === 'Thành công' || o.status === 'Đang xử lý').reduce((s, o) => s + o.total, 0)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-30">
        <h1 className="text-xl font-bold text-gray-900">Lịch sử đơn hàng</h1>
      </header>

      <main className="flex-1 px-6 py-6 space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-400 mb-1">Tổng đơn hàng</p>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-extrabold text-gray-900">{totalOrders}</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-400 mb-1">Doanh thu</p>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-extrabold text-gray-900">
                {new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(revenue)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
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

          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
              >
                <option value="all">Trạng thái: Tất cả</option>
                <option value="Thành công">Thành công</option>
                <option value="Đang xử lý">Đang xử lý</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={paymentFilter}
                onChange={(e) => { setPaymentFilter(e.target.value); setPage(1) }}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
              >
                <option value="all">Thanh toán: Tất cả</option>
                {paymentOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading && (
            <div className="px-5 py-10 flex items-center justify-center gap-2 text-gray-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang tải lịch sử đơn hàng...
            </div>
          )}

          {!loading && error && (
            <div className="px-5 py-6 text-sm text-red-600 border-b border-red-100 bg-red-50">
              {error}
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Mã đơn</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Thời gian</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Khách hàng</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tổng tiền</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Thanh toán</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400 text-sm">
                    Không tìm thấy đơn hàng nào.
                  </td>
                </tr>
              ) : (
                paginated.map((order) => {
                  const sc = statusCfg[order.status]
                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleOpenDetail(order)}
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-indigo-600 group-hover:text-indigo-700">
                          #{order.code}
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
                          onClick={(e) => { e.stopPropagation(); handleOpenDetail(order) }}
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

        {loadingDetail && selectedOrder && (
          <div className="text-xs text-gray-500 -mt-2">Đang làm mới chi tiết đơn từ API...</div>
        )}
      </main>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onPrint={() => handlePrintInvoice(selectedOrder)}
        />
      )}
    </div>
  )
}
