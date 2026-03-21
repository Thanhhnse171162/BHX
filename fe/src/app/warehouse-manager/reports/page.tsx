'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Eye, Filter, Search } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { DamageReportAPIService, DamageReportFromAPI } from '@/services/damage-report-api.service'
import { ProductAPIService, ProductFromAPI } from '@/services/product-api.service'
import { UserAPIService, UserInfoFromAPI } from '@/services/user-api.service'

type ReportStatus = 'PENDING' | 'PROCESSING' | 'APPROVED' | 'COMPLETED' | 'REJECTED'

interface ReportView {
  id: string
  reportNumber: string
  reportedById: string
  reportedByName: string
  locationType: string
  locationId: string
  productId: string
  productName: string
  damageType: string
  quantity: number
  status: ReportStatus
  reportedDate: string
  createdAt: string
  description: string
  photos: string[]
}

interface DetailModalProps {
  report: ReportView
  onClose: () => void
  onApprove: (report: ReportView) => void
  isApproving: boolean
}

const STATUS_STYLE: Record<ReportStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
}

function normalizeStatus(value?: string): ReportStatus {
  const status = String(value || 'PENDING').toUpperCase()
  if (status === 'PROCESSING') return 'PROCESSING'
  if (status === 'APPROVED') return 'APPROVED'
  if (status === 'COMPLETED') return 'COMPLETED'
  if (status === 'REJECTED') return 'REJECTED'
  return 'PENDING'
}

function normalizeId(value: unknown): string {
  return String(value || '').trim().toLowerCase()
}

function normalizeUserName(user: UserInfoFromAPI): string {
  return (user.full_name || user.fullName || user.name || user.email || '').trim()
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '').trim()
  )
}

function normalizeUserRole(user: UserInfoFromAPI): string {
  return String(user.role?.name || '').trim().toLowerCase()
}

function normalizeUserWorkplaceId(user: UserInfoFromAPI): string {
  return normalizeId(user.workplaceId ?? user.workplace_id ?? user.workplace?.id)
}

