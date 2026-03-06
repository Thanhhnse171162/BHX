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

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'ISS-00241',
    title: 'Tủ đông khu vực sữa hỏng',
    description:
      'Tủ đông số 02 tại khu vực sữa tươi và sữa chua bị chảy nước từ dưới gầm. Nhiệt độ hiện thị trên bảng điều khiển đang tăng nhanh, hiện tại là 15 độ C...',
    priority: 'urgent',
    status: 'pending',
    timeAgo: '15 phút trước',
    count: 3,
    category: 'Cơ sở vật chất',
    equipment: { name: 'Tủ đông Sanaky 500L', serial: 'EQ-SNK-02' },
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=160&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=160&fit=crop',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=200&h=160&fit=crop',
    ],
    progress: [
      { label: 'Đã tiếp nhận báo cáo', time: '10:15', author: 'Hệ thống tự động', done: true },
      { label: 'Đang điều phối kỹ thuật', time: 'Chưa xác định thời gian', author: '', done: false },
      { label: 'Kỹ thuật viên đến hiện trường', time: '', author: '', done: false },
      { label: 'Hoàn thành xử lý', time: '', author: '', done: false },
    ],
    comments: [
      {
        avatar: 'QL',
        name: 'Quản lý Cửa hàng',
        content: 'Đã gọi thợ sửa chữa bên ngoài, họ sẽ đến trong 30p tới. Em gom hàng nhạy cảm sang tủ dự phòng đi.',
        time: '10:22',
      },
    ],
  },
  {
    id: 'ISS-00240',
    title: 'Máy quét quầy 4 lỗi QR',
    description: 'Không quét được mã MoMo và VNPay cho khách hàng từ sáng nay...',
    priority: 'medium',
    status: 'processing',
    timeAgo: '2 giờ trước',
    count: 1,
    category: 'Thiết bị',
    equipment: { name: 'Máy quét Zebra DS2208', serial: 'EQ-ZBR-04' },
    images: [],
    progress: [
      { label: 'Đã tiếp nhận báo cáo', time: '08:00', author: 'Hệ thống tự động', done: true },
      { label: 'Đang điều phối kỹ thuật', time: '08:15', author: 'IT Support', done: true },
      { label: 'Kỹ thuật viên đến hiện trường', time: 'Đang đến...', author: '', done: false },
    ],
    comments: [],
  },
  {
    id: 'ISS-00238',
    title: 'Đổ vỡ tại dãy A3',
    description: 'Khách làm rơi 2 chai dầu ăn gây trơn trượt khu vực gia vị.',
    priority: 'low',
    status: 'resolved',
    timeAgo: 'Hôm qua',
    count: 1,
    category: 'An toàn',
    equipment: undefined,
    images: [],
    progress: [
      { label: 'Đã tiếp nhận báo cáo', time: '14:30', author: 'Hệ thống tự động', done: true },
      { label: 'Nhân viên vệ sinh xử lý', time: '14:45', author: 'Nguyễn Thị B', done: true },
      { label: 'Hoàn thành xử lý', time: '15:00', author: 'Quản lý cửa hàng', done: true },
    ],
    comments: [
      { avatar: 'NV', name: 'Nhân viên Vệ sinh', content: 'Đã lau sạch và đặt biển cảnh báo.', time: '14:50' },
    ],
  },
]

// ─── Badge helpers ─────────────────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  urgent: { label: 'KHẨN CẤP', className: 'bg-red-100 text-red-700 border border-red-200' },
  medium: { label: 'TRUNG BÌNH', className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  low: { label: 'THẤP', className: 'bg-blue-100 text-blue-700 border border-blue-200' },
}

