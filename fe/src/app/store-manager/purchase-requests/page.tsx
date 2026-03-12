'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  PackagePlus,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Eye,
  X,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type RequestStatus = 'Đã duyệt' | 'Chờ duyệt' | 'Từ chối'

interface PurchaseRequest {
  id: string
  product: string
  sku: string
  category: string
  quantity: number
  unit: string
  reason: string
  requestedBy: string
  date: string
  status: RequestStatus
  note?: string
}

// ─── Mock data ─────────────────────────────────────────────────────────────────
const ALL_REQUESTS: PurchaseRequest[] = [
  { id: 'YC-0021', product: 'Mì Hảo Hảo tôm chua cay',      sku: 'HH-MG-TCC',    category: 'Mì & Cháo',   quantity: 10, unit: 'Thùng', reason: 'Hết hàng',   requestedBy: 'Minh Tuấn', date: '12/03/2026', status: 'Chờ duyệt' },
  { id: 'YC-0020', product: 'Nước mắm Phú Quốc 750ml',       sku: 'PQ-NMM-750',   category: 'Gia vị',      quantity: 5,  unit: 'Thùng', reason: 'Sắp hết',    requestedBy: 'Thu Hà',    date: '12/03/2026', status: 'Đã duyệt', note: 'Đã liên hệ nhà cung cấp' },
  { id: 'YC-0019', product: 'Cá ngừ đóng hộp Bình Đà',       sku: 'BD-CN-HP',     category: 'Đồ hộp',      quantity: 8,  unit: 'Thùng', reason: 'Hết hàng',   requestedBy: 'Quang Huy', date: '11/03/2026', status: 'Đã duyệt' },
  { id: 'YC-0018', product: 'Bánh mì sandwich Hải Hà',        sku: 'HH-BM-SW',     category: 'Bánh & Kẹo',  quantity: 3,  unit: 'Thùng', reason: 'Sắp hết',    requestedBy: 'Minh Tuấn', date: '11/03/2026', status: 'Đã duyệt' },
  { id: 'YC-0017', product: 'Nước ngọt Pepsi lon 330ml',      sku: 'PEP-LON-330',  category: 'Nước uống',   quantity: 15, unit: 'Thùng', reason: 'Hết hàng',   requestedBy: 'Thu Hà',    date: '10/03/2026', status: 'Từ chối',  note: 'Chờ thanh lý lô cũ' },
  { id: 'YC-0016', product: 'Dầu ăn Neptune 1L',              sku: 'NTP-DA-1L',    category: 'Dầu ăn',      quantity: 6,  unit: 'Thùng', reason: 'Sắp hết',    requestedBy: 'Quang Huy', date: '10/03/2026', status: 'Đã duyệt' },
  { id: 'YC-0015', product: 'Snack khoai tây Pringles',        sku: 'PRG-SNK-KT',   category: 'Bánh & Kẹo',  quantity: 5,  unit: 'Thùng', reason: 'Sắp hết',    requestedBy: 'Minh Tuấn', date: '10/03/2026', status: 'Chờ duyệt' },
  { id: 'YC-0014', product: 'Bột ngọt Ajinomoto 200g',        sku: 'AJN-BN-200G',  category: 'Gia vị',      quantity: 10, unit: 'Thùng', reason: 'Sắp hết',    requestedBy: 'Thu Hà',    date: '09/03/2026', status: 'Đã duyệt' },
  { id: 'YC-0013', product: 'Sữa tươi Vinamilk 1L',           sku: 'VNM-STT-1L',   category: 'Sữa & Trứng', quantity: 20, unit: 'Thùng', reason: 'Sắp hết',    requestedBy: 'Quang Huy', date: '09/03/2026', status: 'Đã duyệt' },
  { id: 'YC-0012', product: 'Trứng gà ta (vỉ 10)',            sku: 'TG-TA-10',     category: 'Sữa & Trứng', quantity: 50, unit: 'Vỉ',    reason: 'Bổ sung',    requestedBy: 'Minh Tuấn', date: '08/03/2026', status: 'Từ chối',  note: 'Vượt định mức đặt hàng' },
  { id: 'YC-0011', product: 'Gạo ST25 túi 5kg',               sku: 'ST25-G-5KG',   category: 'Gạo & Nông sản', quantity: 30, unit: 'Túi', reason: 'Bổ sung',    requestedBy: 'Thu Hà',    date: '08/03/2026', status: 'Đã duyệt' },
  { id: 'YC-0010', product: 'Kem đánh răng Colgate 230g',      sku: 'CLG-KDR-230',  category: 'Vệ sinh',     quantity: 4,  unit: 'Thùng', reason: 'Bổ sung',    requestedBy: 'Quang Huy', date: '07/03/2026', status: 'Chờ duyệt' },
]

const STATUS_OPTS: RequestStatus[] = ['Đã duyệt', 'Chờ duyệt', 'Từ chối']

