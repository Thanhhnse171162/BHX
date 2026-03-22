'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { DamageReportAPIService, DamageReportFromAPI } from '@/services/damage-report-api.service'
import { WarehouseLookupAPIService } from '@/services/warehouse-lookup-api.service'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportItem {
  id: string
  title: string
  description: string
  type: string        // e.g. 'Tồn kho' | 'Tài chính'
  icon: string
  href: string
  updatedAt: string   // ISO date string
  location?: string   // warehouse or store name
  locationType?: 'WAREHOUSE' | 'STORE'  // location type
}

export interface CategoryRevenue {
  label: string
  value: number       // in millions VND
  color: string
}

export interface TrendDataPoint {
  date: string        // ISO date string
  revenue: number     // millions VND
  profit: number      // millions VND
  orders: number
}

export interface SummaryMetrics {
  avgRevenuePerDay: number    // millions VND
  avgProfitPerDay: number
  totalOrders: number
  profitMarginPct: number
  revenueChange: number       // percent vs previous period
  profitChange: number
  ordersChange: number
  marginChange: number
}

export interface QuickStats {
  activeProducts: number
  customers: number
  stores: number
  totalInventory: number
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AllReportsPageProps {
  /** List of available reports shown in the table section */
  reports?: ReportItem[]
  /** Data for the donut chart — derive from API */
  categoryRevenue?: CategoryRevenue[]
  /** Time-series data for the trend line chart */
  trendData?: TrendDataPoint[]
  /** Aggregated KPI numbers for the top cards */
  metrics?: SummaryMetrics
  /** Quick stat numbers at the bottom */
  quickStats?: QuickStats
  /** ISO timestamp for "last updated" */
  lastUpdatedAt?: string
  /** Loading state */
  isLoading?: boolean
  /** Called on Export Dashboard click */
  onExport?: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Period = '7d' | '30d' | '90d'

function formatVND(millions: number) {
  return `${millions.toFixed(1)}M ₫`
}

function formatPct(n: number) {
  const sign = n >= 0 ? '↑' : '↓'
  return `${sign} ${Math.abs(n).toFixed(1)}%`
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DonutChart({ data }: { data: CategoryRevenue[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full text-gray-300 text-sm">
        Chưa có dữ liệu
      </div>
    )
  }

  let cumulative = 0
  const slices = data.map((item) => {
    const pct = item.value / total
    const startAngle = cumulative * 360 - 90
    const endAngle = startAngle + pct * 360
    const x1 = 100 + 82 * Math.cos((Math.PI * startAngle) / 180)
    const y1 = 100 + 82 * Math.sin((Math.PI * startAngle) / 180)
    const x2 = 100 + 82 * Math.cos((Math.PI * endAngle) / 180)
    const y2 = 100 + 82 * Math.sin((Math.PI * endAngle) / 180)
    const large = pct * 360 > 180 ? 1 : 0
    cumulative += pct
    return { item, pathData: `M100,100 L${x1},${y1} A82,82 0 ${large} 1 ${x2},${y2} Z` }
  })

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {slices.map(({ item, pathData }, i) => (
        <path key={i} d={pathData} fill={item.color} stroke="white" strokeWidth="2" />
      ))}
      <circle cx="100" cy="100" r="52" fill="white" />
      <text x="100" y="97" textAnchor="middle" fontSize="18" fontWeight="600" fill="#111827">
        {total}M
      </text>
      <text x="100" y="113" textAnchor="middle" fontSize="10" fill="#9ca3af">
        Tổng
      </text>
    </svg>
  )
}

function TrendChart({
  data,
  period,
  onPeriodChange,
}: {
  data: TrendDataPoint[]
  period: Period
  onPeriodChange: (p: Period) => void
}) {
  const W = 640
  const H = 240
  const PL = 44
  const PR = 16
  const PT = 16
  const PB = 32

  const maxVal = data.length
    ? Math.max(...data.map((d) => Math.max(d.revenue, d.profit))) * 1.15
    : 1

  const gx = (i: number) => PL + (i / Math.max(data.length - 1, 1)) * (W - PL - PR)
  const gy = (v: number) => PT + ((1 - v / maxVal) * (H - PT - PB))

  const revPts = data.map((d, i) => `${gx(i)},${gy(d.revenue)}`).join(' ')
  const proPts = data.map((d, i) => `${gx(i)},${gy(d.profit)}`).join(' ')

  const gridLines = [0, 0.25, 0.5, 0.75, 1]

  const labelStep = Math.ceil(data.length / 6)
  const xLabels = data.filter((_, i) => i % labelStep === 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-60 text-gray-300 text-sm">
        Chưa có dữ liệu
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">Xu hướng doanh thu & lợi nhuận</p>
          <p className="text-xs text-gray-400">Biến động theo thời gian</p>
        </div>
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as Period)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="7d">7 ngày</option>
          <option value="30d">30 ngày</option>
          <option value="90d">90 ngày</option>
        </select>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 220 }}>
        {gridLines.map((frac, i) => {
          const y = PT + frac * (H - PT - PB)
          const label = Math.round(maxVal * (1 - frac))
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#f3f4f6" strokeWidth="1" />
              <text x={PL - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#d1d5db">
                {label}M
              </text>
            </g>
          )
        })}

