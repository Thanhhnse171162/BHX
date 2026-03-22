'use client'

import { useState, useMemo } from 'react'
import {
  Search, Plus, Upload, Download, Eye, Pencil, Ban, CheckCircle2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  X, Building2, Phone, Mail, MapPin, Hash, StickyNote,
  AlertTriangle, Check, ChevronDown, RotateCcw, TrendingUp, Users, UserX
} from 'lucide-react'

type Status = 'ACTIVE' | 'INACTIVE'

interface Supplier {
  id: string
  name: string
  code: string
  phone: string
  email: string
  address: string
  status: Status
  createdAt: string
  note?: string
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

const avatar = (name: string) => name.trim().charAt(0).toUpperCase()

const AVATAR_COLORS: Record<string, string> = {
  V: '#2563eb', F: '#0891b2', T: '#7c3aed', M: '#059669',
  A: '#db2777', B: '#ea580c', C: '#65a30d', D: '#0284c7',
  E: '#9333ea', G: '#16a34a', H: '#dc2626', I: '#ca8a04',
  J: '#0d9488', K: '#7c3aed', L: '#c026d3', N: '#2563eb',
  O: '#ea580c', P: '#0891b2', Q: '#059669', R: '#7c3aed',
  S: '#db2777', U: '#dc2626', W: '#0d9488', X: '#9333ea',
  Y: '#ca8a04', Z: '#16a34a',
}
const getAvatarColor = (name: string) => AVATAR_COLORS[avatar(name)] ?? '#6b7280'

interface FormData {
  name: string; code: string; phone: string; email: string
  address: string; note: string; status: Status
}
const EMPTY_FORM: FormData = { name: '', code: '', phone: '', email: '', address: '', note: '', status: 'ACTIVE' }

function SupplierModal({ open, supplier, usedCodes, onClose, onSave }: {
  open: boolean; supplier: Supplier | null; usedCodes: string[]
  onClose: () => void; onSave: (data: FormData, id?: string) => void
}) {
  const [form, setForm] = useState<FormData>(supplier ? {
    name: supplier.name, code: supplier.code, phone: supplier.phone,
    email: supplier.email, address: supplier.address, note: supplier.note ?? '', status: supplier.status
  } : EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  if (!open) return null

  const set = (k: keyof FormData, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  const validate = () => {
    const e: typeof errors = {}
    if (!form.name.trim()) e.name = 'Tên nhà cung cấp là bắt buộc'
    if (!form.code.trim()) e.code = 'Mã NCC là bắt buộc'
    else if (usedCodes.includes(form.code.trim()) && form.code !== supplier?.code) e.code = 'Mã NCC đã tồn tại'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const Field = ({ label, field, placeholder, type = 'text', required = false }:
    { label: string; field: keyof FormData; placeholder?: string; type?: string; required?: boolean }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={form[field] as string} onChange={e => set(field, e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 rounded-lg border text-sm bg-white transition-all outline-none
          ${errors[field] ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50'}`} />
      {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{supplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Điền đầy đủ thông tin bên dưới</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Field label="Tên nhà cung cấp" field="name" placeholder="VD: Công ty TNHH ABC" required /></div>
            <Field label="Mã NCC" field="code" placeholder="VD: NCC-0001" required />
            <Field label="Số điện thoại" field="phone" placeholder="0909 xxx xxx" />
            <div className="col-span-2"><Field label="Email" field="email" placeholder="contact@company.vn" type="email" /></div>
            <div className="col-span-2"><Field label="Địa chỉ" field="address" placeholder="Số nhà, đường, quận, thành phố" /></div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Ghi chú</label>
              <textarea value={form.note} onChange={e => set('note', e.target.value)}
                placeholder="Ghi chú thêm về nhà cung cấp..." rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white resize-none outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Trạng thái</label>
              <div className="flex gap-3">
                {(['ACTIVE', 'INACTIVE'] as Status[]).map(s => (
                  <button key={s} onClick={() => set('status', s)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all
                      ${form.status === s
                        ? s === 'ACTIVE' ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-red-50 border-red-400 text-red-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    {s === 'ACTIVE' ? '● Hoạt động' : '○ Ngừng hợp tác'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
          <button onClick={onClose} className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Hủy</button>
          <button onClick={() => { if (validate()) onSave(form, supplier?.id) }}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm">
            {supplier ? 'Lưu thay đổi' : 'Thêm mới'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailModal({ supplier, onClose, onEdit }: { supplier: Supplier; onClose: () => void; onEdit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Chi tiết nhà cung cấp</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
              style={{ backgroundColor: getAvatarColor(supplier.name) }}>
              {avatar(supplier.name)}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg leading-tight">{supplier.name}</p>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1"
                style={supplier.status === 'ACTIVE' ? { background: '#d1fae5', color: '#065f46' } : { background: '#fee2e2', color: '#991b1b' }}>
                {supplier.status}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 bg-gray-50 rounded-xl p-4">
            {[
              { icon: Hash, label: 'Mã NCC', value: supplier.code },
              { icon: Phone, label: 'Điện thoại', value: supplier.phone || '—' },
              { icon: Mail, label: 'Email', value: supplier.email || '—' },
              { icon: MapPin, label: 'Địa chỉ', value: supplier.address || '—' },
              { icon: StickyNote, label: 'Ghi chú', value: supplier.note || '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-700 break-all">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center">Ngày tạo: {fmtDate(supplier.createdAt)}</p>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Đóng</button>
          <button onClick={onEdit} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            <Pencil size={14} /> Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmModal({ open, supplier, onClose, onConfirm }:
  { open: boolean; supplier: Supplier | null; onClose: () => void; onConfirm: () => void }) {
  if (!open || !supplier) return null
  const isActive = supplier.status === 'ACTIVE'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${isActive ? 'bg-orange-50' : 'bg-emerald-50'}`}>
          {isActive ? <Ban size={28} className="text-orange-500" /> : <CheckCircle2 size={28} className="text-emerald-500" />}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{isActive ? 'Ngừng hợp tác?' : 'Kích hoạt lại?'}</h3>
        <p className="text-sm text-gray-500 mb-6">
          {isActive ? `Nhà cung cấp "${supplier.name}" sẽ bị chuyển sang trạng thái Inactive.`
            : `Nhà cung cấp "${supplier.name}" sẽ được kích hoạt trở lại.`}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Hủy</button>
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors ${isActive ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  )
}

interface Toast { id: number; message: string; type: 'success' | 'error' }

function ToastList({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed top-5 right-5 z-[100] space-y-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto
            ${t.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {t.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          {t.message}
        </div>
      ))}
    </div>
  )
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accentColor, bgFrom, bgTo, borderColor, iconColor, sublabel }: {
  label: string; value: number; icon: React.ElementType
  accentColor: string; bgFrom: string; bgTo: string; borderColor: string; iconColor: string; sublabel: string
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 border ${borderColor} shadow-sm`}
      style={{ background: `linear-gradient(135deg, ${bgFrom}, ${bgTo})` }}>
      {/* Decorative blobs */}
      <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full opacity-20"
        style={{ background: accentColor }} />
      <div className="absolute right-4 -bottom-8 w-16 h-16 rounded-full opacity-10"
        style={{ background: accentColor }} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">{label}</p>
          <p className="text-4xl font-black leading-none" style={{ color: accentColor }}>{value}</p>
          <div className="flex items-center gap-1.5 mt-2.5">
            <TrendingUp size={11} className="text-gray-400" />
            <span className="text-xs text-gray-400 font-medium">{sublabel}</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{ background: accentColor }}>
          <Icon size={22} className={iconColor} />
        </div>
      </div>
    </div>
  )
}

const PAGE_SIZE = 5

export default function SupplierManagementPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | Status>('ALL')
  const [page, setPage] = useState(1)

  const [modalAdd, setModalAdd] = useState(false)
  const [editTarget, setEditTarget] = useState<Supplier | null>(null)
  const [detailTarget, setDetailTarget] = useState<Supplier | null>(null)
  const [toggleTarget, setToggleTarget] = useState<Supplier | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [showExportMenu, setShowExportMenu] = useState(false)

  const toast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }

  const filtered = useMemo(() => suppliers.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !q || [s.name, s.code, s.phone, s.email].some(v => v.toLowerCase().includes(q))
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter
    return matchSearch && matchStatus
  }), [suppliers, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const usedCodes = suppliers.map(s => s.code)
  const activeCount = suppliers.filter(s => s.status === 'ACTIVE').length
  const inactiveCount = suppliers.filter(s => s.status === 'INACTIVE').length

  const handleSave = (data: FormData, id?: string) => {
    if (id) {
      setSuppliers(s => s.map(x => x.id === id ? { ...x, ...data } : x))
      toast('Cập nhật nhà cung cấp thành công!')
    } else {
      const newS: Supplier = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString().split('T')[0] }
      setSuppliers(s => [newS, ...s])
      toast('Thêm nhà cung cấp thành công!')
    }
    setModalAdd(false); setEditTarget(null); setDetailTarget(null)
  }

  const handleToggle = () => {
    if (!toggleTarget) return
    setSuppliers(s => s.map(x => x.id === toggleTarget.id ? { ...x, status: x.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : x))
    toast(toggleTarget.status === 'ACTIVE' ? 'Đã ngừng hợp tác!' : 'Đã kích hoạt lại!')
    setToggleTarget(null)
  }

  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handleFilterStatus = (v: 'ALL' | Status) => { setStatusFilter(v); setPage(1) }

  const StatusBadge = ({ status }: { status: Status }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide
      ${status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-400'}`} />
      {status}
    </span>
  )

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <ToastList toasts={toasts} />

      <SupplierModal open={modalAdd || !!editTarget} supplier={editTarget} usedCodes={usedCodes}
        onClose={() => { setModalAdd(false); setEditTarget(null) }} onSave={handleSave} />
      {detailTarget && (
        <DetailModal supplier={detailTarget} onClose={() => setDetailTarget(null)}
          onEdit={() => { setEditTarget(detailTarget); setDetailTarget(null) }} />
      )}
      <ConfirmModal open={!!toggleTarget} supplier={toggleTarget}
        onClose={() => setToggleTarget(null)} onConfirm={handleToggle} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
              <span className="hover:text-gray-600 cursor-pointer">Hệ thống</span>
              <ChevronDown size={12} className="-rotate-90" />
              <span className="text-blue-600 font-semibold">Nhà cung cấp</span>
            </nav>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Quản lý Nhà Cung Cấp</h1>
            <p className="text-sm text-gray-500 mt-1">Theo dõi trạng thái, thông tin liên hệ và hiệu suất cung ứng</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Import — emerald green */}
            <button onClick={() => toast('Tính năng import đang phát triển', 'error')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all">
              <Upload size={15} /> Import
            </button>
            {/* Export */}
            <div className="relative">
              <button onClick={() => setShowExportMenu(v => !v)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                <Download size={15} /> Export <ChevronDown size={13} />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 w-40">
                  {['Excel (.xlsx)', 'PDF (.pdf)'].map(opt => (
                    <button key={opt} onClick={() => { toast(`Đã xuất file ${opt}`); setShowExportMenu(false) }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">{opt}</button>
                  ))}
                </div>
              )}
            </div>
            {/* Add */}
            <button onClick={() => setModalAdd(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all">
              <Plus size={16} /> Thêm nhà cung cấp
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Tổng nhà cung cấp" value={suppliers.length} icon={Users}
            accentColor="#2563eb" bgFrom="#eff6ff" bgTo="#dbeafe"
            borderColor="border-blue-100" iconColor="text-white" sublabel="Tất cả đối tác"
          />
          <StatCard
            label="Đang hoạt động" value={activeCount} icon={CheckCircle2}
            accentColor="#059669" bgFrom="#f0fdf4" bgTo="#dcfce7"
            borderColor="border-emerald-100" iconColor="text-white" sublabel="Đang hợp tác"
          />
          <StatCard
            label="Ngừng hợp tác" value={inactiveCount} icon={UserX}
            accentColor="#e11d48" bgFrom="#fff1f2" bgTo="#ffe4e6"
            borderColor="border-rose-100" iconColor="text-white" sublabel="Đã tạm dừng"
          />
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => handleSearch(e.target.value)}
                placeholder="Tìm theo tên, mã, số điện thoại, email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none transition-all" />
              {search && (
                <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(s => (
                <button key={s} onClick={() => handleFilterStatus(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all whitespace-nowrap
                    ${statusFilter === s
                      ? s === 'ALL' ? 'bg-gray-900 text-white border-gray-900'
                        : s === 'ACTIVE' ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                  {s === 'ALL' ? 'Tất cả' : s === 'ACTIVE' ? 'Hoạt động' : 'Ngừng HT'}
                </button>
              ))}
              {(search || statusFilter !== 'ALL') && (
                <button onClick={() => { handleSearch(''); handleFilterStatus('ALL') }}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 transition-all">
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Nhà cung cấp', 'Mã NCC', 'Liên hệ', 'Địa chỉ', 'Trạng thái', 'Ngày tạo', 'Thao tác'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20">
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                        <Building2 size={28} className="text-blue-300" />
                      </div>
                      <p className="font-semibold text-gray-500 mb-1">
                        {suppliers.length === 0 ? 'Chưa có nhà cung cấp nào' : 'Không tìm thấy kết quả'}
                      </p>
                      <p className="text-xs text-gray-400 mb-4">
                        {suppliers.length === 0 ? 'Nhấn "Thêm nhà cung cấp" để bắt đầu' : 'Thử thay đổi bộ lọc hoặc từ khóa'}
                      </p>
                      {suppliers.length === 0 && (
                        <button onClick={() => setModalAdd(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
                          <Plus size={14} /> Thêm ngay
                        </button>
                      )}
                    </td>
                  </tr>
                ) : paginated.map(s => (
                  <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ backgroundColor: getAvatarColor(s.name) }}>
                          {avatar(s.name)}
                        </div>
                        <div>
                          <button onClick={() => setDetailTarget(s)}
                            className="font-semibold text-gray-900 hover:text-blue-600 text-left leading-tight transition-colors">
                            {s.name}
                          </button>
                          {s.email && <p className="text-xs text-gray-400 mt-0.5">{s.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-mono font-semibold">{s.code}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-700 font-medium">{s.phone || '—'}</p>
                    </td>
                    <td className="px-5 py-4 max-w-[200px]">
                      <p className="text-gray-500 text-xs truncate" title={s.address}>{s.address || '—'}</p>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={s.status} /></td>
                    <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">{fmtDate(s.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDetailTarget(s)} title="Xem chi tiết"
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => setEditTarget(s)} title="Chỉnh sửa"
                          className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setToggleTarget(s)}
                          title={s.status === 'ACTIVE' ? 'Ngừng hợp tác' : 'Kích hoạt lại'}
                          className={`p-2 rounded-lg transition-all ${s.status === 'ACTIVE' ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}>
                          {s.status === 'ACTIVE' ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Hiển thị <span className="font-semibold text-gray-700">{Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> trong tổng số <span className="font-semibold text-gray-700">{filtered.length}</span> nhà cung cấp
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-all">
                  <ChevronsLeft size={15} />
                </button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-all">
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                  .reduce<(number | '...')[]>((acc, n, i, arr) => {
                    if (i > 0 && typeof arr[i - 1] === 'number' && (n as number) - (arr[i - 1] as number) > 1) acc.push('...')
                    acc.push(n); return acc
                  }, [])
                  .map((n, i) => n === '...' ? (
                    <span key={`e${i}`} className="px-2 text-gray-400 text-sm">…</span>
                  ) : (
                    <button key={n} onClick={() => setPage(n as number)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${page === n ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                      {n}
                    </button>
                  ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-all">
                  <ChevronRight size={15} />
                </button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-all">
                  <ChevronsRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}