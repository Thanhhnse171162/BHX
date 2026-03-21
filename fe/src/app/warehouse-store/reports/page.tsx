'use client'

import { useState } from 'react'
import { Search, Plus, X, Eye, Filter, ChevronLeft, ChevronRight, Upload, Calendar } from 'lucide-react'

type LocationType = 'STORE' | 'WAREHOUSE'
type DamageType = 'EXPIRED' | 'PHYSICAL_DAMAGE' | 'QUALITY_ISSUE'
type StatusType = 'PENDING' | 'APPROVED' | 'REJECTED'

interface DamageReport {
  id: string
  reportNumber: string
  locationType: LocationType
  damageType: DamageType
  totalValue: number
  status: StatusType
  approvedBy?: string
  reportDate: string
  description: string
  reason: string
  location: string
  statusHistory: { status: StatusType; date: string; note?: string }[]
}

const MOCK_REPORTS: DamageReport[] = []

const STATUS_CONFIG = {
  PENDING: { label: 'PENDING', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', border: 'border-amber-200' },
  APPROVED: { label: 'APPROVED', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  REJECTED: { label: 'REJECTED', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200' }
}

const DAMAGE_TYPE_CONFIG = {
  EXPIRED: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  PHYSICAL_DAMAGE: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  QUALITY_ISSUE: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' }
}

function formatCurrency(value: number) {
  return value.toLocaleString('vi-VN') + ' VND'
}

function StatusBadge({ status }: { status: StatusType }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function DamageTypeBadge({ type }: { type: DamageType }) {
  const cfg = DAMAGE_TYPE_CONFIG[type]
  return (
    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {type}
    </span>
  )
}

function LocationBadge({ type }: { type: LocationType }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
      <span className="text-base">{type === 'STORE' ? '🏪' : '🏭'}</span>
      {type}
    </span>
  )
}

// ─── Detail Modal ────────────────────────────────────────────────────────────
function DetailModal({ report, onClose }: { report: DamageReport; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{report.reportNumber}</h2>
            <p className="text-sm text-slate-500">Chi tiết báo cáo thiệt hại</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Mã báo cáo', value: report.reportNumber },
              { label: 'Ngày báo cáo', value: report.reportDate },
              { label: 'Loại địa điểm', value: <LocationBadge type={report.locationType} /> },
              { label: 'Địa điểm', value: report.location },
              { label: 'Loại thiệt hại', value: <DamageTypeBadge type={report.damageType} /> },
              { label: 'Trạng thái', value: <StatusBadge status={report.status} /> },
              { label: 'Tổng giá trị', value: <span className="font-bold text-rose-600">{formatCurrency(report.totalValue)}</span> },
              { label: 'Người duyệt', value: report.approvedBy || <span className="text-slate-400">—</span> }
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <div className="text-sm font-medium text-slate-800">{value}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Mô tả thiệt hại</p>
            <p className="text-sm text-slate-700">{report.description}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Lý do</p>
            <p className="text-sm text-slate-700">{report.reason}</p>
          </div>

          {/* Status history */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">Lịch sử cập nhật trạng thái</p>
            <div className="space-y-2">
              {report.statusHistory.map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_CONFIG[h.status].dot}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={h.status} />
                      <span className="text-xs text-slate-400">{h.date}</span>
                    </div>
                    {h.note && <p className="text-xs text-slate-500 mt-0.5">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Create Modal ─────────────────────────────────────────────────────────────
function CreateModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    damageType: '' as DamageType | '',
    description: '',
    totalValue: '',
    location: '' as LocationType | '',
    reportDate: '',
    reason: ''
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Tạo báo cáo thiệt hại</h2>
            <p className="text-sm text-slate-500">Điền đầy đủ thông tin bên dưới</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Damage type */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Loại thiệt hại <span className="text-red-500">*</span></label>
              <select
                value={form.damageType}
                onChange={e => set('damageType', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Chọn loại</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="PHYSICAL_DAMAGE">PHYSICAL_DAMAGE</option>
                <option value="QUALITY_ISSUE">QUALITY_ISSUE</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Địa điểm <span className="text-red-500">*</span></label>
              <select
                value={form.location}
                onChange={e => set('location', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Chọn địa điểm</option>
                <option value="STORE">STORE</option>
                <option value="WAREHOUSE">WAREHOUSE</option>
              </select>
            </div>

            {/* Total value */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Tổng giá trị (VND) <span className="text-red-500">*</span></label>
              <input
                type="number"
                placeholder="0"
                value={form.totalValue}
                onChange={e => set('totalValue', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Report date */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Ngày báo cáo <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.reportDate}
                onChange={e => set('reportDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Mô tả thiệt hại <span className="text-red-500">*</span></label>
            <textarea
              rows={3}
              placeholder="Mô tả chi tiết về thiệt hại..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Lý do</label>
            <textarea
              rows={2}
              placeholder="Nguyên nhân dẫn đến thiệt hại..."
              value={form.reason}
              onChange={e => set('reason', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Hình ảnh (tùy chọn)</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-emerald-400 transition-colors cursor-pointer">
              <Upload size={24} className="text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Kéo thả hoặc <span className="text-emerald-600 font-medium">chọn file</span></p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG tối đa 10MB</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Huỷ
            </button>
            <button className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors">
              Gửi báo cáo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DamageReportsPage() {
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [damageFilter, setDamageFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedReport, setSelectedReport] = useState<DamageReport | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 3

  const filtered = MOCK_REPORTS.filter(r => {
    if (search && !r.reportNumber.toLowerCase().includes(search.toLowerCase())) return false
    if (locationFilter && r.locationType !== locationFilter) return false
    if (damageFilter && r.damageType !== damageFilter) return false
    if (statusFilter && r.status !== statusFilter) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const clearFilters = () => {
    setSearch(''); setLocationFilter(''); setDamageFilter(''); setStatusFilter(''); setDateFrom(''); setDateTo('')
    setPage(1)
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Modals */}
      {selectedReport && <DetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-slate-400 mb-1">Inventory &gt; Lịch sử báo cáo thiệt hại</p>
          <h1 className="text-2xl font-bold text-slate-800">Lịch sử báo cáo thiệt hại</h1>
          <p className="text-sm text-slate-400 mt-0.5">Dữ liệu được cập nhật từ /api/damage-reports</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
        >
          <Plus size={16} />
          Tạo báo cáo mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          {/* Search */}
          <div className="relative">
            <p className="text-xs font-medium text-slate-600 mb-1.5">Tìm theo mã báo cáo</p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="VD: DMG-2024-001..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Loại địa điểm</p>
            <select
              value={locationFilter}
              onChange={e => { setLocationFilter(e.target.value); setPage(1) }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Tất cả</option>
              <option value="STORE">STORE</option>
              <option value="WAREHOUSE">WAREHOUSE</option>
            </select>
          </div>

          {/* Damage type */}
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Loại thiệt hại</p>
            <select
              value={damageFilter}
              onChange={e => { setDamageFilter(e.target.value); setPage(1) }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Tất cả</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="PHYSICAL_DAMAGE">PHYSICAL_DAMAGE</option>
              <option value="QUALITY_ISSUE">QUALITY_ISSUE</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          {/* Status */}
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Trạng thái</p>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          {/* Date range */}
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Khoảng thời gian</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-slate-400 text-sm">—</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Clear */}
          <div>
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Xoá bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Số báo cáo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Loại địa điểm</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Loại thiệt hại</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Tổng giá trị</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Người duyệt</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Ngày báo cáo</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide"></th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4">
                  <span className="font-semibold text-slate-800 text-xs leading-tight block whitespace-nowrap">
                    {r.reportNumber}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <LocationBadge type={r.locationType} />
                </td>
                <td className="px-4 py-4">
                  <DamageTypeBadge type={r.damageType} />
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="font-semibold text-slate-800 text-xs whitespace-nowrap">
                    {r.totalValue.toLocaleString('vi-VN')}<br />
                    <span className="font-normal text-slate-500">VND</span>
                  </span>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-4">
                  {r.approvedBy ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                        {r.approvedBy.charAt(0)}
                      </div>
                      <span className="text-xs text-slate-600 whitespace-nowrap">{r.approvedBy}</span>
                    </div>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">{r.reportDate}</td>
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => setSelectedReport(r)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <Eye size={12} />
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Hiện {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filtered.length)} của {filtered.length} báo cáo
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 text-xs rounded-lg font-medium transition-colors ${
                  page === p
                    ? 'bg-emerald-600 text-white'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}