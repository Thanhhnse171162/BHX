'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Plus, X, Eye, ChevronLeft, ChevronRight, Upload } from 'lucide-react'
import { ProductAPIService, ProductFromAPI } from '@/services/product-api.service'
import { DamageReportAPIService, DamageReportFromAPI } from '@/services/damage-report-api.service'
import { WarehouseLookupAPIService } from '@/services/warehouse-lookup-api.service'
import { useAuthStore } from '@/store/auth.store'

function normalizeId(value?: string | null): string {
  return String(value ?? '').trim().toLowerCase()
}

type LocationType = 'STORE' | 'WAREHOUSE'
type StatusType = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED'

interface DamageReportView {
  id: string
  reportNumber: string
  locationType: LocationType
  locationId: string
  productId: string
  productName: string
  damageType: string
  quantity: number
  status: StatusType
  approvedBy?: string
  reportDate: string
  description: string
  photos: string[]
}

interface CreatePayload {
  productId: string
  damageType: string
  reportedDate: string
  quality: number
  description: string
  photos: File[]
}

const STATUS_CONFIG: Record<StatusType, { label: string; bg: string; text: string; dot: string; border: string }> = {
  PENDING: { label: 'Chờ xử lý', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', border: 'border-amber-200' },
  PROCESSING: { label: 'Đang xử lý', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' },
  APPROVED: { label: 'Được duyệt', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  COMPLETED: { label: 'Hoàn tất', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  REJECTED: { label: 'Bị từ chối', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200' },
}

function normalizeStatus(status?: string): StatusType {
  const normalized = String(status || 'PENDING').toUpperCase()
  if (normalized === 'APPROVED') return 'APPROVED'
  if (normalized === 'REJECTED') return 'REJECTED'
  if (normalized === 'PROCESSING') return 'PROCESSING'
  if (normalized === 'COMPLETED') return 'COMPLETED'
  return 'PENDING'
}

function formatDateTime(value?: string) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
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

function DamageTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold border bg-cyan-50 text-cyan-700 border-cyan-200">
      {type || 'N/A'}
    </span>
  )
}

function LocationBadge({ type }: { type: LocationType }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
      <span className="text-base">{type === 'STORE' }</span>
      {type}
    </span>
  )
}

function normalizePhotoUrls(value: unknown): string[] {
  if (!value) return []

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
      return [trimmed]
    }
    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  if (!Array.isArray(value)) return []

  return value
    .flatMap((item) => {
      if (!item) return []
      if (typeof item === 'string') return [item]
      if (typeof item !== 'object') return []

      const objectItem = item as Record<string, unknown>
      const objectUrl =
        objectItem.url ||
        objectItem.path ||
        objectItem.photo ||
        objectItem.photoUrl ||
        objectItem.image ||
        objectItem.imageUrl

      return typeof objectUrl === 'string' ? [objectUrl] : []
    })
    .map((item) => item.trim())
    .filter(Boolean)
}

function extractReportPhotos(report: DamageReportFromAPI): string[] {
  const candidateSources: unknown[] = [
    report.photos,
    (report as any).photoUrls,
    (report as any).images,
    (report as any).imageUrls,
    (report as any).attachments,
    (report as any).damageReportPhotos,
    (report as any).evidencePhotos,
    (report as any).evidences,
  ]

  const merged = candidateSources.flatMap((source) => normalizePhotoUrls(source))
  return Array.from(new Set(merged))
}

function mapReportToView(report: DamageReportFromAPI, products: ProductFromAPI[]): DamageReportView {
  const productId = String(report.productId || '')
  const product = products.find((item) => item.id.toLowerCase() === productId.toLowerCase())

  // Try multiple field names for approvedBy (backend might use different names)
  const approvedByValue = 
    report.approvedBy || 
    (report as any).approverName ||
    (report as any).approverUserName ||
    (report as any).approvedByName ||
    (report as any).reviewedBy ||
    undefined

  return {
    id: report.id,
    reportNumber: report.reportNumber || report.id,
    locationType: report.locationType === 'STORE' ? 'STORE' : 'WAREHOUSE',
    locationId: String(report.locationId || ''),
    productId,
    productName: product?.name || productId || 'Không xác định',
    damageType: String(report.damageType || ''),
    quantity: Number(report.quality || 0),
    status: normalizeStatus(report.status),
    approvedBy: approvedByValue,
    reportDate: report.reportedDate || report.createdAt || '',
    description: String(report.description || ''),
    photos: extractReportPhotos(report),
  }
}

function DetailModal({ report, onClose, nameMap }: { report: DamageReportView; onClose: () => void; nameMap: Record<string, string> }) {
  function getLocationName(locationId: string): string {
    return nameMap[normalizeId(locationId)] || locationId
  }

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
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Mã báo cáo', value: report.reportNumber },
              { label: 'Ngày báo cáo', value: formatDateTime(report.reportDate) },
              { label: 'Vị trí', value: getLocationName(report.locationId) },
              { label: 'Loại địa điểm', value: <LocationBadge type={report.locationType} /> },
              { label: 'Sản phẩm', value: report.productName },
              { label: 'Loại thiệt hại', value: <DamageTypeBadge type={report.damageType} /> },
              { label: 'Trạng thái', value: <StatusBadge status={report.status} /> },
              { label: 'Số lượng', value: report.quantity },
              { label: 'Người duyệt', value: report.approvedBy || <span className="text-slate-400">—</span> },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <div className="text-sm font-medium text-slate-800 break-all">{value}</div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Mô tả thiệt hại</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{report.description || 'Không có mô tả.'}</p>
          </div>

          {report.photos.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Hình ảnh đính kèm ({report.photos.length})</p>
              <div className="grid grid-cols-3 gap-2">
                {report.photos.map((photo, idx) => (
                  <div key={`${photo}-${idx}`} className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt={`Damage photo ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateModal({
  onClose,
  onCreate,
  products,
  locationType,
  locationId,
}: {
  onClose: () => void
  onCreate: (payload: CreatePayload) => Promise<void>
  products: ProductFromAPI[]
  locationType: LocationType
  locationId: string
}) {
  const [productId, setProductId] = useState('')
  const [damageType, setDamageType] = useState('')
  const [reportedDate, setReportedDate] = useState(new Date().toISOString().slice(0, 16))
  const [quality, setQuality] = useState('1')
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError('')

    if (!locationId) {
      setSubmitError('Không tìm thấy workplace_id của manager hiện tại.')
      return
    }

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
      setSubmitError(error?.message || 'Không thể gửi báo cáo thiệt hại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Tạo báo cáo thiệt hại</h2>
            <p className="text-sm text-slate-500">Gửi báo cáo đúng định dạng</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Sản phẩm <span className="text-red-500">*</span></label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Loại thiệt hại <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={damageType}
                onChange={(e) => setDamageType(e.target.value)}
                placeholder="VD: hư hải"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Số lượng <span className="text-red-500">*</span></label>
              <input
                type="number"
                min={1}
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Ngày báo cáo <span className="text-red-500">*</span></label>
            <input
              type="datetime-local"
              value={reportedDate}
              onChange={(e) => setReportedDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Loại địa điểm</label>
              <input
                type="text"
                value={locationType === 'STORE' ? 'Cửa hàng' : 'Kho hàng'}
                readOnly
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">ID địa điểm</label>
              <input
                type="text"
                value={locationId || 'Không có workplace_id'}
                readOnly
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Mô tả <span className="text-red-500">*</span></label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả đầy đủ về thiệt hại"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Hình ảnh</label>
            <div className="flex gap-2 items-center">
              <label className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 cursor-pointer transition-colors bg-slate-50 hover:bg-emerald-50">
                <Upload className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">Tải ảnh lên</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => setPhotos(Array.from(e.target.files || []))}
                />
              </label>
              <span className="text-xs text-slate-500 whitespace-nowrap">{photos.length} ảnh</span>
            </div>
          </div>

          {submitError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{submitError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Huỷ
            </button>
            <button
              type="submit"
              disabled={submitting || !locationId}
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DamageReportsPage() {
  const { user } = useAuthStore()
  const [reports, setReports] = useState<DamageReportView[]>([])
  const [products, setProducts] = useState<ProductFromAPI[]>([])
  const [search, setSearch] = useState('')
  const [damageFilter, setDamageFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedReport, setSelectedReport] = useState<DamageReportView | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [nameMap, setNameMap] = useState<Record<string, string>>({})
  const PAGE_SIZE = 5

  const locationType: LocationType = user?.workplaceType === 'STORE' ? 'STORE' : 'WAREHOUSE'
  const locationId = String(user?.workplaceId || '').trim()

  const productMap = useMemo(() => {
    const map = new Map<string, ProductFromAPI>()
    products.forEach((product) => {
      map.set(product.id.toLowerCase(), product)
    })
    return map
  }, [products])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setLoadError('')

        const [productRows, reportRows] = await Promise.all([
          ProductAPIService.getAllProducts(),
          locationId
            ? DamageReportAPIService.getDamageReports({
                locationType,
                locationId,
              })
            : Promise.resolve([]),
        ])

        setProducts(productRows)
        setReports(reportRows.map((row) => mapReportToView(row, productRows)))

        // Fetch location names
        const uniqueLocationIds = Array.from(
          new Set(reportRows.map((r) => normalizeId(r.locationId)).filter(Boolean))
        )
        const unresolved = uniqueLocationIds.filter((id) => !nameMap[id])
        if (unresolved.length > 0) {
          const resolved = await Promise.all(
            unresolved.map(async (id) => {
              try {
                const data = await WarehouseLookupAPIService.getById(id)
                return [id, data?.name || id] as const
              } catch {
                return [id, id] as const
              }
            }),
          )
          setNameMap((prev) => {
            const next = { ...prev }
            for (const [id, label] of resolved) next[id] = label
            return next
          })
        }
      } catch (error: any) {
        setLoadError(error?.message || 'Không thể tải dữ liệu báo cáo thiệt hại.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [locationId, locationType])

  const handleCreate = async (payload: CreatePayload) => {
    if (!locationId) {
      throw new Error('Không tìm thấy workplace_id của manager hiện tại.')
    }

    const created = await DamageReportAPIService.createDamageReport({
      locationType,
      locationId,
      productId: payload.productId,
      damageType: payload.damageType,
      reportedDate: payload.reportedDate,
      quality: payload.quality,
      description: payload.description,
      photos: payload.photos,
    })

    const reportView = mapReportToView(created, Array.from(productMap.values()))
    setReports((prev) => [reportView, ...prev])
    setPage(1)
  }

  const filtered = reports.filter((report) => {
    const keyword = search.trim().toLowerCase()
    if (
      keyword &&
      !report.reportNumber.toLowerCase().includes(keyword) &&
      !report.productName.toLowerCase().includes(keyword) &&
      !report.damageType.toLowerCase().includes(keyword)
    ) {
      return false
    }
    if (damageFilter && report.damageType !== damageFilter) return false
    if (statusFilter && report.status !== statusFilter) return false
    return true
  })

  const damageTypeOptions = Array.from(new Set(reports.map((report) => report.damageType).filter(Boolean)))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const clearFilters = () => {
    setSearch('')
    setDamageFilter('')
    setStatusFilter('')
    setPage(1)
  }

  function getLocationName(locationId: string): string {
    const key = normalizeId(locationId)
    return nameMap[key] || locationId
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {selectedReport && <DetailModal report={selectedReport} onClose={() => setSelectedReport(null)} nameMap={nameMap} />}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
          products={products}
          locationType={locationType}
          locationId={locationId}
        />
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-slate-400 mb-1">Inventory &gt; Lịch sử báo cáo thiệt hại</p>
          <h1 className="text-2xl font-bold text-slate-800">Lịch sử báo cáo thiệt hại</h1>
          <p className="text-sm text-slate-400 mt-0.5">Dữ liệu được cập nhật từ /api/damage-reports (lọc theo workplace_id)</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={!locationId}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
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
          User hiện tại chưa có workplace_id nên không thể gửi báo cáo thiệt hại.
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2">
            <p className="text-xs font-medium text-slate-600 mb-1.5">Tìm theo mã báo cáo / sản phẩm / loại thiệt hại</p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="VD: DMG-2026-..., Gạo ST25, hư hại"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Loại thiệt hại</p>
            <select
              value={damageFilter}
              onChange={(e) => {
                setDamageFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Tất cả</option>
              {damageTypeOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Trạng thái</p>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Tất cả</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="PROCESSING">Đang xử lý</option>
              <option value="APPROVED">Được duyệt</option>
              <option value="COMPLETED">Hoàn tất</option>
              <option value="REJECTED">Bị từ chối</option>
            </select>
          </div>
        </div>

        <div className="mt-3">
          <button
            onClick={clearFilters}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Xoá bộ lọc
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Số báo cáo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Địa điểm</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Sản phẩm</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Loại thiệt hại</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Số lượng</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Ngày báo cáo</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide"></th>
            </tr>
          </thead>
          <tbody>
            {!loading && paginated.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                  Chưa có báo cáo thiệt hại nào cho workplace hiện tại.
                </td>
              </tr>
            )}
            {paginated.map((report) => (
              <tr key={report.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4 font-semibold text-slate-800 text-xs leading-tight whitespace-nowrap">{report.reportNumber}</td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-700">{getLocationName(report.locationId)}</p>
                    <LocationBadge type={report.locationType} />
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="text-xs font-semibold text-slate-700">{report.productName}</p>
                </td>
                <td className="px-4 py-4">
                  <DamageTypeBadge type={report.damageType} />
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="font-semibold text-slate-800 text-xs whitespace-nowrap">{report.quantity}</span>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={report.status} />
                </td>
                <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(report.reportDate)}</td>
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <Eye size={12} />
                    Xem
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Hiện {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filtered.length)} của {filtered.length} báo cáo
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageItem) => (
              <button
                key={pageItem}
                onClick={() => setPage(pageItem)}
                className={`w-7 h-7 text-xs rounded-lg font-medium transition-colors ${
                  currentPage === pageItem
                    ? 'bg-emerald-600 text-white'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {pageItem}
              </button>
            ))}
            <button
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={currentPage === totalPages}
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