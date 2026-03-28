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
// All Reports Component
// ---------------------------------------------------------------------------

export default function AllReports() {
  const [typeFilter, setTypeFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [damageReports, setDamageReports] = useState<ReportItem[]>([])
  const [isLoadingReports, setIsLoadingReports] = useState(false)
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

  // Use only damage reports fetched from API
  const allReports = useMemo(() => {
    return [...damageReports]
  }, [damageReports])

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
          </div>
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
          {isLoadingReports ? (
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
                Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} đến {Math.min(currentPage * ITEMS_PER_PAGE, filteredReports.length)} trong {filteredReports.length} báo cáo
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