function isWarehouseStaffOfManager(user: UserInfoFromAPI, managerWorkplaceKey: string): boolean {
  const roleName = normalizeUserRole(user)
  const workplaceKey = normalizeUserWorkplaceId(user)
  const isActive = String(user.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
  return roleName === 'warehouse staff' && workplaceKey === managerWorkplaceKey && isActive
}

function formatDateTime(value?: string): string {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

function DetailModal({ report, onClose, onApprove, isApproving }: DetailModalProps) {
  const canApprove = report.status === 'PENDING'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{report.reportNumber}</h2>
            <p className="text-sm text-gray-500">Chi tiết báo cáo thiệt hại</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">×</button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          {[
            { label: 'Mã báo cáo', value: report.reportNumber },
            { label: 'Trạng thái', value: report.status },
            { label: 'Người báo cáo', value: report.reportedByName },
            { label: 'Loại địa điểm', value: report.locationType },
            { label: 'Sản phẩm', value: report.productName },
            { label: 'Loại thiệt hại', value: report.damageType },
            { label: 'Số lượng', value: report.quantity },
            { label: 'Reported Date', value: formatDateTime(report.reportedDate) },
            { label: 'Created At', value: formatDateTime(report.createdAt) },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
              <p className="text-sm font-medium text-gray-800 break-all">{item.value || 'N/A'}</p>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Mô tả thiệt hại</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{report.description || 'Không có mô tả.'}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">Hình ảnh đính kèm ({report.photos.length})</p>
            {report.photos.length === 0 ? (
              <p className="text-sm text-gray-500">Không có hình ảnh đính kèm.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {report.photos.map((src, index) => (
                  <div key={`${src}-${index}`} className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Ảnh thiệt hại ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex gap-3">
            {canApprove && (
              <button
                onClick={() => onApprove(report)}
                disabled={isApproving}
                className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold text-sm transition-colors"
              >
                {isApproving ? 'Đang duyệt...' : 'Duyệt báo cáo'}
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WarehouseManagerReportsPage() {
  const { user } = useAuthStore()
  const [rows, setRows] = useState<ReportView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<ReportView | null>(null)
  const [approvingReportId, setApprovingReportId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const managerWorkplaceId = String(user?.workplaceId || '').trim()

  const loadData = useCallback(async () => {
    if (!managerWorkplaceId) {
      setRows([])
      setError('Không tìm thấy workplace_id của warehouse manager hiện tại.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const [products, reports] = await Promise.all([
        ProductAPIService.getAllProducts(),
        DamageReportAPIService.getDamageReports({
          locationType: 'WAREHOUSE',
          locationId: managerWorkplaceId,
        }),
      ])

      let users: UserInfoFromAPI[] = []
      try {
        users = await UserAPIService.getIamUsersList()
      } catch {
        // Keep page usable even when IAM users list endpoint is unavailable/unauthorized.
        users = []
      }

      const managerWorkplaceKey = normalizeId(managerWorkplaceId)

      const managedStaff = users.filter((u) => isWarehouseStaffOfManager(u, managerWorkplaceKey))

      const managedStaffIds = new Set(managedStaff.map((u) => normalizeId(u.id)).filter(Boolean))
      const userNameMap = new Map(
        users
          .map((u) => {
            const id = normalizeId(u.id)
            const name = normalizeUserName(u)
            return id && name ? ([id, name] as const) : null
          })
          .filter(Boolean) as Array<readonly [string, string]>
      )

      const productNameMap = new Map(
        products
          .map((p: ProductFromAPI) => {
            const id = normalizeId(p.id)
            const name = String(p.name || '').trim()
            return id && name ? ([id, name] as const) : null
          })
          .filter(Boolean) as Array<readonly [string, string]>
      )

      const filteredReports = reports.filter((report: DamageReportFromAPI) => {
        const reporterId = normalizeId(report.reportedBy)
        const locationKey = normalizeId(report.locationId)
        if (locationKey !== managerWorkplaceKey) return false
        // If IAM users list is unavailable, fallback to location-only filter (same behavior spirit as store-manager incidents).
        if (users.length === 0) return true
        if (managedStaffIds.size === 0) return false
        return managedStaffIds.has(reporterId)
      })

      // Fallback: resolve reporter names one-by-one when users list is unavailable/incomplete.
      const missingReporterIds = Array.from(
        new Set(
          filteredReports
            .map((report) => normalizeId(report.reportedBy))
            .filter((id) => id && !userNameMap.has(id))
        )
      )

      if (missingReporterIds.length > 0) {
        const resolvedPairs = await Promise.all(
          missingReporterIds.map(async (id) => {
            try {
              const detail = await UserAPIService.getIamDetailsById(id)
              const name = detail ? normalizeUserName(detail) : ''
              return name ? ([id, name] as const) : null
            } catch {
              return null
            }
          })
        )

        resolvedPairs.forEach((pair) => {
          if (!pair) return
          userNameMap.set(pair[0], pair[1])
        })
      }

      const mapped: ReportView[] = filteredReports.map((report: DamageReportFromAPI) => {
        const reporterId = normalizeId(report.reportedBy)
        const productId = normalizeId(report.productId)
        return {
          id: report.id,
          reportNumber: report.reportNumber || report.id,
          reportedById: String(report.reportedBy || ''),
          reportedByName: userNameMap.get(reporterId) || String(report.reportedBy || 'N/A'),
          locationType: String(report.locationType || ''),
          locationId: String(report.locationId || ''),
          productId: String(report.productId || ''),
          productName: productNameMap.get(productId) || String(report.productId || 'N/A'),
          damageType: String(report.damageType || 'N/A'),
          quantity: Number(report.quality || 0),
          status: normalizeStatus(report.status),
          reportedDate: String(report.reportedDate || ''),
          createdAt: String(report.createdAt || ''),
          description: String(report.description || ''),
          photos: Array.isArray(report.photos) ? report.photos.filter(Boolean) : [],
        }
      })

      setRows(mapped)
    } catch (e: any) {
      setRows([])
      setError(e?.message || 'Không thể tải dữ liệu báo cáo từ BE.')
    } finally {
      setLoading(false)
    }
  }, [managerWorkplaceId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false
      if (
        keyword &&
        !row.reportNumber.toLowerCase().includes(keyword) &&
        !row.reportedByName.toLowerCase().includes(keyword) &&
        !row.productName.toLowerCase().includes(keyword) &&
        !row.damageType.toLowerCase().includes(keyword)
      ) {
        return false
      }
      return true
    })
  }, [rows, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleOpenDetail = async (row: ReportView) => {
    let initialRow = row

    // Ensure reporter name uses users/list mapping instead of raw UUID whenever possible.
    if (!row.reportedByName || isUuidLike(row.reportedByName)) {
      try {
        const users = await UserAPIService.getIamUsersList()
        const resolvedName = users
          .map((u) => ({ id: normalizeId(u.id), name: normalizeUserName(u) }))
          .find((u) => u.id === normalizeId(row.reportedById))?.name

        let finalResolvedName = resolvedName || ''

        if (!finalResolvedName) {
          const detail = await UserAPIService.getIamDetailsById(row.reportedById)
          finalResolvedName = detail ? normalizeUserName(detail) : ''
        }

        if (finalResolvedName) {
          initialRow = {
            ...row,
            reportedByName: finalResolvedName,
          }

          setRows((prev) =>
            prev.map((item) =>
              item.id === row.id
                ? {
                    ...item,
                    reportedByName: finalResolvedName,
                  }
                : item
            )
          )
        }
      } catch {
        // Keep existing value when users list is not available.
      }
    }

    setSelected(initialRow)

    // If images are already available from list payload, skip detail fetch.
    if (initialRow.photos.length > 0) return

    try {
      const detail = await DamageReportAPIService.getDamageReportById(initialRow.id)
      if (!detail) return

      const detailPhotos = Array.isArray(detail.photos) ? detail.photos.filter(Boolean) : []
      const detailDescription = String(detail.description || '').trim()

      if (detailPhotos.length === 0 && !detailDescription) return

      setRows((prev) =>
        prev.map((item) =>
          item.id === initialRow.id
            ? {
                ...item,
                photos: detailPhotos.length > 0 ? detailPhotos : item.photos,
                description: detailDescription || item.description,
              }
            : item
        )
      )

      setSelected((prev) =>
        prev && prev.id === initialRow.id
          ? {
              ...prev,
              photos: detailPhotos.length > 0 ? detailPhotos : prev.photos,
              description: detailDescription || prev.description,
            }
          : prev
      )
    } catch {
      // Keep modal open with existing list data when detail endpoint fails.
    }
  }

  const handleApprove = async (report: ReportView) => {
    if (!report.id) return

    try {
      setApprovingReportId(report.id)
      await DamageReportAPIService.approveDamageReport(report.id)
      await loadData()
      setSelected(null)
    } catch (e: any) {
      const message = String(e?.message || '')
      if (message.toUpperCase().includes('ALREADY') || message.toUpperCase().includes('APPROVED')) {
        await loadData()
        setSelected(null)
        return
      }
      setError(message || 'Không thể duyệt báo cáo.')
    } finally {
      setApprovingReportId(null)
    }
  }

  return (
    <div className="space-y-6">
      {selected && (
        <DetailModal
          report={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          isApproving={approvingReportId === selected.id}
        />
      )}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Báo cáo</h1>
        <p className="text-gray-600 mt-1">Báo cáo thiệt hại trong kho manager đang quản lý</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã báo cáo, staff, sản phẩm..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">PENDING</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Đang tải báo cáo từ BE...</div>
        ) : error ? (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <AlertTriangle className="mx-auto mb-3 text-gray-300" />
            Không có báo cáo phù hợp trong phạm vi staff bạn đang quản lý.
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 text-left">Mã báo cáo</th>
                  <th className="px-4 py-3 text-left">Warehouse Staff</th>
                  <th className="px-4 py-3 text-left">Sản phẩm</th>
                  <th className="px-4 py-3 text-left">Loại thiệt hại</th>
                  <th className="px-4 py-3 text-right">Số lượng</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Ngày báo cáo</th>
                  <th className="px-4 py-3 text-center">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.reportNumber}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{row.reportedByName}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{row.productName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.damageType}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">{row.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${STATUS_STYLE[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{formatDateTime(row.reportedDate)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleOpenDetail(row)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green-700 bg-green-50 border border-green-200 hover:bg-green-100"
                      >
                        <Eye size={12} />
                        Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Hiển thị {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1} - {Math.min(safePage * PAGE_SIZE, filtered.length)} / {filtered.length} báo cáo
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={safePage === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 disabled:opacity-40 hover:bg-white"
                >
                  Trước
                </button>
                <span className="text-xs text-gray-600">Trang {safePage}/{totalPages}</span>
                <button
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={safePage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 disabled:opacity-40 hover:bg-white"
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