const statusConfig: Record<RequestStatus, { icon: React.ReactNode; cls: string }> = {
  'Đã duyệt':  { icon: <CheckCircle size={12} />, cls: 'bg-green-50 text-green-700' },
  'Chờ duyệt': { icon: <Clock size={12} />,       cls: 'bg-blue-50 text-blue-700' },
  'Từ chối':   { icon: <XCircle size={12} />,     cls: 'bg-red-50 text-red-600' },
}

const PAGE_SIZE = 10

// ─── Detail modal ─────────────────────────────────────────────────────────────
function DetailModal({ req, onClose }: { req: PurchaseRequest; onClose: () => void }) {
  const sc = statusConfig[req.status]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-[15px] font-bold text-gray-900">Chi tiết yêu cầu</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3 text-[13px]">
          <Row label="Mã yêu cầu"   value={<span className="font-mono font-semibold text-gray-800">{req.id}</span>} />
          <Row label="Sản phẩm"     value={req.product} />
          <Row label="SKU"          value={<span className="font-mono text-gray-600">{req.sku}</span>} />
          <Row label="Danh mục"     value={req.category} />
          <Row label="Số lượng"     value={`${req.quantity} ${req.unit}`} />
          <Row label="Lý do"        value={req.reason} />
          <Row label="Người yêu cầu" value={req.requestedBy} />
          <Row label="Ngày tạo"     value={req.date} />
          {req.note && <Row label="Ghi chú" value={<span className="text-gray-500 italic">{req.note}</span>} />}
          <Row
            label="Trạng thái"
            value={
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.cls}`}>
                {sc.icon} {req.status}
              </span>
            }
          />
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
      <span className="text-gray-800 font-medium text-right max-w-[60%]">{value}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PurchaseRequestsPage() {
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatus]     = useState<string>('Tất cả')
  const [page, setPage]               = useState(1)
  const [selected, setSelected]       = useState<PurchaseRequest | null>(null)

  const todayStr = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const filtered = useMemo(() => {
    let list = ALL_REQUESTS
    if (statusFilter !== 'Tất cả') list = list.filter((r) => r.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) => r.id.toLowerCase().includes(q) || r.product.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q),
      )
    }
    return list
  }, [search, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const stats = useMemo(() => ({
    total:    ALL_REQUESTS.length,
    approved: ALL_REQUESTS.filter((r) => r.status === 'Đã duyệt').length,
    pending:  ALL_REQUESTS.filter((r) => r.status === 'Chờ duyệt').length,
    rejected: ALL_REQUESTS.filter((r) => r.status === 'Từ chối').length,
  }), [])

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <PackagePlus size={20} className="text-emerald-600" />
            Yêu cầu nhập hàng
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Theo dõi và quản lý các yêu cầu bổ sung hàng hóa</p>
        </div>
        <button className="flex items-center gap-2 text-[13px] font-medium text-white bg-emerald-600 px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
          <Plus size={15} />
          Tạo yêu cầu mới
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Tổng yêu cầu', value: stats.total,    cls: 'text-gray-800' },
          { label: 'Đã duyệt',     value: stats.approved, cls: 'text-green-700' },
          { label: 'Chờ duyệt',    value: stats.pending,  cls: 'text-blue-600' },
          { label: 'Từ chối',      value: stats.rejected, cls: 'text-red-500' },
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
            placeholder="Tìm mã yêu cầu, sản phẩm, SKU..."
            className="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all"
          />
        </div>
        {/* Status filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['Tất cả', ...STATUS_OPTS].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto text-[12px] text-gray-500">
          <Calendar size={13} />
          <span>Hôm nay: {todayStr}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Mã YC', 'Sản phẩm', 'Danh mục', 'Số lượng', 'Lý do', 'Người YC', 'Ngày tạo', 'Trạng thái', ''].map((h) => (
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
                    Không tìm thấy yêu cầu nào
                  </td>
                </tr>
              ) : (
                paged.map((req, idx) => {
                  const sc = statusConfig[req.status]
                  return (
                    <tr
                      key={req.id}
                      className={`border-t border-gray-50 hover:bg-emerald-50/20 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/20' : ''}`}
                    >
                      <td className="py-3 px-4 font-mono text-[12px] font-semibold text-gray-600">{req.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800">{req.product}</div>
                        <div className="text-[11px] text-gray-400">{req.sku}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px] font-medium whitespace-nowrap">
                          {req.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-700">{req.quantity} <span className="font-normal text-gray-400 text-[11px]">{req.unit}</span></td>
                      <td className="py-3 px-4 text-gray-500">{req.reason}</td>
                      <td className="py-3 px-4 text-gray-600">{req.requestedBy}</td>
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{req.date}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.cls}`}>
                          {sc.icon} {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelected(req)}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
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
            Hiển thị {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} yêu cầu
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
                  p === page ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
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

      {selected && <DetailModal req={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