const STATUS_CONFIG: Record<Status, { label: string; className: string; dotColor: string }> = {
  pending: { label: 'CHỜ XỬ LÝ', className: 'bg-amber-50 text-amber-700 border border-amber-200', dotColor: 'bg-amber-400' },
  processing: { label: 'ĐANG XỬ LÝ', className: 'bg-blue-50 text-blue-700 border border-blue-200', dotColor: 'bg-blue-500' },
  resolved: { label: 'ĐÃ GIẢI QUYẾT', className: 'bg-green-50 text-green-700 border border-green-200', dotColor: 'bg-green-500' },
}

const PRIORITY_ICON: Record<Priority, React.ReactNode> = {
  urgent: (
    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
      <AlertTriangle className="w-6 h-6 text-red-600" />
    </div>
  ),
  medium: (
    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
      <QrCode className="w-6 h-6 text-blue-600" />
    </div>
  ),
  low: (
    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
      <Leaf className="w-6 h-6 text-green-600" />
    </div>
  ),
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CONFIG[priority]
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${cfg.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
      {cfg.label}
    </span>
  )
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────
function IncidentDetailModal({ incident, onClose }: { incident: Incident; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full sm:w-[420px] h-[92vh] sm:h-full sm:max-h-screen bg-white flex flex-col rounded-t-2xl sm:rounded-l-2xl sm:rounded-r-none shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Chi tiết sự cố</span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Title block */}
          <div>
            <p className="text-xs font-mono text-gray-400 mb-1">{incident.id}</p>
            <h2 className="text-lg font-bold text-gray-900 leading-snug mb-3">{incident.title}</h2>
            <div className="flex flex-wrap gap-2">
              <PriorityBadge priority={incident.priority} />
              <StatusBadge status={incident.status} />
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-gray-100 text-gray-600 border border-gray-200">
                {incident.category.toUpperCase()}
              </span>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Description */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Mô tả chi tiết</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {incident.description.replace('...', '')}
              {incident.id === 'ISS-00241' &&
                ' Tủ đông số 02 tại khu vực sữa tươi và sữa chua bị chảy nước từ dưới gầm. Nhiệt độ hiện thị trên bảng điều khiển đang tăng nhanh, hiện tại là 15 độ C. Có nguy cơ hỏng hàng loạt sản phẩm nếu không xử lý kịp thời.'}
            </p>
          </div>

          {/* Equipment */}
          {incident.equipment && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Thiết bị liên quan</p>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Refrigerator className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{incident.equipment.name}</p>
                  <p className="text-xs text-gray-400">Mã TS: {incident.equipment.serial}</p>
                </div>
              </div>
            </div>
          )}

          {/* Images */}
          {incident.images && incident.images.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Hình ảnh đính kèm ({incident.images.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {incident.images.map((src, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Tiến độ xử lý</p>
            <div className="space-y-0">
              {incident.progress.map((step, i) => (
                <div key={i} className="flex gap-3">
                  {/* Connector */}
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-green-500' : 'bg-gray-100 border-2 border-gray-200'}`}>
                      {step.done ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-gray-300" />
                      )}
                    </div>
                    {i < incident.progress.length - 1 && (
                      <div className={`w-0.5 flex-1 my-1 ${step.done ? 'bg-green-200' : 'bg-gray-100'}`} style={{ minHeight: 20 }} />
                    )}
                  </div>
                  {/* Content */}
                  <div className="pb-4 min-w-0">
                    <p className={`text-sm font-semibold ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                    {(step.time || step.author) && (
                      <p className="text-xs text-gray-400 mt-0.5">
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
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Thảo luận</p>
            {incident.comments.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-gray-300">
                <MessageSquare className="w-8 h-8 mb-2" />
                <p className="text-sm">Chưa có bình luận</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incident.comments.map((c, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {c.avatar}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.time}</p>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comment input */}
            <div className="flex gap-2 mt-3">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                NV
              </div>
              <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <input
                  type="text"
                  placeholder="Thêm bình luận..."
                  className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
                />
                <button className="w-7 h-7 rounded-lg bg-green-600 hover:bg-green-700 flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        {incident.status !== 'resolved' && (
          <div className="px-5 py-4 border-t border-gray-100 bg-white">
            <div className="flex gap-2">
              {incident.status === 'pending' && (
                <button className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
                  Bắt đầu xử lý
                </button>
              )}
              <button className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors">
                Đánh dấu hoàn thành
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Create Incident Modal ─────────────────────────────────────────────────────
function CreateIncidentModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: Partial<Incident>) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [category, setCategory] = useState('Cơ sở vật chất')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onCreate({
      title,
      description,
      priority,
      category,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Tạo báo cáo sự cố</h3>
              <p className="text-xs text-gray-400">Điền đầy đủ thông tin bên dưới</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Tiêu đề sự cố <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mô tả ngắn gọn sự cố..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 transition"
              required
            />
          </div>

          {/* Priority + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mức ưu tiên</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 transition"
              >
                <option value="urgent">🔴 Khẩn cấp</option>
                <option value="medium">🟡 Trung bình</option>
                <option value="low">🔵 Thấp</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Danh mục</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 transition"
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
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mô tả chi tiết</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả đầy đủ tình huống, vị trí xảy ra sự cố..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 transition resize-none"
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Hình ảnh đính kèm</label>
            <div className="flex gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-green-400 cursor-pointer transition-colors bg-gray-50 hover:bg-green-50">
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Tải ảnh lên</span>
                <input type="file" accept="image/*" multiple className="hidden" />
              </label>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-green-400 transition-colors bg-gray-50 hover:bg-green-50"
              >
                <Camera className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Chụp ảnh</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-green-200"
            >
              Tạo báo cáo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Incident Card ─────────────────────────────────────────────────────────────
function IncidentCard({ incident, onClick }: { incident: Incident; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200 group"
    >
      <div className="flex items-start gap-4">
        {PRIORITY_ICON[incident.priority]}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-gray-400">{incident.id}</span>
              {incident.priority === 'urgent' && <PriorityBadge priority={incident.priority} />}
            </div>
          </div>

          <h3 className="text-base font-bold text-gray-900 mb-1.5 leading-snug">{incident.title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">{incident.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                {incident.timeAgo}
              </span>
              {incident.comments.length > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {incident.comments.length}
                </span>
              )}
            </div>
            <StatusBadge status={incident.status} />
          </div>
        </div>
      </div>
    </button>
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
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [activeFilter, setActiveFilter] = useState<Status | 'all'>('all')

  const filtered = activeFilter === 'all' ? incidents : incidents.filter((i) => i.status === activeFilter)

  const stats = {
    total: incidents.length,
    pending: incidents.filter((i) => i.status === 'pending').length,
    processing: incidents.filter((i) => i.status === 'processing').length,
    resolved: incidents.filter((i) => i.status === 'resolved').length,
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
    setIncidents((prev) => [newIncident, ...prev])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 pl-5 pr-4 pt-5 pb-0 sticky top-0 z-20 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-base font-bold text-gray-900">Báo cáo sự cố</h1>
            <p className="text-xs text-gray-400 mt-0.5">Quản lý và theo dõi các vấn đề tại cửa hàng</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-green-200 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Tạo báo cáo mới
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Tổng', value: stats.total, color: 'text-gray-700', bg: 'bg-gray-50' },
            { label: 'Chờ xử lý', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Đang xử lý', value: stats.processing, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Hoàn thành', value: stats.resolved, color: 'text-green-600', bg: 'bg-green-50' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-2 text-center`}>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeFilter === tab.key
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      <div className="pl-5 pr-4 py-4 flex flex-col items-start gap-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-300">
            <AlertTriangle className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">Không có sự cố nào</p>
          </div>
        ) : (
          filtered.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              onClick={() => setSelectedIncident(incident)}
            />
          ))
        )}
      </div>

      {/* ── Modals ── */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
      {showCreate && (
        <CreateIncidentModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
