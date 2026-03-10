'use client'

import { useState, useMemo } from 'react'
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
  MessageSquare,
  Wrench,
  Plus,
  ChevronRight,
  X,
  Search,
  Filter,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type Priority = 'urgent' | 'medium' | 'low'
type IncidentStatus = 'pending' | 'processing' | 'resolved'

interface ProgressStep {
  label: string
  time: string
  author: string
  done: boolean
}

interface Incident {
  id: string
  title: string
  description: string
  priority: Priority
  status: IncidentStatus
  timeAgo: string
  category: string
  reporter: string
  progress: ProgressStep[]
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'ISS-0241',
    title: 'Tủ đông khu vực sữa hỏng',
    description: 'Tủ đông số 02 tại khu sữa tươi bị chảy nước từ dưới gầm. Nhiệt độ tăng lên 15°C, nguy cơ hỏng hàng cao.',
    priority: 'urgent', status: 'pending', timeAgo: '15 phút trước',
    category: 'Cơ sở vật chất', reporter: 'Trần Thu Hà',
    progress: [
      { label: 'Đã tiếp nhận báo cáo', time: '10:15', author: 'Hệ thống', done: true },
      { label: 'Đang điều phối kỹ thuật', time: '', author: '', done: false },
      { label: 'Kỹ thuật viên đến hiện trường', time: '', author: '', done: false },
      { label: 'Hoàn thành xử lý', time: '', author: '', done: false },
    ],
  },
  {
    id: 'ISS-0240',
    title: 'Máy quét mã vạch quầy 3 lỗi',
    description: 'Máy quét tại quầy thanh toán số 3 không nhận diện được mã vạch sản phẩm Pepsi và Vinamilk. Cần hỗ trợ IT.',
    priority: 'medium', status: 'processing', timeAgo: '1 giờ trước',
    category: 'Thiết bị', reporter: 'Lê Quang Huy',
    progress: [
      { label: 'Đã tiếp nhận báo cáo', time: '09:30', author: 'Hệ thống', done: true },
      { label: 'Đang xử lý', time: '09:45', author: 'IT Support', done: true },
      { label: 'Hoàn thành', time: '', author: '', done: false },
    ],
  },
  {
    id: 'ISS-0239',
    title: 'Hết bao bì khu thanh toán',
    description: 'Túi đựng đồ tại khu vực thanh toán đã hết, cần bổ sung ngay.',
    priority: 'low', status: 'processing', timeAgo: '2 giờ trước',
    category: 'Vật tư', reporter: 'Nguyễn Minh Tuấn',
    progress: [
      { label: 'Đã tiếp nhận', time: '08:45', author: 'Hệ thống', done: true },
      { label: 'Đã thông báo kho', time: '09:00', author: 'Store Manager', done: true },
      { label: 'Đã bổ sung', time: '', author: '', done: false },
    ],
  },
  {
    id: 'ISS-0238',
    title: 'Sản phẩm gạo ST25 nhập sai số lượng',
    description: 'Phiếu nhập ghi 200 túi nhưng thực tế chỉ có 185 túi. Cần kiểm tra lại với bên cung ứng.',
    priority: 'medium', status: 'resolved', timeAgo: '1 ngày trước',
    category: 'Nhập hàng', reporter: 'Phạm Lan Anh',
    progress: [
      { label: 'Đã tiếp nhận', time: '09/03 08:00', author: 'Hệ thống', done: true },
      { label: 'Đã liên hệ nhà cung cấp', time: '09/03 09:30', author: 'Store Manager', done: true },
      { label: 'Đã xác nhận và điều chỉnh', time: '09/03 14:00', author: 'Phạm Lan Anh', done: true },
    ],
  },
  {
    id: 'ISS-0237',
    title: 'Điều hòa khu rau củ quả bị yếu',
    description: 'Nhiệt độ khu rau củ tăng cao hơn bình thường, nhiều mặt hàng có nguy cơ héo úa nhanh.',
    priority: 'urgent', status: 'resolved', timeAgo: '2 ngày trước',
    category: 'Cơ sở vật chất', reporter: 'Võ Thị Mai',
    progress: [
      { label: 'Đã tiếp nhận', time: '08/03 10:00', author: 'Hệ thống', done: true },
      { label: 'Kỹ thuật viên kiểm tra', time: '08/03 11:00', author: 'Kỹ thuật', done: true },
      { label: 'Đã sửa xong', time: '08/03 14:30', author: 'Kỹ thuật', done: true },
    ],
  },
]

