'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
  MessageSquare,
  Wrench,
  X,
  Search,
  Filter,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { DamageReportAPIService, DamageReportFromAPI } from '@/services/damage-report-api.service'
import { ProductAPIService, ProductFromAPI } from '@/services/product-api.service'
import { UserAPIService } from '@/services/user-api.service'

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
  reportId: string
  id: string
  title: string
  description: string
  priority: Priority
  status: IncidentStatus
  timeAgo: string
  category: string
  reporter: string
  images: string[]
  progress: ProgressStep[]
}

function mapApiStatus(status?: string): IncidentStatus {
  const normalized = (status || '').toUpperCase()
  if (normalized === 'PROCESSING') return 'processing'
  if (normalized === 'COMPLETED' || normalized === 'APPROVED' || normalized === 'RESOLVED') return 'resolved'
  return 'pending'
}

function mapApiPriority(quality?: number): Priority {
  const q = Number(quality || 0)
  if (q >= 8) return 'urgent'
  if (q >= 5) return 'medium'
  return 'low'
}

function resolveUserDisplayName(user: { full_name?: string; fullName?: string; name?: string } | null): string {
  return (user?.full_name || user?.fullName || user?.name || '').trim()
}

function normalizeUuid(value?: string): string {
  return String(value || '').trim().toLowerCase()
}

function getUserIdCandidates(user: unknown): string[] {
  if (!user || typeof user !== 'object') return []

  const raw = user as {
    id?: string
    userId?: string
    user_id?: string
    sub?: string
    uid?: string
  }

  return [raw.id, raw.userId, raw.user_id, raw.sub, raw.uid]
    .map((v) => String(v || '').trim())
    .filter(Boolean)
}

function resolveReporterDisplayNameFromReport(report: DamageReportFromAPI): string {
  const raw = report as DamageReportFromAPI & {
    reportedByName?: string
    reporterName?: string
    reporterFullName?: string
    reportedByFullName?: string
    createdByName?: string
    userName?: string
    fullName?: string
    full_name?: string
    reporter?: {
      full_name?: string
      fullName?: string
      name?: string
      userName?: string
    }
    reportedByUser?: {
      full_name?: string
      fullName?: string
      name?: string
      userName?: string
    }
  }

  return (
    raw.reportedByName ||
    raw.reporterName ||
    raw.reporterFullName ||
    raw.reportedByFullName ||
    raw.createdByName ||
    raw.userName ||
    raw.fullName ||
    raw.full_name ||
    raw.reporter?.full_name ||
    raw.reporter?.fullName ||
    raw.reporter?.name ||
    raw.reporter?.userName ||
    raw.reportedByUser?.full_name ||
    raw.reportedByUser?.fullName ||
    raw.reportedByUser?.name ||
    raw.reportedByUser?.userName ||
    ''
  ).trim()
}

async function buildReporterNameMap(reports: DamageReportFromAPI[]): Promise<Map<string, string>> {
  const ids = Array.from(new Set(reports.map((row) => (row.reportedBy || '').trim()).filter(Boolean)))

  if (ids.length === 0) return new Map()

  try {
    const [iamUsers, localUsers] = await Promise.all([
      UserAPIService.getIamUsersList().catch(() => []),
      UserAPIService.getAll().catch(() => []),
    ])

    const users = [...iamUsers, ...localUsers]
    const idToName = new Map<string, string>()

    users.forEach((user) => {
      const name = resolveUserDisplayName(user)
      if (!name) return

      getUserIdCandidates(user).forEach((id) => {
        idToName.set(normalizeUuid(id), name)
      })
    })

    const resolved = ids.map((id) => {
      const name = idToName.get(normalizeUuid(id)) || id
      return [id, name] as const
    })
    return new Map(resolved)
  } catch {
    // Fallback to per-user lookup below when users list endpoint is unavailable.
  }

  const resolved = await Promise.all(
    ids.map(async (id) => {
      try {
        const localUser = await UserAPIService.getById(id)
        const localName = resolveUserDisplayName(localUser)
        if (localName) return [id, localName] as const
      } catch {
        // Ignore local user lookup errors and fallback to IAM lookup.
      }

      try {
        const iamUser = await UserAPIService.getIamDetailsById(id)
        const iamName = resolveUserDisplayName(iamUser)
        if (iamName) return [id, iamName] as const
      } catch {
        // Keep UUID if all lookups fail.
      }

      return [id, id] as const
    })
  )

  return new Map(resolved)
}

