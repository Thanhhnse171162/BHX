'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, Eye, CheckCircle2, ClipboardCheck, X,
  AlertTriangle, Package, MapPin, Calendar, Hash,
  ChevronRight, RotateCcw, ArrowRight
} from 'lucide-react'

type StatusType = 'done' | 'pending' | 'error'

interface ImportOrder {
  code: string
  source: string
  dest: string
  createdAt: string
  receivedAt: string
  totalSku: number
  totalQty: number
  status: StatusType
}

interface InspectionItem {
  sku: string
  productName: string
  expectedQty: number
  actualQty: string
  condition: 'ok' | 'damaged' | 'missing' | ''
  note: string
}

const IMPORT_ORDERS: ImportOrder[] = [
  { code: 'REC-240801-001', source: 'Nhà máy Vinamilk', dest: 'Kho Quận 12', createdAt: '01/08/2024', receivedAt: '02/08/2024', totalSku: 12, totalQty: 1250, status: 'done' },
  { code: 'REC-240804-015', source: 'Kho Sóng Thần', dest: 'Kho Bình Dương', createdAt: '04/08/2024', receivedAt: '02/08/2026', totalSku: 3, totalQty: 450, status: 'pending' },
  { code: 'REC-240805-002', source: 'Nhà máy Hòa Phát', dest: 'Kho Thủ Đức', createdAt: '05/08/2024', receivedAt: '09/08/2024', totalSku: 5, totalQty: 200, status: 'done' },
  { code: 'REC-240806-009', source: 'Công ty TH True Milk', dest: 'Kho Quận 12', createdAt: '06/08/2025', receivedAt: '02/09/2025', totalSku: 15, totalQty: 1000, status: 'done' },
  { code: 'REC-240804-002', source: 'Hải Hà Kotobuki', dest: 'Kho Quận 12', createdAt: '04/08/2024', receivedAt: '07/08/2024', totalSku: 2, totalQty: 50, status: 'error' },
]

const MOCK_INSPECTION_ITEMS: Record<string, InspectionItem[]> = {
  'REC-240804-015': [
    { sku: 'SKU-VNM-001', productName: 'Sữa tươi tiệt trùng 1L', expectedQty: 200, actualQty: '', condition: '', note: '' },
    { sku: 'SKU-VNM-002', productName: 'Sữa chua uống chai 150ml', expectedQty: 150, actualQty: '', condition: '', note: '' },
    { sku: 'SKU-VNM-003', productName: 'Phô mai miếng 200g', expectedQty: 100, actualQty: '', condition: '', note: '' },
  ]
}

