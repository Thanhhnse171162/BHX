'use client'

import { useEffect, useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Search, ArrowDownUp, ChevronLeft, ChevronRight, Eye, X } from 'lucide-react'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import useAuthStore from '@/store/auth.store'
import { StockMovementAPIService, type StockMovementFromAPI } from '@/services/stock-movement-api.service'
import { ProductAPIService } from '@/services/product-api.service'
import { WarehouseLookupAPIService } from '@/services/warehouse-lookup-api.service'

const PAGE_SIZE = 10

type TabType = 'all' | 'in' | 'out'

function normalizeId(value?: string | null): string {
  return String(value || '').trim().toLowerCase()
}

function isInboundType(type?: string): boolean {
  const value = String(type || '').toUpperCase()
  return value === 'INBOUND' || value === 'PURCHASE' || value === 'TRANSFER_IN' || value === 'PRODUCTION'
}

function movementTypeLabel(type?: string): string {
  const value = String(type || '').toUpperCase()
  if (value === 'INBOUND') return 'Nhập Hàng'
  if (value === 'TRANSFER') return 'Chuyển Kho'
  if (value === 'ADJUSTMENT') return 'Điều Chỉnh'
  if (value === 'TRANSFER_IN') return 'Nhập Chuyển'
  if (value === 'TRANSFER_OUT') return 'Xuất Chuyển'
  return value || 'Không Xác Định'
}

interface EnrichedMovement extends StockMovementFromAPI {
  productText: string
  quantityText: string
  quantityValue: number
  itemCount: number
}