const priorityConfig: Record<Priority, { label: string; cls: string; dot: string }> = {
  urgent: { label: 'Khẩn cấp',  cls: 'bg-red-100 text-red-700',    dot: 'bg-red-500' },
  medium: { label: 'Trung bình', cls: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  low:    { label: 'Thấp',       cls: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
}

const statusConfig: Record<IncidentStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  pending:    { label: 'Chờ xử lý', cls: 'bg-red-50 text-red-600',   icon: <Clock size={12} /> },
  processing: { label: 'Đang xử lý', cls: 'bg-blue-50 text-blue-700', icon: <Wrench size={12} /> },
  resolved:   { label: 'Đã giải quyết', cls: 'bg-green-50 text-green-700', icon: <CheckCircle2 size={12} /> },
}

// ─── Incident card ────────────────────────────────────────────────────────────
function IncidentCard({ incident, onClick }: { incident: Incident; onClick: () => void }) {
  const pc = priorityConfig[incident.priority]
  const sc = statusConfig[incident.status]
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-green-100 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-[11px] text-gray-400">{incident.id}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${pc.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
              {pc.label}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.cls}`}>
              {sc.icon} {sc.label}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 text-[14px] truncate">{incident.title}</h3>
          <p className="text-[12px] text-gray-500 mt-1 line-clamp-2">{incident.description}</p>
        </div>
        <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1" />
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-400">
        <span className="flex items-center gap-1"><Clock size={11} />{incident.timeAgo}</span>
        <span>Báo cáo: {incident.reporter}</span>
        <span className="ml-auto bg-gray-50 px-2 py-0.5 rounded-full">{incident.category}</span>
      </div>
    </div>
  )
}

// ─── Detail modal ─────────────────────────────────────────────────────────────
function IncidentDetailModal({ incident, onClose }: { incident: Incident; onClose: () => void }) {
  const pc = priorityConfig[incident.priority]
  const sc = statusConfig[incident.status]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="text-[15px] font-bold text-gray-900">Chi tiết sự cố</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><X size={18} className="text-gray-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-mono text-[12px] text-gray-400 font-semibold">{incident.id}</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${pc.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />{pc.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.cls}`}>
                {sc.icon} {sc.label}
              </span>
            </div>
            <h2 className="text-[16px] font-bold text-gray-900">{incident.title}</h2>
            <p className="text-[13px] text-gray-600 mt-2">{incident.description}</p>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 mb-0.5">Danh mục</p>
              <p className="font-semibold text-gray-700">{incident.category}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 mb-0.5">Người báo cáo</p>
              <p className="font-semibold text-gray-700">{incident.reporter}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 col-span-2">
              <p className="text-gray-400 mb-0.5">Thời gian</p>
              <p className="font-semibold text-gray-700">{incident.timeAgo}</p>
            </div>
          </div>

          {/* Progress */}
          <div>
            <h4 className="text-[13px] font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MessageSquare size={14} className="text-green-500" />
              Tiến trình xử lý
            </h4>
            <div className="space-y-3">
              {incident.progress.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${step.done ? 'bg-green-500' : 'bg-gray-100'}`}>
                    {step.done ? <CheckCircle2 size={12} className="text-white" /> : <Circle size={12} className="text-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-[13px] font-medium ${step.done ? 'text-gray-800' : 'text-gray-400'}`}>{step.label}</p>
                    {step.time && <p className="text-[11px] text-gray-400">{step.time}{step.author && ` · ${step.author}`}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[13px] transition-colors">Đóng</button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function IncidentsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả')
  const [priorityFilter, setPriorityFilter] = useState<string>('Tất cả')
  const [selected, setSelected] = useState<Incident | null>(null)

  const filtered = useMemo(() => {
    let list = MOCK_INCIDENTS
    if (statusFilter !== 'Tất cả') {
      const key = { 'Chờ xử lý': 'pending', 'Đang xử lý': 'processing', 'Đã giải quyết': 'resolved' }[statusFilter]
      if (key) list = list.filter((i) => i.status === key)
    }
    if (priorityFilter !== 'Tất cả') {
      const key = { 'Khẩn cấp': 'urgent', 'Trung bình': 'medium', 'Thấp': 'low' }[priorityFilter]
      if (key) list = list.filter((i) => i.priority === key)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((i) => i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
    }
    return list
  }, [search, statusFilter, priorityFilter])

  const counts = useMemo(() => ({
    pending:    MOCK_INCIDENTS.filter((i) => i.status === 'pending').length,
    processing: MOCK_INCIDENTS.filter((i) => i.status === 'processing').length,
    resolved:   MOCK_INCIDENTS.filter((i) => i.status === 'resolved').length,
  }), [])

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" />
            Quản lý sự cố
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Theo dõi và xử lý các sự cố tại cửa hàng</p>
        </div>
        <button className="flex items-center gap-2 text-[13px] font-semibold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl transition-colors">
          <Plus size={15} />
          Báo cáo sự cố
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Chờ xử lý', value: counts.pending,    cls: 'text-red-600',   bg: 'bg-red-50',   icon: <Clock size={18} className="text-red-400" /> },
          { label: 'Đang xử lý', value: counts.processing, cls: 'text-blue-700',  bg: 'bg-blue-50',  icon: <Wrench size={18} className="text-blue-400" /> },
          { label: 'Đã giải quyết', value: counts.resolved, cls: 'text-green-700', bg: 'bg-green-50', icon: <CheckCircle2 size={18} className="text-green-500" /> },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border border-gray-100 p-4 shadow-sm ${s.bg}`}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-gray-500 uppercase tracking-wide">{s.label}</p>
              {s.icon}
            </div>
            <p className={`text-2xl font-bold mt-2 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tiêu đề, mã sự cố..."
            className="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-400 focus:bg-white transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-gray-400 flex items-center gap-1"><Filter size={11} /></span>
          {['Tất cả', 'Chờ xử lý', 'Đang xử lý', 'Đã giải quyết'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${statusFilter === s ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {['Tất cả', 'Khẩn cấp', 'Trung bình', 'Thấp'].map((p) => (
            <button key={p} onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${priorityFilter === p ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
            <AlertTriangle size={32} className="mx-auto mb-3 opacity-30" />
            <p>Không có sự cố nào</p>
          </div>
        ) : (
          filtered.map((inc) => <IncidentCard key={inc.id} incident={inc} onClick={() => setSelected(inc)} />)
        )}
      </div>

      {selected && <IncidentDetailModal incident={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