export default function ReceiveGoodsPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<ImportOrder[]>(IMPORT_ORDERS)
  const [statusFilter, setStatusFilter] = useState<'all' | StatusType>('all')
  const [inspectingOrder, setInspectingOrder] = useState<ImportOrder | null>(null)
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([])
  const [inspectorNote, setInspectorNote] = useState('')
  const [confirmAction, setConfirmAction] = useState<'complete' | 'cancel' | null>(null)
  const [step, setStep] = useState<'detail' | 'inspect'>('detail')

  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    done: orders.filter(o => o.status === 'done').length,
    error: orders.filter(o => o.status === 'error').length,
  }

  const filteredOrders = orders.filter(o => statusFilter === 'all' ? true : o.status === statusFilter)

  const openInspection = (order: ImportOrder) => {
    const items = MOCK_INSPECTION_ITEMS[order.code] || []
    setInspectionItems(items.map(i => ({ ...i })))
    setInspectingOrder(order)
    setInspectorNote('')
    setStep('detail')
    setConfirmAction(null)
  }

  const closeInspection = () => {
    setInspectingOrder(null)
    setInspectionItems([])
    setConfirmAction(null)
  }

  const updateItem = (idx: number, field: keyof InspectionItem, value: string) => {
    setInspectionItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const allItemsFilled = inspectionItems.length > 0 && inspectionItems.every(
    item => item.actualQty !== '' && item.condition !== ''
  )

  const hasDiscrepancy = inspectionItems.some(
    item => item.condition !== 'ok' || Number(item.actualQty) !== item.expectedQty
  )

  const handleConfirmComplete = () => {
    if (!inspectingOrder) return
    setOrders(prev => prev.map(o => o.code === inspectingOrder.code ? { ...o, status: 'done' } : o))
    closeInspection()
  }

  const handleConfirmCancel = () => {
    if (!inspectingOrder) return
    setOrders(prev => prev.map(o => o.code === inspectingOrder.code ? { ...o, status: 'error' } : o))
    closeInspection()
  }

  const TABS = [
    { key: 'all',     label: 'Tất cả',    count: counts.all },
    { key: 'pending', label: 'Chờ xử lý', count: counts.pending },
    { key: 'done',    label: 'Hoàn tất',  count: counts.done },
    { key: 'error',   label: 'Đã hủy',    count: counts.error },
  ] as const

  const statusConfig: Record<StatusType, { label: string; dotCls: string; badgeCls: string }> = {
    done:    { label: 'Hoàn tất',  dotCls: 'bg-emerald-500',             badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    pending: { label: 'Chờ xử lý', dotCls: 'bg-amber-500 animate-pulse', badgeCls: 'bg-amber-50 text-amber-700 border-amber-200' },
    error:   { label: 'Đã hủy',    dotCls: 'bg-red-500',                 badgeCls: 'bg-red-50 text-red-600 border-red-200' },
  }

  const StatusBadge = ({ status }: { status: StatusType }) => {
    const cfg = statusConfig[status]
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium border ${cfg.badgeCls}`}>
        <span className={`w-1.5 h-1.5 rounded-full inline-block flex-shrink-0 ${cfg.dotCls}`} />
        {cfg.label}
      </span>
    )
  }


  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Danh sách phiếu nhập hàng</h1>
          <p className="text-sm text-slate-500 mt-0.5">Theo dõi và quản lý các chứng từ nhập kho</p>
        </div>
        {/* Đã xóa nút tạo phiếu nhập mới */}
      </div>

      {/* ── FILTER BAR ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 space-y-3">
        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Tìm mã phiếu, SKU..."
              className="pl-9 h-9 border border-slate-200 rounded-lg text-sm w-52 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition"
            />
          </div>
          <select className="h-9 border border-slate-200 rounded-lg px-3 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
            <option>Kho nguồn</option>
          </select>
          <select className="h-9 border border-slate-200 rounded-lg px-3 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
            <option>Kho đích</option>
          </select>
          <input type="date" className="h-9 border border-slate-200 rounded-lg px-3 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
          <button className="h-9 px-3 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition-colors">
            <RotateCcw size={13} />
            Làm mới
          </button>
        </div>

        <div className="flex gap-2">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                statusFilter === t.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                statusFilter === t.key ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── TABLE ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left">
              {['Mã phiếu', 'Kho nguồn', 'Kho đích', 'Ngày tạo', 'Ngày nhận', 'Tổng SKU', 'Số lượng', 'Trạng thái', 'Hành động'].map(h => (
                <th key={h} className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-400 text-sm">
                  Không có phiếu nào phù hợp
                </td>
              </tr>
            ) : filteredOrders.map(order => (
              <tr key={order.code} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-emerald-600 font-mono text-xs">{order.code}</td>
                <td className="px-4 py-3.5 text-slate-700">{order.source}</td>
                <td className="px-4 py-3.5 text-slate-700">{order.dest}</td>
                <td className="px-4 py-3.5 text-slate-500 text-xs">{order.createdAt}</td>
                <td className="px-4 py-3.5 text-slate-500 text-xs">{order.receivedAt}</td>
                <td className="px-4 py-3.5 text-slate-600 text-center">{order.totalSku}</td>
                <td className="px-4 py-3.5 font-medium text-slate-700">{order.totalQty.toLocaleString()}</td>
                <td className="px-4 py-3.5"><StatusBadge status={order.status} /></td>
                <td className="px-4 py-3.5">
                  <div className="flex justify-center">
                    {order.status === 'pending' ? (
                      <button
                        onClick={() => openInspection(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-500 text-amber-600 hover:text-white border border-amber-300 hover:border-amber-500 rounded-lg text-xs font-semibold transition-all group"
                      >
                        <ClipboardCheck size={13} />
                        Kiểm tra
                        <ArrowRight size={11} className="opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      </button>
                    ) : (
                      <button
                        className="text-slate-400 hover:text-emerald-600 transition-colors p-1 rounded-md hover:bg-emerald-50"
                        onClick={() => alert(`Xem chi tiết: ${order.code}`)}
                      >
                        <Eye size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
          <p>Hiển thị <span className="font-semibold text-slate-700">{filteredOrders.length}</span> phiếu</p>
          <div className="flex items-center gap-1">
            {['‹', '1', '2', '3', '…', '30', '›'].map((p, i) => (
              <button key={i} className={`w-7 h-7 rounded-md transition-colors text-xs ${
                p === '1' ? 'bg-emerald-600 text-white font-semibold' :
                p === '…' ? 'text-slate-400 cursor-default' :
                'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          INSPECTION MODAL
      ══════════════════════════════════════════════════════ */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck size={17} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm leading-tight">Kiểm tra phiếu nhập hàng</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{inspectingOrder.code}</p>
                </div>
              </div>
              <button
                onClick={closeInspection}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Step Tabs */}
            <div className="flex border-b border-slate-100 px-2">
              {[
                { key: 'detail',  label: 'Thông tin phiếu',  num: 1 },
                { key: 'inspect', label: 'Kiểm tra thực tế', num: 2 },
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => setStep(s.key as 'detail' | 'inspect')}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                    step === s.key
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 transition-colors ${
                    step === s.key ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>{s.num}</span>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-6">

              {/* ─ STEP 1: Detail ─ */}
              {step === 'detail' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: MapPin,    label: 'Kho nguồn',        value: inspectingOrder.source,                             ring: 'ring-blue-200',    iconCls: 'text-blue-500 bg-blue-50' },
                      { icon: MapPin,    label: 'Kho đích',          value: inspectingOrder.dest,                               ring: 'ring-violet-200',  iconCls: 'text-violet-500 bg-violet-50' },
                      { icon: Calendar, label: 'Ngày tạo phiếu',    value: inspectingOrder.createdAt,                          ring: 'ring-slate-200',   iconCls: 'text-slate-500 bg-slate-100' },
                      { icon: Calendar, label: 'Ngày nhận dự kiến', value: inspectingOrder.receivedAt,                         ring: 'ring-amber-200',   iconCls: 'text-amber-500 bg-amber-50' },
                      { icon: Hash,     label: 'Tổng SKU',           value: `${inspectingOrder.totalSku} loại`,                 ring: 'ring-emerald-200', iconCls: 'text-emerald-600 bg-emerald-50' },
                      { icon: Package,  label: 'Tổng số lượng',     value: `${inspectingOrder.totalQty.toLocaleString()} đvt`,  ring: 'ring-emerald-200', iconCls: 'text-emerald-600 bg-emerald-50' },
                    ].map(({ icon: Icon, label, value, ring, iconCls }) => (
                      <div key={label} className={`flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl ring-1 ${ring}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconCls}`}>
                          <Icon size={14} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                          <p className="text-sm font-semibold text-slate-800">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                    <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800 mb-1">Hướng dẫn kiểm tra</p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Đối chiếu số lượng thực nhận với số lượng trên phiếu. Đánh giá chất lượng từng mặt hàng và ghi chú chi tiết nếu phát hiện sai lệch hoặc hư hỏng.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ─ STEP 2: Inspection form ─ */}
              {step === 'inspect' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Danh sách hàng hóa cần kiểm tra</p>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                      {inspectionItems.length} SKU
                    </span>
                  </div>

                  {inspectionItems.map((item, idx) => {
                    const diffQty = item.actualQty !== '' ? Number(item.actualQty) - item.expectedQty : 0
                    const filled  = item.actualQty !== '' && item.condition !== ''
                    return (
                      <div
                        key={item.sku}
                        className={`border rounded-xl p-4 space-y-3 transition-colors ${
                          filled
                            ? item.condition === 'ok' && diffQty === 0
                              ? 'border-emerald-200 bg-emerald-50/30'
                              : 'border-amber-200 bg-amber-50/30'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{item.productName}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{item.sku}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-slate-400">Kế hoạch</p>
                            <p className="text-base font-bold text-slate-700">{item.expectedQty.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1.5">
                              Số lượng thực nhận <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min={0}
                              placeholder={`${item.expectedQty}`}
                              value={item.actualQty}
                              onChange={e => updateItem(idx, 'actualQty', e.target.value)}
                              className={`w-full h-9 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors ${
                                item.actualQty !== '' && diffQty !== 0 ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'
                              }`}
                            />
                            {item.actualQty !== '' && diffQty !== 0 && (
                              <p className="text-xs text-amber-600 mt-1 font-medium">
                                {diffQty > 0 ? `+${diffQty}` : diffQty} so với kế hoạch
                              </p>
                            )}
                            {item.actualQty !== '' && diffQty === 0 && (
                              <p className="text-xs text-emerald-600 mt-1 font-medium">✓ Đúng số lượng</p>
                            )}
                          </div>

                          <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1.5">
                              Tình trạng hàng <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={item.condition}
                              onChange={e => updateItem(idx, 'condition', e.target.value)}
                              className={`w-full h-9 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors ${
                                item.condition === 'ok'      ? 'border-emerald-300 bg-emerald-50 text-emerald-700' :
                                item.condition === 'damaged' ? 'border-red-300 bg-red-50 text-red-700' :
                                item.condition === 'missing' ? 'border-amber-300 bg-amber-50 text-amber-700' :
                                'border-slate-200 bg-white text-slate-600'
                              }`}
                            >
                              <option value="">-- Chọn tình trạng --</option>
                              <option value="ok">✓ Đạt – Đúng số lượng & chất lượng</option>
                              <option value="damaged">✗ Hư hỏng – Hàng bị lỗi, hư hại</option>
                              <option value="missing">⚠ Thiếu hàng – Số lượng không đủ</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-600 block mb-1.5">Ghi chú</label>
                          <input
                            placeholder="Mô tả sai lệch hoặc tình trạng hàng..."
                            value={item.note}
                            onChange={e => updateItem(idx, 'note', e.target.value)}
                            className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white"
                          />
                        </div>
                      </div>
                    )
                  })}

                  {/* Overall note */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">Ghi chú tổng hợp</label>
                    <textarea
                      rows={3}
                      placeholder="Nhận xét chung về lô hàng, phương tiện vận chuyển, điều kiện giao nhận..."
                      value={inspectorNote}
                      onChange={e => setInspectorNote(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 resize-none"
                    />
                  </div>

                  {/* Summary banner */}
                  {allItemsFilled && (
                    <div className={`rounded-xl p-3.5 border flex items-center gap-2.5 ${
                      hasDiscrepancy ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
                    }`}>
                      {hasDiscrepancy
                        ? <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
                        : <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                      }
                      <p className={`text-sm font-semibold ${hasDiscrepancy ? 'text-amber-800' : 'text-emerald-800'}`}>
                        {hasDiscrepancy
                          ? 'Phát hiện sai lệch – Kiểm tra lại trước khi xác nhận'
                          : 'Tất cả mặt hàng đạt yêu cầu – Sẵn sàng xác nhận nhập kho'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
              {step === 'detail' ? (
                <>
                  <button
                    onClick={closeInspection}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={() => setStep('inspect')}
                    className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                  >
                    <ClipboardCheck size={14} />
                    Bắt đầu kiểm tra
                    <ChevronRight size={13} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setConfirmAction('cancel')}
                    className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    <X size={13} />
                    Hủy phiếu
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep('detail')}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Quay lại
                    </button>
                    <button
                      disabled={!allItemsFilled}
                      onClick={() => setConfirmAction('complete')}
                      className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                        allItemsFilled
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      Xác nhận nhập kho
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          CONFIRM DIALOG
      ══════════════════════════════════════════════════════ */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 border border-slate-200">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              confirmAction === 'complete' ? 'bg-emerald-100' : 'bg-red-100'
            }`}>
              {confirmAction === 'complete'
                ? <CheckCircle2 size={22} className="text-emerald-600" />
                : <AlertTriangle size={22} className="text-red-500" />
              }
            </div>
            <h3 className="text-sm font-bold text-slate-800 text-center mb-2">
              {confirmAction === 'complete' ? 'Xác nhận nhập kho?' : 'Hủy phiếu nhập hàng?'}
            </h3>
            <p className="text-xs text-slate-500 text-center mb-5 leading-relaxed">
              {confirmAction === 'complete'
                ? `Phiếu ${inspectingOrder?.code} sẽ chuyển sang "Hoàn tất". Hàng hóa được ghi nhận nhập kho chính thức.`
                : `Phiếu ${inspectingOrder?.code} sẽ bị hủy. Thao tác này không thể hoàn tác.`
              }
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 font-medium transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={confirmAction === 'complete' ? handleConfirmComplete : handleConfirmCancel}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  confirmAction === 'complete'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {confirmAction === 'complete' ? 'Xác nhận' : 'Hủy phiếu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}