        {/* Revenue area fill */}
        <polyline
          points={[`${gx(0)},${H - PB}`, revPts, `${gx(data.length - 1)},${H - PB}`].join(' ')}
          fill="#d1fae5"
          opacity="0.5"
          stroke="none"
        />

        <polyline
          points={revPts}
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={proPts}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="6 3"
        />

        {xLabels.map((d, i) => {
          const idx = data.indexOf(d)
          return (
            <text
              key={i}
              x={gx(idx)}
              y={H - PB + 18}
              textAnchor="middle"
              fontSize="9"
              fill="#9ca3af"
            >
              {new Date(d.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
            </text>
          )
        })}
      </svg>

      <div className="flex items-center justify-center gap-5 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 bg-emerald-500 rounded" />
          <span className="text-xs text-gray-500">Doanh thu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 bg-blue-500 rounded border-dashed" style={{ borderTop: '2px dashed #3b82f6', background: 'none' }} />
          <span className="text-xs text-gray-500">Lợi nhuận</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Report type badge colors
// ---------------------------------------------------------------------------

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'Tồn kho': { bg: 'bg-blue-50', text: 'text-blue-700' },
  'Tài chính': { bg: 'bg-purple-50', text: 'text-purple-700' },
  'Bán hàng': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  'Vận hành': { bg: 'bg-amber-50', text: 'text-amber-700' },
}
function typeBadge(type: string) {
  const c = TYPE_COLORS[type] ?? { bg: 'bg-gray-100', text: 'text-gray-600' }
  return `${c.bg} ${c.text}`
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AllReportsPage({
  reports = [],
  categoryRevenue = [],
  trendData = [],
  metrics,
  quickStats,
  lastUpdatedAt,
  isLoading = false,
  onExport,
}: AllReportsPageProps) {
  const [period, setPeriod] = useState<Period>('30d')
  const [typeFilter, setTypeFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [damageReports, setDamageReports] = useState<ReportItem[]>([])
  const [isLoadingReports, setIsLoadingReports] = useState(false)
  const [locationNames, setLocationNames] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Fetch damage reports on mount
  useEffect(() => {
    const fetchDamageReports = async () => {
      setIsLoadingReports(true)
      try {
        const data = await DamageReportAPIService.getDamageReports()
        
        // Fetch location names for all reports in parallel
        const locationNameMap: Record<string, string> = {}
        const uniqueLocationIds = Array.from(new Set(data.filter((r) => r.locationId).map((r) => r.locationId!)))
        
        await Promise.all(
          uniqueLocationIds.map(async (locationId) => {
            try {
              const warehouse = await WarehouseLookupAPIService.getById(locationId)
              if (warehouse?.name) {
                locationNameMap[locationId] = warehouse.name
              }
            } catch (error) {
              console.error(`Failed to fetch location name for ${locationId}:`, error)
            }
          })
        )

        setLocationNames(locationNameMap)

        const transformedReports: ReportItem[] = data.map((report: DamageReportFromAPI) => {
          const locationName = locationNameMap[report.locationId!] || report.locationId || `${report.locationType}`
          
          return {
            id: report.id,
            title: report.reportNumber || `Báo cáo #${report.id.substring(0, 8)}`,
            description: `Loại hư hại: ${report.damageType} | Vị trí: ${report.locationType} | Statut: ${report.status}`,
            type: report.locationType === 'WAREHOUSE' ? 'Tồn kho' : 'Bán hàng',
            icon: report.locationType === 'WAREHOUSE' ? '📦' : '🏪',
            href: `/admin/reports/damage/${report.id}`,
            updatedAt: report.createdAt || new Date().toISOString(),
            location: locationName,
            locationType: report.locationType,
          }
        })
        setDamageReports(transformedReports)
      } catch (error) {
        console.error('Failed to fetch damage reports:', error)
        setDamageReports([])
      } finally {
        setIsLoadingReports(false)
      }
    }

    fetchDamageReports()
  }, [])

  const hasFilters = typeFilter !== '' || locationFilter !== '' || searchQuery !== ''

  function clearFilters() {
    setTypeFilter('')
    setLocationFilter('')
    setSearchQuery('')
  }

  // Merge reports from props and fetched damage reports
  const allReports = useMemo(() => {
    return [...reports, ...damageReports]
  }, [reports, damageReports])

  const reportTypes = useMemo(
    () => Array.from(new Set(allReports.map((r) => r.type))).sort(),
    [allReports]
  )

  const reportLocations = useMemo(
    () => Array.from(new Set(allReports.filter((r) => r.location).map((r) => r.location!))).sort(),
    [allReports]
  )

  const filteredReports = useMemo(() => {
    return allReports.filter((r) => {
      const matchType = !typeFilter || r.type === typeFilter
      const matchLocation = !locationFilter || r.location === locationFilter
      const matchSearch =
        !searchQuery ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchType && matchLocation && matchSearch
    })
  }, [allReports, typeFilter, locationFilter, searchQuery])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [typeFilter, locationFilter, searchQuery])

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE)
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredReports.slice(startIndex, endIndex)
  }, [filteredReports, currentPage])