function mapDamageReportToIncident(
  report: DamageReportFromAPI,
  products: ProductFromAPI[],
  reporterNameMap: Map<string, string>
): Incident {
  const safeProductId = String(report.productId || '').toLowerCase()
  const product = products.find((row) => row.id.toLowerCase() === safeProductId)
  const category = (report.damageType || 'Sự cố').trim()
  const title = product ? `${category} - ${product.name}` : category
  const createdAt = report.createdAt || new Date().toISOString()
  const status = mapApiStatus(report.status)

  const reportedBy = (report.reportedBy || '').trim()
  const reporterFromReport = resolveReporterDisplayNameFromReport(report)
  const reporter = reporterFromReport || (reportedBy ? (reporterNameMap.get(reportedBy) || reportedBy) : 'Hệ thống')

  return {
    reportId: report.id,
    id: report.reportNumber || report.id || `DMG-${Date.now()}`,
    title,
    description: (report.description || '').trim(),
    priority: mapApiPriority(report.quality),
    status,
    timeAgo: new Date(report.reportedDate || createdAt).toLocaleString('vi-VN'),
    category,
    reporter,
    images: Array.isArray(report.photos) ? report.photos.filter(Boolean) : [],
    progress: [
      {
        label: 'Đã tiếp nhận báo cáo',
        time: new Date(createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        author: 'Hệ thống',
        done: true,
      },
      {
        label: status === 'pending' ? 'Đang chờ phân công xử lý' : 'Đang xử lý',
        time: '',
        author: '',
        done: status !== 'pending',
      },
      {
        label: 'Đã giải quyết',
        time: '',
        author: '',
        done: status === 'resolved',
      },
    ],
  }
}

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

// ─── Detail modal ─────────────────────────────────────────────────────────────
function IncidentDetailModal({
  incident,
  onClose,
  onApprove,
  isApproving,
}: {
  incident: Incident
  onClose: () => void
  onApprove: (incident: Incident) => void
  isApproving: boolean
}) {
  const pc = priorityConfig[incident.priority]
  const sc = statusConfig[incident.status]
  const canApprove = incident.status === 'pending'
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

          {incident.images.length > 0 && (
            <div>
              <h4 className="text-[13px] font-semibold text-gray-800 mb-2">Hình ảnh đính kèm ({incident.images.length})</h4>
              <div className="grid grid-cols-3 gap-2">
                {incident.images.map((src, index) => (
                  <div key={`${src}-${index}`} className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Ảnh sự cố ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

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
        <div className="px-6 pb-5 flex items-center gap-2">
          {canApprove && (
            <button
              onClick={() => onApprove(incident)}
              disabled={isApproving}
              className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold text-[13px] transition-colors"
            >
              {isApproving ? 'Đang xác nhận...' : 'Approve'}
            </button>
          )}
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[13px] transition-colors">Đóng</button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function IncidentsPage() {
  const { user } = useAuthStore()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả')
  const [priorityFilter, setPriorityFilter] = useState<string>('Tất cả')
  const [selected, setSelected] = useState<Incident | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [approvingReportId, setApprovingReportId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const locationId = user?.workplaceId?.trim() || ''
  const locationType = user?.workplaceType === 'WAREHOUSE' ? 'WAREHOUSE' : 'STORE'

  const loadReports = useCallback(async () => {
    if (!locationId) {
      setIncidents([])
      setLoadError('Không tìm thấy workplace_id của manager hiện tại.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError('')

    try {
      const [products, reports] = await Promise.all([
        ProductAPIService.getAllProducts(),
        DamageReportAPIService.getDamageReports({ locationId, locationType }),
      ])
      const reporterNameMap = await buildReporterNameMap(reports)
      setIncidents(reports.map((row) => mapDamageReportToIncident(row, products, reporterNameMap)))
    } catch {
      setIncidents([])
      setLoadError('Không thể tải danh sách báo cáo sự cố từ hệ thống.')
    } finally {
      setIsLoading(false)
    }
  }, [locationId, locationType])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, priorityFilter])

  const filtered = useMemo(() => {
    let list = incidents
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
  }, [incidents, search, statusFilter, priorityFilter])

  const counts = useMemo(() => ({
    pending:    incidents.filter((i) => i.status === 'pending').length,
    processing: incidents.filter((i) => i.status === 'processing').length,
    resolved:   incidents.filter((i) => i.status === 'resolved').length,
  }), [incidents])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleOpenDetail = async (incident: Incident) => {
    setSelected(incident)

    if (incident.images.length > 0 || !incident.reportId) {
      return
    }

    try {
      setIsLoadingDetail(true)
      const detail = await DamageReportAPIService.getDamageReportById(incident.reportId)
      const detailImages = Array.isArray(detail?.photos) ? detail!.photos.filter(Boolean) : []

      if (detailImages.length > 0) {
        setIncidents((prev) =>
          prev.map((row) =>
            row.reportId === incident.reportId
              ? {
                  ...row,
                  images: detailImages,
                  description: row.description || (detail?.description || '').trim(),
                }
              : row
          )
        )

        setSelected((prev) =>
          prev && prev.reportId === incident.reportId
            ? {
                ...prev,
                images: detailImages,
                description: prev.description || (detail?.description || '').trim(),
              }
            : prev
        )
      }
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const handleApprove = async (incident: Incident) => {
    if (!incident.reportId) return

    try {
      setApprovingReportId(incident.reportId)
      await DamageReportAPIService.approveDamageReport(incident.reportId)
      await loadReports()
      setSelected(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể approve báo cáo sự cố.'
      if (message.toUpperCase().includes('ALREADY') || message.toUpperCase().includes('APPROVED')) {
        await loadReports()
        setSelected(null)
        return
      }
      setLoadError(message)
    } finally {
      setApprovingReportId(null)
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle size={20} className="text-orange-500" />
          Quản lý sự cố
        </h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Theo dõi và xử lý các sự cố tại cửa hàng</p>
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

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">
            <p>Đang tải báo cáo sự cố...</p>
          </div>
        ) : loadError ? (
          <div className="bg-red-50 border border-red-200 m-4 rounded-xl p-6 text-center text-red-600 text-sm">
            {loadError}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <AlertTriangle size={32} className="mx-auto mb-3 opacity-30" />
            <p>Không có sự cố nào</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 text-left">Mã sự cố</th>
                  <th className="px-4 py-3 text-left">Tiêu đề</th>
                  <th className="px-4 py-3 text-left">Danh mục</th>
                  <th className="px-4 py-3 text-left">Ưu tiên</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Thời gian</th>
                  <th className="px-4 py-3 text-left">Người báo cáo</th>
                  <th className="px-4 py-3 text-center">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((inc) => {
                  const pc = priorityConfig[inc.priority]
                  const sc = statusConfig[inc.status]
                  return (
                    <tr key={inc.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{inc.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 text-[13px] truncate max-w-[320px]">{inc.title}</p>
                        <p className="text-[12px] text-gray-500 truncate max-w-[320px]">{inc.description || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-600">{inc.category}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${pc.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                          {pc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.cls}`}>
                          {sc.icon} {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-600 whitespace-nowrap">{inc.timeAgo}</td>
                      <td className="px-4 py-3 text-[12px] text-gray-600">{inc.reporter}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleOpenDetail(inc)}
                          className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Hiển thị {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} sự cố
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 disabled:opacity-40 hover:bg-white"
                >
                  Trước
                </button>
                <span className="text-xs text-gray-600">Trang {page}/{totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 disabled:opacity-40 hover:bg-white"
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selected && isLoadingDetail && (
        <div className="text-xs text-gray-500">Đang tải ảnh chi tiết sự cố...</div>
      )}

      {selected && (
        <IncidentDetailModal
          incident={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          isApproving={approvingReportId === selected.reportId}
        />
      )}
    </div>
  )
}
