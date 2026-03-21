'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Clock,
  Users,
  X,
  Plus,
  ChevronRight,
  Refrigerator,
  QrCode,
  Leaf,
  CheckCircle2,
  Circle,
  MessageSquare,
  Image as ImageIcon,
  Wrench,
  Upload,
  Camera,
  ChevronLeft,
  Search,
  Eye,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type Priority = 'urgent' | 'medium' | 'low'
type Status = 'pending' | 'processing' | 'resolved'

interface ProgressStep {
  label: string
  time: string
  author: string
  done: boolean
}

interface Comment {
  avatar: string
  name: string
  content: string
  time: string
}

interface Incident {
  id: string
  title: string
  description: string
  priority: Priority
  status: Status
  timeAgo: string
  count: number
  category: string
  equipment?: { name: string; serial: string }
  images?: string[]
  progress: ProgressStep[]
  comments: Comment[]
}

// ─── Config ───────────────────────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<Priority, { label: string; bg: string; text: string; border: string; dot: string }> = {
  urgent: { label: 'KHẨN CẤP', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  medium: { label: 'TRUNG BÌNH', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
  low:    { label: 'THẤP',      bg: 'bg-blue-50',  text: 'text-blue-700',  border: 'border-blue-200',  dot: 'bg-blue-400' },
}

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string; border: string; dot: string }> = {
  pending:    { label: 'CHỜ XỬ LÝ',    bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400' },
  processing: { label: 'ĐANG XỬ LÝ',   bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500'  },
  resolved:   { label: 'ĐÃ GIẢI QUYẾT',bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-500'},
}

const PRIORITY_ICON: Record<Priority, React.ReactNode> = {
  urgent: <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-5 h-5 text-red-600" /></div>,
  medium: <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0"><QrCode className="w-5 h-5 text-blue-600" /></div>,
  low:    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0"><Leaf className="w-5 h-5 text-green-600" /></div>,
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CONFIG[priority]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold border bg-slate-50 text-slate-600 border-slate-200">
      {category.toUpperCase()}
    </span>
  )
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────
function IncidentDetailModal({ incident, onClose }: { incident: Incident; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full sm:w-[420px] h-full bg-white flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{incident.id}</h2>
            <p className="text-sm text-slate-500">Chi tiết sự cố</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title + badges */}
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-3 leading-snug">{incident.title}</h3>
            <div className="flex flex-wrap gap-2">
              <PriorityBadge priority={incident.priority} />
              <StatusBadge status={incident.status} />
              <CategoryBadge category={incident.category} />
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Mã sự cố', value: incident.id },
              { label: 'Thời gian', value: incident.timeAgo },
              { label: 'Danh mục', value: incident.category },
              { label: 'Số lượng', value: `${incident.count} sự cố` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-sm font-medium text-slate-800">{value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Mô tả chi tiết</p>
            <p className="text-sm text-slate-700 leading-relaxed">{incident.description.replace('...', '')}</p>
          </div>

          {/* Equipment */}
          {incident.equipment && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Thiết bị liên quan</p>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Refrigerator className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{incident.equipment.name}</p>
                  <p className="text-xs text-slate-400">Mã TS: {incident.equipment.serial}</p>
                </div>
              </div>
            </div>
          )}

          {/* Images */}
          {incident.images && incident.images.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Hình ảnh đính kèm ({incident.images.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {incident.images.map((src, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Tiến độ xử lý</p>
            <div className="space-y-0">
              {incident.progress.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-emerald-500' : 'bg-slate-100 border-2 border-slate-200'}`}>
                      {step.done
                        ? <CheckCircle2 className="w-4 h-4 text-white" />
                        : <Circle className="w-3.5 h-3.5 text-slate-300" />}
                    </div>
                    {i < incident.progress.length - 1 && (
                      <div className={`w-0.5 flex-1 my-1 ${step.done ? 'bg-emerald-200' : 'bg-slate-100'}`} style={{ minHeight: 20 }} />
                    )}
                  </div>
                  <div className="pb-4 min-w-0">
                    <p className={`text-sm font-semibold ${step.done ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                    {(step.time || step.author) && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {step.time}{step.time && step.author ? ' · ' : ''}{step.author}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Thảo luận</p>
            {incident.comments.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-slate-300">
                <MessageSquare className="w-8 h-8 mb-2" />
                <p className="text-sm">Chưa có bình luận</p>
              </div>
            ) : (
              <div className="space-y-3 mb-3">
                {incident.comments.map((c, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {c.avatar}
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.time}</p>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Comment input */}
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">NV</div>
              <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <input type="text" placeholder="Thêm bình luận..." className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400" />
                <button className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        {incident.status !== 'resolved' && (
          <div className="px-6 py-4 border-t border-slate-100">
            <div className="flex gap-2">
              {incident.status === 'pending' && (
                <button className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
                  Bắt đầu xử lý
                </button>
              )}
              <button className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
                Đánh dấu hoàn thành
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Create Modal ──────────────────────────────────────────────────────────────
function CreateIncidentModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: Partial<Incident>) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [category, setCategory] = useState('Cơ sở vật chất')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onCreate({ title, description, priority, category })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Tạo báo cáo sự cố</h2>
            <p className="text-sm text-slate-500">Điền đầy đủ thông tin bên dưới</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Tiêu đề sự cố <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Mô tả ngắn gọn sự cố..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Priority + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Mức ưu tiên</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="urgent">🔴 Khẩn cấp</option>
                <option value="medium">🟡 Trung bình</option>
                <option value="low">🔵 Thấp</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Danh mục</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option>Cơ sở vật chất</option>
                <option>Thiết bị</option>
                <option>An toàn</option>
                <option>Nhân sự</option>
                <option>Khách hàng</option>
                <option>Khác</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Mô tả chi tiết</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Mô tả đầy đủ tình huống, vị trí xảy ra sự cố..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Hình ảnh đính kèm</label>
            <div className="flex gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 cursor-pointer transition-colors bg-slate-50 hover:bg-emerald-50">
                <Upload className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">Tải ảnh lên</span>
                <input type="file" accept="image/*" multiple className="hidden" />
              </label>
              <button type="button" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 transition-colors bg-slate-50 hover:bg-emerald-50">
                <Camera className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">Chụp ảnh</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Huỷ bỏ
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
              Tạo báo cáo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Filter tabs ───────────────────────────────────────────────────────────────
const FILTER_TABS: { key: Status | 'all'; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xử lý' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'resolved', label: 'Đã giải quyết' },
]

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CashierIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [activeFilter, setActiveFilter] = useState<Status | 'all'>('all')
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 5

  const filtered = incidents.filter(i => {
    if (activeFilter !== 'all' && i.status !== activeFilter) return false
    if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !i.id.toLowerCase().includes(search.toLowerCase())) return false
    if (priorityFilter && i.priority !== priorityFilter) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const stats = {
    total: incidents.length,
    pending: incidents.filter(i => i.status === 'pending').length,
    processing: incidents.filter(i => i.status === 'processing').length,
    resolved: incidents.filter(i => i.status === 'resolved').length,
  }

  const clearFilters = () => {
    setSearch(''); setPriorityFilter(''); setDateFrom(''); setDateTo(''); setActiveFilter('all'); setPage(1)
  }

  const handleCreate = (data: Partial<Incident>) => {
    const newIncident: Incident = {
      id: `ISS-${String(Math.floor(Math.random() * 90000) + 10000)}`,
      title: data.title ?? '',
      description: data.description ?? '',
      priority: data.priority ?? 'medium',
      status: 'pending',
      timeAgo: 'Vừa xong',
      count: 1,
      category: data.category ?? 'Khác',
      images: [],
      progress: [
        { label: 'Đã tiếp nhận báo cáo', time: new Date().toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' }), author: 'Hệ thống tự động', done: true },
        { label: 'Đang chờ phân công xử lý', time: '', author: '', done: false },
      ],
      comments: [],
    }
    setIncidents(prev => [newIncident, ...prev])
    setPage(1)
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Modals */}
      {selectedIncident && <IncidentDetailModal incident={selectedIncident} onClose={() => setSelectedIncident(null)} />}
      {showCreate && <CreateIncidentModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-slate-400 mb-1">Cửa hàng &gt; Báo cáo sự cố</p>
          <h1 className="text-2xl font-bold text-slate-800">Báo cáo sự cố</h1>
          <p className="text-sm text-slate-400 mt-0.5">Quản lý và theo dõi các vấn đề tại cửa hàng</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
        >
          <Plus size={16} />
          Tạo báo cáo mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Tổng sự cố', value: stats.total, color: 'text-slate-700', bg: 'bg-white', border: 'border-slate-200' },
          { label: 'Chờ xử lý',  value: stats.pending,    color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
          { label: 'Đang xử lý', value: stats.processing,  color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200'    },
          { label: 'Hoàn thành', value: stats.resolved,    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          {/* Search */}
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Tìm theo tiêu đề / mã sự cố</p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="VD: ISS-00241, Tủ đông..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Mức ưu tiên</p>
            <select
              value={priorityFilter}
              onChange={e => { setPriorityFilter(e.target.value); setPage(1) }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Tất cả</option>
              <option value="urgent">Khẩn cấp</option>
              <option value="medium">Trung bình</option>
              <option value="low">Thấp</option>
            </select>
          </div>

          {/* Status tab as select */}
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Trạng thái</p>
            <select
              value={activeFilter}
              onChange={e => { setActiveFilter(e.target.value as Status | 'all'); setPage(1) }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="processing">Đang xử lý</option>
              <option value="resolved">Đã giải quyết</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          {/* Date range */}
          <div className="md:col-span-2">
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Mã sự cố</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tiêu đề</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Danh mục</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Ưu tiên</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Thời gian</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide"></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center text-slate-300">
                    <AlertTriangle className="w-10 h-10 mb-3" />
                    <p className="text-sm font-medium text-slate-400">Không có sự cố nào</p>
                    <p className="text-xs text-slate-300 mt-1">Nhấn "Tạo báo cáo mới" để thêm sự cố</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map(incident => (
                <tr key={incident.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <span className="font-mono text-xs font-semibold text-slate-600 whitespace-nowrap">{incident.id}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {PRIORITY_ICON[incident.priority]}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 leading-snug truncate max-w-[200px]">{incident.title}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[200px]">{incident.description.slice(0, 50)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <CategoryBadge category={incident.category} />
                  </td>
                  <td className="px-4 py-4">
                    <PriorityBadge priority={incident.priority} />
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={incident.status} />
                  </td>
                  <td className="px-4 py-4">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
                      <Clock size={12} />
                      {incident.timeAgo}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => setSelectedIncident(incident)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <Eye size={12} />
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {filtered.length === 0
              ? 'Không có sự cố nào'
              : `Hiện ${(page - 1) * PAGE_SIZE + 1} - ${Math.min(page * PAGE_SIZE, filtered.length)} của ${filtered.length} sự cố`}
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
                  page === p ? 'bg-emerald-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
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