  const totalCatValue = categoryRevenue.reduce((s, d) => s + d.value, 0)
  const formattedUpdated = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleString('vi-VN')
    : null

  // Filter trendData by period selection (client-side slice for display)
  const visibleTrend = useMemo(() => {
    if (!trendData.length) return []
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    return trendData.slice(-days)
  }, [trendData, period])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
              <span>Admin</span>
              <span>/</span>
              <span className="text-gray-600 font-medium">Reports</span>
            </nav>
            <h1 className="text-xl font-semibold text-gray-900">Báo cáo thiệt hại</h1>
            {formattedUpdated && (
              <p className="text-sm text-gray-400 mt-0.5">
                Cập nhật lần cuối: {formattedUpdated}
              </p>
            )}
          </div>
          <button
            onClick={onExport}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <span>📊</span>
            <span>Export Dashboard</span>
          </button>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* ── Reports table ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table header + filters */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">Báo cáo chi tiết</span>
                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                  {filteredReports.length}
                </span>
                {totalPages > 1 && (
                  <span className="text-xs text-gray-500">
                    Trang {currentPage}/{totalPages}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm báo cáo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-44"
                  />
                </div>

                {/* Type filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Tất cả loại</option>
                  {reportTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                {/* Location filter */}
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Tất cả địa điểm</option>
                  {reportLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>

                {/* Clear */}
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg hover:text-red-500 hover:border-red-300 transition-colors"
                  >
                    ✕ Xóa lọc
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table body */}
          {isLoading || isLoadingReports ? (
            <div className="py-14 text-center text-gray-400">
              <div className="text-3xl mb-2">⏳</div>
              <div className="text-sm">Đang tải dữ liệu...</div>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="py-14 text-center text-gray-400">
              <div className="text-3xl mb-2">📭</div>
              <div className="text-sm font-medium">Không tìm thấy báo cáo</div>
              <div className="text-xs mt-1">Thử thay đổi bộ lọc</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="px-5 py-3 text-left whitespace-nowrap">Tên báo cáo</th>
                    <th className="px-4 py-3 text-left whitespace-nowrap">Mô tả</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Loại</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Ngày cập nhật</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedReports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-base flex-shrink-0">
                            {report.icon}
                          </div>
                          <span className="font-semibold text-gray-900">{report.title}</span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3.5">
                        <span className="text-gray-500 text-xs line-clamp-2 max-w-xs">
                          {report.description}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${typeBadge(report.type)}`}
                        >
                          {report.type}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-xs text-gray-500">
                          {new Date(report.updatedAt).toLocaleDateString('vi-VN')}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-center">
                        <Link
                          href={report.href}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          Xem chi tiết →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination controls */}
          {filteredReports.length > 0 && totalPages > 1 && (
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} đến{Math.min(currentPage * ITEMS_PER_PAGE, filteredReports.length)} trong {filteredReports.length} báo cáo
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Đầu
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Trước
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-green-600 text-white'
                          : 'text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sau →
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cuối
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}