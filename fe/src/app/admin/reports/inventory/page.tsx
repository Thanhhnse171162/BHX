'use client'

import { useMemo, useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK'

export interface InventoryReportRow extends Record<string, unknown> {
  id: string
  productCode: string
  productName: string
  category: string
  storeName: string
  warehouseName: string
  currentStock: number
  minStock: number
  maxStock: number
  inTransit: number
  reserved: number
  available: number
  stockValue: number
  lastRestocked: string // ISO date string
  status: StockStatus
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const statusConfig: Record<
  StockStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  IN_STOCK: {
    label: 'Còn hàng',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  LOW_STOCK: {
    label: 'Sắp hết',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  OUT_OF_STOCK: {
    label: 'Hết hàng',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  OVERSTOCK: {
    label: 'Tồn cao',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StockBar({ current, min, max }: { current: number; min: number; max: number }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0
  const color =
    current === 0
      ? 'bg-red-400'
      : current < min
      ? 'bg-amber-400'
      : current > max
      ? 'bg-blue-400'
      : 'bg-emerald-400'
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
  color,
}: {
  label: string
  active: boolean
  onClick: () => void
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap ${
        active
          ? (color ?? 'bg-green-600 text-white border-green-600')
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
      }`}
    >
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Props — wire up from your data-fetching layer (SWR, React Query, etc.)
// ---------------------------------------------------------------------------

interface InventoryReportsPageProps {
  /** Rows returned from the API. Pass [] while loading. */
  data: InventoryReportRow[]
  /** Distinct category list for the dropdown. Derived client-side if omitted. */
  categories?: string[]
  /** ISO timestamp of the last data refresh shown in the header. */
  lastUpdatedAt?: string
  /** Called when the user clicks "Xuất PDF". Wire up your export handler. */
  onExportPdf?: () => void
  /** Called when the user clicks "Xuất Excel". Wire up your export handler. */
  onExportExcel?: () => void
  /** Pass true while data is loading to show a loading state. */
  isLoading?: boolean
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function InventoryReportsPage({
  data = [],
  categories: categoriesProp,
  lastUpdatedAt,
  onExportPdf,
  onExportExcel,
  isLoading = false,
}: InventoryReportsPageProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | StockStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const hasFilters =
    statusFilter !== 'all' || categoryFilter !== '' || locationFilter !== '' || searchQuery !== ''

  function clearFilters() {
    setStatusFilter('all')
    setCategoryFilter('')
    setLocationFilter('')
    setSearchQuery('')
  }

  // Derive categories from data if not supplied by the API
  const categories = useMemo(() => {
    if (categoriesProp) return categoriesProp
    return Array.from(new Set(data.map((r) => r.category))).sort()
  }, [categoriesProp, data])

  const filtered = useMemo(() => {
    return data.filter((row) => {
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter
      const matchesCategory =
        !categoryFilter ||
        row.category.toLowerCase().includes(categoryFilter.toLowerCase())
      const matchesLocation =
        !locationFilter ||
        row.storeName.toLowerCase().includes(locationFilter.toLowerCase()) ||
        row.warehouseName.toLowerCase().includes(locationFilter.toLowerCase())
      const matchesSearch =
        !searchQuery ||
        row.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.productCode.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesCategory && matchesLocation && matchesSearch
    })
  }, [data, statusFilter, categoryFilter, locationFilter, searchQuery])

  // KPI aggregates — computed from filtered rows
  const totalValue = filtered.reduce((s, r) => s + r.stockValue, 0)
  const totalItems = filtered.reduce((s, r) => s + r.currentStock, 0)
  const lowStockCount = filtered.filter((r) => r.status === 'LOW_STOCK').length
  const outOfStockCount = filtered.filter((r) => r.status === 'OUT_OF_STOCK').length

  // Analysis panels — computed from the full unfiltered dataset
  const statusBreakdown = (
    ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'OVERSTOCK'] as StockStatus[]
  ).map((s) => ({
    status: s,
    count: data.filter((r) => r.status === s).length,
    pct:
      data.length > 0
        ? Math.round((data.filter((r) => r.status === s).length / data.length) * 100)
        : 0,
  }))

  const topByValue = useMemo(
    () => [...data].sort((a, b) => b.stockValue - a.stockValue).slice(0, 5),
    [data]
  )

  const formattedLastUpdated = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleString('vi-VN')
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top header bar ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
              <span>Admin</span>
              <span>/</span>
              <span>Reports</span>
              <span>/</span>
              <span className="text-gray-600 font-medium">Inventory</span>
            </nav>
            <h1 className="text-xl font-semibold text-gray-900 leading-tight">
              Báo cáo tồn kho
            </h1>
            {formattedLastUpdated && (
              <p className="text-sm text-gray-500 mt-0.5">
                Cập nhật lần cuối: {formattedLastUpdated}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
              onClick={onExportPdf}
              disabled={isLoading}
            >
              <span className="text-base">📄</span>
              <span>Xuất PDF</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              onClick={onExportExcel}
              disabled={isLoading}
            >
              <span className="text-base">📊</span>
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Giá trị tồn kho
              </span>
              <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-base">
                💰
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 tabular-nums">
              {isLoading ? '—' : (totalValue / 1_000_000).toFixed(1)}
              <span className="text-base font-medium text-gray-400 ml-1">tr ₫</span>
            </div>
            <div className="text-xs text-gray-400">{filtered.length} SKU đang hiển thị</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Tổng số lượng
              </span>
              <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-base">
                📦
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 tabular-nums">
              {isLoading ? '—' : totalItems.toLocaleString('vi-VN')}
              <span className="text-base font-medium text-gray-400 ml-1">đvt</span>
            </div>
            <div className="text-xs text-gray-400">Tổng đơn vị tồn</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Sắp hết hàng
              </span>
              <span className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-base">
                ⚠️
              </span>
            </div>
            <div className="text-2xl font-bold text-amber-600 tabular-nums">
              {isLoading ? '—' : lowStockCount}
              <span className="text-base font-medium text-gray-400 ml-1">SKU</span>
            </div>
            <div className="text-xs text-amber-500 font-medium">Cần bổ sung sớm</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Hết hàng
              </span>
              <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-base">
                🚨
              </span>
            </div>
            <div className="text-2xl font-bold text-red-600 tabular-nums">
              {isLoading ? '—' : outOfStockCount}
              <span className="text-base font-medium text-gray-400 ml-1">SKU</span>
            </div>
            <div className="text-xs text-red-500 font-medium">Cần nhập khẩn</div>
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc mã SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Category */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[160px]"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Location */}
              <div className="relative min-w-[160px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  📍
                </span>
                <input
                  type="text"
                  placeholder="Lọc địa điểm..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Clear filters */}
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 hover:text-red-500 hover:border-red-300 transition-colors"
                >
                  <span>✕</span>
                  <span>Xóa lọc</span>
                </button>
              )}
            </div>
          </div>

          {/* Status chips */}
          <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 mr-1">Trạng thái:</span>
            <FilterChip
              label="Tất cả"
              active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
            />
            {(
              [
                ['IN_STOCK', 'bg-emerald-600 text-white border-emerald-600'],
                ['LOW_STOCK', 'bg-amber-500 text-white border-amber-500'],
                ['OUT_OF_STOCK', 'bg-red-500 text-white border-red-500'],
                ['OVERSTOCK', 'bg-blue-500 text-white border-blue-500'],
              ] as [StockStatus, string][]
            ).map(([s, color]) => (
              <FilterChip
                key={s}
                label={statusConfig[s].label}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
                color={color}
              />
            ))}
          </div>
        </div>

        {/* ── Data table ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">Danh sách sản phẩm</span>
            <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {filtered.length}
            </span>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-gray-400">
              <div className="text-3xl mb-2">⏳</div>
              <div className="text-sm font-medium">Đang tải dữ liệu...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <div className="text-3xl mb-2">📭</div>
              <div className="text-sm font-medium">Không tìm thấy sản phẩm</div>
              <div className="text-xs mt-1">Thử thay đổi bộ lọc</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="px-5 py-3 text-left sticky top-0 bg-gray-50 whitespace-nowrap">
                      Sản phẩm
                    </th>
                    <th className="px-4 py-3 text-left sticky top-0 bg-gray-50 whitespace-nowrap">
                      Địa điểm
                    </th>
                    <th className="px-4 py-3 text-center sticky top-0 bg-gray-50 whitespace-nowrap">
                      Tồn kho
                    </th>
                    <th className="px-4 py-3 text-center sticky top-0 bg-gray-50 whitespace-nowrap">
                      Khả dụng
                    </th>
                    <th className="px-4 py-3 text-right sticky top-0 bg-gray-50 whitespace-nowrap">
                      Giá trị
                    </th>
                    <th className="px-4 py-3 text-center sticky top-0 bg-gray-50 whitespace-nowrap">
                      Nhập gần nhất
                    </th>
                    <th className="px-4 py-3 text-center sticky top-0 bg-gray-50 whitespace-nowrap">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((row) => {
                    const cfg = statusConfig[row.status]
                    return (
                      <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Product */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-base flex-shrink-0">
                              🛒
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 leading-tight">
                                {row.productName}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-xs text-gray-400">
                                  {row.productCode}
                                </span>
                                <span className="text-gray-200">·</span>
                                <span className="text-xs text-gray-400">{row.category}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-4 py-3.5">
                          <div className="text-gray-700 text-sm font-medium">{row.storeName}</div>
                          <div className="text-xs text-gray-400">{row.warehouseName}</div>
                        </td>

                        {/* Stock */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="font-semibold text-gray-900 tabular-nums">
                            {row.currentStock.toLocaleString()}
                          </div>
                          <StockBar
                            current={row.currentStock}
                            min={row.minStock}
                            max={row.maxStock}
                          />
                          <div className="text-[10px] text-gray-400 mt-1">
                            {row.minStock}–{row.maxStock}
                          </div>
                        </td>

                        {/* Available */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="font-semibold text-emerald-700 tabular-nums">
                            {row.available}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Đặt {row.reserved} · Chuyển {row.inTransit}
                          </div>
                        </td>

                        {/* Value */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="font-semibold text-gray-900 tabular-nums whitespace-nowrap">
                            {row.stockValue.toLocaleString('vi-VN')} ₫
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="text-sm text-gray-500">
                            {new Date(row.lastRestocked).toLocaleDateString('vi-VN')}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${cfg.dot} inline-block`}
                            />
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Analysis panels ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span>📊</span> Phân tích theo trạng thái
            </h3>
            <div className="space-y-3">
              {statusBreakdown.map(({ status, count, pct }) => {
                const cfg = statusConfig[status]
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${cfg.bg} ${cfg.text} min-w-[90px]`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${cfg.dot}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 min-w-[60px] justify-end">
                      <span className="text-sm font-semibold text-gray-800">{count}</span>
                      <span className="text-xs text-gray-400">{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top by value */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span>🏆</span> Top sản phẩm theo giá trị tồn
            </h3>
            {topByValue.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-6">Chưa có dữ liệu</div>
            ) : (
              <div className="space-y-3">
                {topByValue.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-700'
                          : idx === 1
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {item.productName}
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.currentStock} đvt · {item.storeName}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-blue-600 whitespace-nowrap">
                      {(item.stockValue / 1_000_000).toFixed(1)}tr ₫
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}