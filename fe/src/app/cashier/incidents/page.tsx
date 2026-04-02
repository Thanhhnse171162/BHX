'use client'

import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Clock,
  X,
  Plus,
  ChevronRight,
  Refrigerator,
  QrCode,
  Leaf,
  CheckCircle2,
  Circle,
  Upload,
  ChevronLeft,
  Search,
  Eye,
} from 'lucide-react'
import { ProductAPIService, ProductFromAPI } from '@/services/product-api.service'
import { DamageReportAPIService, DamageReportFromAPI } from '@/services/damage-report-api.service'
import { WarehouseLookupAPIService } from '@/services/warehouse-lookup-api.service'
import { useAuthStore } from '@/store/auth.store'

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

interface CreateIncidentPayload {
  productId: string
  damageType: string
  reportedDate: string
  quality: number
  description: string
  photos: File[]
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

        </div>
      </div>
    </div>
  )
}

// ─── Create Modal ──────────────────────────────────────────────────────────────
function CreateIncidentModal({
  onClose,
  onCreate,
  products,
  locationType,
  locationId,
  locationName,
}: {
  onClose: () => void
  onCreate: (data: CreateIncidentPayload) => Promise<void>
  products: ProductFromAPI[]
  locationType: 'STORE' | 'WAREHOUSE'
  locationId: string
  locationName: string
}) {
  const [productId, setProductId] = useState('')
  const [damageType, setDamageType] = useState('')
  const [reportedDate, setReportedDate] = useState(new Date().toISOString().slice(0, 16))
  const [quality, setQuality] = useState('1')
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')

    if (!productId || !damageType.trim() || !reportedDate || !description.trim()) {
      setSubmitError('Vui lòng nhập đầy đủ các trường bắt buộc.')
      return
    }

    const parsedQuality = Number(quality)
    if (!Number.isFinite(parsedQuality) || parsedQuality <= 0) {
      setSubmitError('Số lượng phải lớn hơn 0.')
      return
    }

    try {
      setSubmitting(true)
      await onCreate({
        productId,
        damageType: damageType.trim(),
        reportedDate: new Date(reportedDate).toISOString(),
        quality: parsedQuality,
        description: description.trim(),
        photos,
      })
      onClose()
    } catch (error: any) {
      setSubmitError(error?.message || 'Không thể tạo báo cáo sự cố.')
    } finally {
      setSubmitting(false)
    }
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
          {/* Product */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Sản phẩm <span className="text-red-500">*</span></label>
            <select
              value={productId}
              onChange={e => setProductId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">Chọn sản phẩm</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Damage type + quality */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">DamageType <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={damageType}
                onChange={e => setDamageType(e.target.value)}
                placeholder="VD: hư hại"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Quality <span className="text-red-500">*</span></label>
              <input
                type="number"
                min={1}
                value={quality}
                onChange={e => setQuality(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">ReportedDate <span className="text-red-500">*</span></label>
            <input
              type="datetime-local"
              value={reportedDate}
              onChange={e => setReportedDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">LocationType</label>
              <input
                type="text"
                value={locationType}
                readOnly
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Địa điểm</label>
              <input
                type="text"
                value={locationName || 'Không xác định'}
                readOnly
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Description <span className="text-red-500">*</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Mô tả đầy đủ tình huống sự cố..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              required
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Photos</label>
            
            {/* Image previews with delete buttons */}
            {photos.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-2">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Preview ${idx}`}
                      className="w-full h-24 object-cover rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) {
                            const newPhotos = [...photos]
                            newPhotos[idx] = file
                            setPhotos(newPhotos)
                          }
                        }
                        input.click()
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="text-white text-xs font-medium">Xoá & Chọn lại</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2 items-center">
              <label className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 cursor-pointer transition-colors bg-slate-50 hover:bg-emerald-50">
                <Upload className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">Tải ảnh lên</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => setPhotos([...photos, ...Array.from(e.target.files || [])])}
                />
              </label>
              <span className="text-xs text-slate-500 whitespace-nowrap">{photos.length} ảnh</span>
            </div>
          </div>

          {submitError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{submitError}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Huỷ bỏ
            </button>
            <button
              type="submit"
              disabled={submitting || !locationId}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {submitting ? 'Đang gửi...' : 'Tạo báo cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function mapApiStatusToLocal(status?: string): Status {
  const normalized = (status || '').toUpperCase()
  if (normalized === 'PROCESSING') return 'processing'
  if (normalized === 'COMPLETED' || normalized === 'APPROVED' || normalized === 'RESOLVED') return 'resolved'
  return 'pending'
}

function mapQualityToPriority(quality?: number): Priority {
  const normalizedQuality = Number(quality || 0)
  if (normalizedQuality >= 8) return 'urgent'
  if (normalizedQuality >= 5) return 'medium'
  return 'low'
}

function buildIncidentFromDamageReport(report: DamageReportFromAPI, products: ProductFromAPI[]): Incident {
  const safeProductId = String(report.productId || '').toLowerCase()
  const matchedProduct = products.find((item) => item.id.toLowerCase() === safeProductId)
  const safeDamageType = (report.damageType || 'Sự cố').trim()
  const safeDescription = (report.description || '').trim()
  const safeStatus = report.status || 'PENDING'
  const safeQuality = Number(report.quality || 0)
  const safeReportedDate = report.reportedDate || report.createdAt || new Date().toISOString()
  const safeCreatedAt = report.createdAt || new Date().toISOString()
  const safeReportNumber = report.reportNumber || report.id || `DMG-${Date.now()}`
  const safePhotos = Array.isArray(report.photos) ? report.photos : []
  const incidentTitle = matchedProduct ? `${safeDamageType} - ${matchedProduct.name}` : safeDamageType

  return {
    id: safeReportNumber,
    title: incidentTitle,
    description: safeDescription,
    priority: mapQualityToPriority(safeQuality),
    status: mapApiStatusToLocal(safeStatus),
    timeAgo: new Date(safeReportedDate).toLocaleString('vi-VN'),
    count: safeQuality,
    category: safeDamageType,
    images: safePhotos,
    progress: [
      {
        label: 'Đã tiếp nhận báo cáo',
        time: new Date(safeCreatedAt).toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' }),
        author: 'Hệ thống tự động',
        done: true,
      },
      {
        label: (() => {
          const status = safeStatus.toUpperCase()
          if (status === 'PENDING') return 'Đang chờ phân công xử lý'
          if (status === 'APPROVED' || status === 'COMPLETED' || status === 'RESOLVED') return 'Đã duyệt'
          return 'Đang xử lý'
        })(),
        time: '',
        author: '',
        done: safeStatus.toUpperCase() !== 'PENDING',
      },
    ],
    comments: [],
  }
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CashierIncidentsPage() {
  const { user } = useAuthStore()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [products, setProducts] = useState<ProductFromAPI[]>([])
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [activeFilter, setActiveFilter] = useState<Status | 'all'>('all')
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [loadError, setLoadError] = useState('')
  const [locationName, setLocationName] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 5

  const locationType: 'STORE' | 'WAREHOUSE' = user?.workplaceType === 'WAREHOUSE' ? 'WAREHOUSE' : 'STORE'
  const locationId = user?.workplaceId?.trim() || ''

  useEffect(() => {
    let cancelled = false

    if (!locationId) {
      setLocationName('')
      return
    }

    WarehouseLookupAPIService.getById(locationId)
      .then((location) => {
        if (!cancelled) {
          setLocationName(location?.name || locationId)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLocationName(locationId)
        }
      })

    return () => {
      cancelled = true
    }
  }, [locationId])

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [productRows, damageReports] = await Promise.all([
          ProductAPIService.getAllProducts(),
          DamageReportAPIService.getDamageReports({
            locationId,
            locationType,
          }).catch(() => []),
        ])

        setProducts(productRows)

        if (locationId) {
          setIncidents(damageReports.map((report) => buildIncidentFromDamageReport(report, productRows)))
        }
      } catch {
        setLoadError('Không thể tải dữ liệu báo cáo sự cố.')
      }
    }

    loadInitialData()
  }, [locationId, locationType])

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

  const handleCreate = async (payload: CreateIncidentPayload) => {
    if (!locationId) {
      throw new Error('Không tìm thấy workplace_id của user đăng nhập.')
    }

    const createdReport = await DamageReportAPIService.createDamageReport({
      locationType,
      locationId,
      productId: payload.productId,
      damageType: payload.damageType,
      reportedDate: payload.reportedDate,
      quality: payload.quality,
      description: payload.description,
      photos: payload.photos,
    })

    const newIncident = buildIncidentFromDamageReport(createdReport, products)
    setIncidents((prev) => [newIncident, ...prev])
    setPage(1)
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Modals */}
      {selectedIncident && <IncidentDetailModal incident={selectedIncident} onClose={() => setSelectedIncident(null)} />}
      {showCreate && (
        <CreateIncidentModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
          products={products}
          locationType={locationType}
          locationId={locationId}
          locationName={locationName}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-slate-400 mb-1">Cửa hàng &gt; Báo cáo sự cố</p>
          <h1 className="text-2xl font-bold text-slate-800">Báo cáo sự cố</h1>
          <p className="text-sm text-slate-400 mt-0.5">Quản lý và theo dõi các vấn đề tại cửa hàng</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={!locationId}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
        >
          <Plus size={16} />
          Tạo báo cáo mới
        </button>
      </div>

      {loadError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>
      )}
      {!locationId && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          User hiện tại chưa có workplace_id nên không thể gửi báo cáo sự cố.
        </div>
      )}

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
                    <p className="text-xs text-slate-300 mt-1">Nhấn &quot;Tạo báo cáo mới&quot; để thêm sự cố</p>
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
                        <p className="text-xs text-slate-400 truncate max-w-[200px]">{(incident.description || '').slice(0, 50)}...</p>
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