export default function StockMovementPage() {
  const { user, token } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<StockMovementFromAPI[]>([])
  const [warehouseName, setWarehouseName] = useState('')
  const [productNameMap, setProductNameMap] = useState<Record<string, string>>({})

  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedMovement, setSelectedMovement] = useState<StockMovementFromAPI | null>(null)

  const workplaceId =
    user?.workplaceId ||
    (user as any)?.workplace_id ||
    (user as any)?.workplace?.id ||
    user?.warehouseId ||
    user?.storeId ||
    ''

  const fetchData = async () => {
    if (!token) {
      setRows([])
      setError('Bạn chưa đăng nhập.')
      setLoading(false)
      return
    }

    if (!workplaceId) {
      setRows([])
      setError('Tài khoản chưa được gán location để xem lịch sử di chuyển hàng.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await StockMovementAPIService.getByLocation(workplaceId)
      setRows(Array.isArray(data) ? data : [])

      try {
        const warehouse = await WarehouseLookupAPIService.getById(workplaceId)
        setWarehouseName(warehouse?.name || '')
      } catch {
        setWarehouseName('')
      }
    } catch {
      setRows([])
      setError('Không thể tải dữ liệu stock movement từ BE.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, workplaceId])

  useEffect(() => {
    const ids = Array.from(
      new Set(
        rows.flatMap((movement) =>
          (movement.items || []).map((item) => normalizeId(item.productId)).filter(Boolean)
        )
      )
    )

    if (ids.length === 0) return

    let cancelled = false

    ;(async () => {
      const entries = await Promise.all(
        ids.map(async (id) => {
          const product = await ProductAPIService.getById(id)
          return [id, product?.name || id] as const
        })
      )

      if (cancelled) return
      setProductNameMap((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
    })()

    return () => {
      cancelled = true
    }
  }, [rows])

  const enrichedRows = useMemo<EnrichedMovement[]>(() => {
    return rows.map((movement) => {
      const items = Array.isArray(movement.items) ? movement.items : []
      const itemCount = items.length
      const firstItem = items[0]
      const productName = firstItem
        ? productNameMap[normalizeId(firstItem.productId)] || firstItem.productName || firstItem.productId
        : '—'

      const totalQty = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
      const quantityValue = Math.abs(totalQty)
      const quantityText = itemCount === 0 ? '0' : String(quantityValue)

      return {
        ...movement,
        productText: productName,
        quantityText,
        quantityValue,
        itemCount,
      }
    })
  }, [rows, productNameMap])

  const movementTypes = useMemo(() => {
    const values = Array.from(new Set(enrichedRows.map((row) => String(row.movementType || '').toUpperCase()).filter(Boolean)))
    return values
  }, [enrichedRows])

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return enrichedRows.filter((movement) => {
      const movementType = String(movement.movementType || '').toUpperCase()
      const movementDate = String(movement.movementDate || '').slice(0, 10)

      const tabOk = activeTab === 'all' || (activeTab === 'in' ? isInboundType(movementType) : !isInboundType(movementType))
      const typeOk = typeFilter === 'all' || movementType === typeFilter

      const searchOk =
        !term ||
        String(movement.movementNumber || '').toLowerCase().includes(term) ||
        String(movement.productText || '').toLowerCase().includes(term) ||
        String(movement.notes || '').toLowerCase().includes(term) ||
        String(movement.supplierName || '').toLowerCase().includes(term)

      const fromOk = !startDate || movementDate >= startDate
      const toOk = !endDate || movementDate <= endDate

      return tabOk && typeOk && searchOk && fromOk && toOk
    })
  }, [enrichedRows, activeTab, typeFilter, searchTerm, startDate, endDate])

  const stats = useMemo(() => {
    const inCount = enrichedRows.filter((row) => isInboundType(row.movementType)).length
    const outCount = enrichedRows.filter((row) => !isInboundType(row.movementType)).length
    return {
      inCount,
      outCount,
      net: inCount - outCount,
    }
  }, [enrichedRows])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const paginatedRows = filteredRows.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, typeFilter, searchTerm, startDate, endDate])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Xuất Nhập Hàng</h1>
          <p className="text-gray-600 mt-1">Ghi lại và theo dõi các chuyển động hàng hóa</p>
          {workplaceId && (
            <p className="text-xs text-gray-500 mt-1">Vị trí: {warehouseName || workplaceId}</p>
          )}
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading} className="h-9 px-4">
          {loading ? 'Đang tải...' : 'Làm mới'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-green-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Tổng Nhập Hàng</p>
              <p className="text-3xl font-bold text-green-600">{stats.inCount}</p>
              <p className="text-xs text-gray-500 mt-1">giao dịch</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border-l-4 border-red-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Tổng Xuất Hàng</p>
              <p className="text-3xl font-bold text-red-600">{stats.outCount}</p>
              <p className="text-xs text-gray-500 mt-1">giao dịch</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border-l-4 border-blue-500 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Chuyển Động Ròng</p>
              <p className={`text-3xl font-bold ${stats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(stats.net)}
              </p>
              <p className="text-xs text-gray-500 mt-1">giao dịch</p>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
              <ArrowDownUp className="text-gray-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm Kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Mã di chuyển, tên hàng, ghi chú, nhà cung cấp"
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Loại Di Chuyển</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6e3e] bg-white"
            >
              <option value="all">Tất Cả Loại</option>
              {movementTypes.map((type) => (
                <option key={type} value={type}>{movementTypeLabel(type)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Từ Ngày</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} max={endDate || undefined} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Đến Ngày</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || undefined} />
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Hiển thị <span className="font-bold text-[#2d6e3e]">{filteredRows.length}</span> giao dịch • 10 mục/trang
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === 'all' ? 'bg-[#2d6e3e] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Tất Cả Di Chuyển
          </button>
          <button
            onClick={() => setActiveTab('in')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === 'in' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Nhập Hàng
          </button>
          <button
            onClick={() => setActiveTab('out')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === 'out' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Xuất Hàng
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Di Chuyển</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sản Phẩm</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Loại</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Số Lượng</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ngày</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Trạng Thái</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ghi Chú</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-gray-500">Đang tải dữ liệu...</td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-gray-500">Không tìm thấy giao dịch</td>
                </tr>
              ) : (
                paginatedRows.map((movement) => {
                  const inbound = isInboundType(movement.movementType)
                  return (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{movement.movementNumber}</div>
                        <div className="text-xs text-gray-500">{movement.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{movement.productText}</div>
                        <div className="text-xs text-gray-500">{movement.itemCount} mục</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-gray-700">
                          {inbound ? <TrendingUp size={14} className="text-green-600" /> : <TrendingDown size={14} className="text-red-600" />}
                          {movementTypeLabel(movement.movementType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        <span className={inbound ? 'text-green-600' : 'text-red-600'}>
                          {movement.quantityValue}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">{movement.movementDate ? new Date(movement.movementDate).toLocaleDateString('vi-VN') : '—'}</div>
                        <div className="text-xs text-gray-500">{movement.movementDate ? new Date(movement.movementDate).toLocaleTimeString('vi-VN') : '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{String(movement.status || '—')}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-[320px] truncate" title={movement.notes || movement.supplierName || ''}>
                        {movement.notes || movement.supplierName || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedMovement(movement)
                            setDetailOpen(true)
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-medium text-gray-900">{startIndex + 1}</span> đến{' '}
                <span className="font-medium text-gray-900">{Math.min(endIndex, filteredRows.length)}</span> trong{' '}
                <span className="font-medium text-gray-900">{filteredRows.length}</span> giao dịch
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border transition-colors ${
                    currentPage === 1
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>

                <span className="px-3 py-2 text-sm font-medium text-gray-700">
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg border transition-colors ${
                    currentPage === totalPages
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailOpen && selectedMovement && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Chi tiết di chuyển hàng</h3>
              <button
                onClick={() => setDetailOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Mã Di Chuyển</p>
                  <p className="text-sm font-medium text-gray-900">{selectedMovement.movementNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">ID</p>
                  <p className="text-xs font-mono text-gray-600 truncate">{selectedMovement.id || '—'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sản Phẩm</p>
                <p className="text-sm text-gray-900">{selectedMovement.productText || '—'}</p>
                <p className="text-xs text-gray-500 mt-1">{selectedMovement.itemCount} mục</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Loại Di Chuyển</p>
                  <p className="text-sm text-gray-900">{movementTypeLabel(selectedMovement.movementType)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Số Lượng</p>
                  <p className={`text-sm font-semibold ${isInboundType(selectedMovement.movementType) ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedMovement.quantityValue}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ngày Di Chuyển</p>
                  <p className="text-sm text-gray-900">
                    {selectedMovement.movementDate ? new Date(selectedMovement.movementDate).toLocaleDateString('vi-VN') : '—'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedMovement.movementDate ? new Date(selectedMovement.movementDate).toLocaleTimeString('vi-VN') : ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Trạng Thái</p>
                  <p className="text-sm text-gray-900">{selectedMovement.status || '—'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ghi Chú</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                  {selectedMovement.notes || selectedMovement.supplierName || '—'}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                onClick={() => setDetailOpen(false)}
                className="w-full px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
