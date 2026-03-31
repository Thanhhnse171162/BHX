"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Eye, Filter, Loader2, Plus, Search, X } from 'lucide-react'
import {
  createInventoryCheck,
  getInventoryCheckById,
  getInventoryChecks,
  type CreateInventoryCheckDto,
  type InventoryCheckDto,
  type InventoryCheckListDto,
} from '@/services/inventory-check-api'
import { ProductAPIService } from '@/services/product-api.service'
import { WarehouseLookupAPIService } from '@/services/warehouse-lookup-api.service'
import { useAuthStore } from '@/store/auth.store'

const PAGE_SIZE = 10

type CreateCheckForm = {
  locationType: 'STORE' | 'WAREHOUSE'
  checkType: 'PARTIAL' | 'FULL'
  notes: string
}

function formatDateVI(value?: string) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleDateString('vi-VN')
}

export default function StoreManagerInventoryCheckPage() {
  const { user, hydrated } = useAuthStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<InventoryCheckListDto[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [locationNameMap, setLocationNameMap] = useState<Map<string, string>>(new Map())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [detailsData, setDetailsData] = useState<InventoryCheckDto | null>(null)
  const [detailProductNameMap, setDetailProductNameMap] = useState<Map<string, string>>(new Map())
  const [currentStoreName, setCurrentStoreName] = useState<string>('')
  const [createForm, setCreateForm] = useState<CreateCheckForm>({
    locationType: 'STORE',
    checkType: 'PARTIAL',
    notes: '',
  })

  const loadChecks = useCallback(async () => {
    if (!hydrated || !user?.workplaceId) {
      setItems([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const all = await getInventoryChecks()
      const currentLocationId = String(user.workplaceId).trim().toLowerCase()
      const filtered = all.filter((check) => String(check.locationId ?? '').trim().toLowerCase() === currentLocationId)
      setItems(filtered)
      setPage(1)
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tải danh sách phiếu kiểm kê.'
      setError(message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [hydrated, user?.workplaceId])

  useEffect(() => {
    void loadChecks()
  }, [loadChecks])

  useEffect(() => {
    if (!hydrated || !user?.workplaceId) return
    
    WarehouseLookupAPIService.getById(String(user.workplaceId))
      .then((warehouse) => {
        setCurrentStoreName(warehouse?.name || String(user.workplaceId))
      })
      .catch(() => {
        setCurrentStoreName(String(user.workplaceId))
      })
  }, [hydrated, user?.workplaceId])

  useEffect(() => {
    const missingLocationIds = Array.from(
      new Set(items.map((item) => item.locationId).filter((id) => id && !locationNameMap.has(id)))
    ) as string[]

    if (missingLocationIds.length === 0) return

    missingLocationIds.forEach((locationId) => {
      WarehouseLookupAPIService.getById(locationId)
        .then((warehouse) => {
          setLocationNameMap((prev) => {
            const next = new Map(prev)
            next.set(locationId, warehouse?.name || locationId)
            return next
          })
        })
        .catch(() => {
          setLocationNameMap((prev) => {
            const next = new Map(prev)
            next.set(locationId, locationId)
            return next
          })
        })
    })
  }, [items, locationNameMap])

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return items

    return items.filter((check) => {
      const checkNumber = String(check.checkNumber || '').toLowerCase()
      const locationId = String(check.locationId || '').toLowerCase()
      const locationName = String(locationNameMap.get(check.locationId) || '').toLowerCase()
      return checkNumber.includes(keyword) || locationId.includes(keyword) || locationName.includes(keyword)
    })
  }, [items, locationNameMap, search])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const getStatusLabel = (status?: string) => {
    const value = String(status || '').toUpperCase()
    if (value === 'COMPLETED' || value === 'APPROVED') return 'Hoàn thành'
    if (value === 'PENDING') return 'Chờ xử lý'
    return status || '--'
  }

  const getStatusClass = (status?: string) => {
    const value = String(status || '').toUpperCase()
    if (value === 'COMPLETED' || value === 'APPROVED') return 'bg-emerald-100 text-emerald-700'
    if (value === 'PENDING') return 'bg-amber-100 text-amber-700'
    return 'bg-gray-100 text-gray-700'
  }

  const openCreateModal = () => {
    const locationType = String(user?.workplaceType || '').toUpperCase() === 'WAREHOUSE' ? 'WAREHOUSE' : 'STORE'
    setCreateForm({
      locationType,
      checkType: 'PARTIAL',
      notes: '',
    })
    setCreateError(null)
    setShowCreateModal(true)
  }

  const handleCreateCheck = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user?.workplaceId || isCreating) return

    setIsCreating(true)
    setCreateError(null)

    try {
      const payload: CreateInventoryCheckDto = {
        locationType: createForm.locationType,
        locationId: String(user.workplaceId),
        checkType: createForm.checkType,
        notes: createForm.notes.trim() || undefined,
      }

      await createInventoryCheck(payload)
      setShowCreateModal(false)
      await loadChecks()
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tạo phiếu kiểm kê.'
      setCreateError(message)
    } finally {
      setIsCreating(false)
    }
  }

  const openDetailsModal = async (checkId: string) => {
    setShowDetailsModal(true)
    setDetailsLoading(true)
    setDetailsError(null)
    setDetailsData(null)

    try {
      const data = await getInventoryCheckById(checkId)
      setDetailsData(data)
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tải chi tiết phiếu kiểm kê.'
      setDetailsError(message)
    } finally {
      setDetailsLoading(false)
    }
  }

  useEffect(() => {
    if (!detailsData || detailsData.items.length === 0) return

    const missingIds = Array.from(
      new Set(
        detailsData.items
          .map((item) => item.productId)
          .filter((id) => id && !detailProductNameMap.has(id))
      )
    )

    if (missingIds.length === 0) return

    Promise.all(
      missingIds.map(async (id) => {
        const product = await ProductAPIService.getById(id)
        return { id, name: product?.name || id }
      })
    ).then((rows) => {
      setDetailProductNameMap((prev) => {
        const next = new Map(prev)
        rows.forEach((row) => next.set(row.id, row.name))
        return next
      })
    })
  }, [detailsData, detailProductNameMap])

  return (
    <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Danh sách phiếu kiểm kê</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý các phiếu kiểm kê kho và cửa hàng</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-sm rounded-lg bg-[#059669] hover:bg-[#047857] text-white transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tạo phiếu kiểm kê
          </button>
          <button
            onClick={loadChecks}
            className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors inline-flex items-center gap-2 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div className="px-5 py-4 bg-red-50 border-b border-red-200">
          <div className="text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/25 p-4 pt-20">
          <section className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Tạo Phiếu Kiểm Kê</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCheck} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm text-gray-600">
                  Loại vị trí
                  <input
                    type="text"
                    value="Cửa hàng (STORE)"
                    disabled
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-600"
                  />
                </label>

                <label className="text-sm text-gray-600">
                  Vị trí
                  <input
                    value={currentStoreName}
                    disabled
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-600"
                  />
                </label>

                <label className="text-sm text-gray-600">
                  Loại kiểm kê
                  <div className="relative mt-1">
                    <select
                      value={createForm.checkType}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, checkType: e.target.value as 'PARTIAL' | 'FULL' }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 text-sm"
                    >
                      <option value="PARTIAL">Kiểm kê cục bộ (PARTIAL)</option>
                      <option value="FULL">Kiểm kê toàn bộ (FULL)</option>
                    </select>
                  </div>
                </label>

                <label className="text-sm text-gray-600">
                  Ghi chú
                  <textarea
                    value={createForm.notes}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    placeholder="Ghi chú thêm cho phiếu kiểm kê..."
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-y text-sm"
                  />
                </label>
              </div>

              {createError && <p className="text-sm text-red-600">{createError}</p>}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !user?.workplaceId}
                  className="px-4 py-2 rounded-lg bg-[#059669] text-white font-semibold hover:bg-[#047857] disabled:opacity-60"
                >
                  {isCreating ? 'Đang tạo...' : 'Tạo phiếu kiểm kê'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <div className="px-5 py-4 border-b border-gray-100 bg-white">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Tìm mã kiểm kê hoặc vị trí..."
            className="pl-9 pr-3 h-10 w-full rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-5 py-3 text-left">Mã kiểm kê</th>
              <th className="px-5 py-3 text-left">Vị trí</th>
              <th className="px-5 py-3 text-left">Loại kiểm kê</th>
              <th className="px-5 py-3 text-left">Trạng thái</th>
              <th className="px-5 py-3 text-left">Chênh lệch</th>
              <th className="px-5 py-3 text-left">Ngày tạo</th>
              <th className="px-5 py-3 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-5 py-12 text-center text-gray-500" colSpan={7}>
                  <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                  Đang tải danh sách...
                </td>
              </tr>
            ) : pageItems.length === 0 ? (
              <tr>
                <td className="px-5 py-12 text-center text-gray-500" colSpan={7}>
                  Chưa có phiếu kiểm kê nào
                </td>
              </tr>
            ) : (
              pageItems.map((check) => (
                <tr key={check.id} className="border-t border-gray-100 hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-bold text-[#059669]">#{check.checkNumber || check.id}</p>
                    <p className="text-xs text-gray-500">{String(check.id).slice(0, 8)}...</p>
                  </td>
                  <td className="px-5 py-4 text-gray-700">
                    <p className="font-semibold">{locationNameMap.get(check.locationId) || check.locationId}</p>
                    <p className="text-xs text-gray-500">{check.locationType}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        check.checkType === 'FULL' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {check.checkType === 'FULL' ? 'Toàn bộ' : 'Cục bộ'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClass(check.status)}`}>
                      {getStatusLabel(check.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-700 font-semibold">{check.totalDiscrepancies || 0}</td>
                  <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{formatDateVI(check.createdAt)}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => openDetailsModal(check.id)}
                      className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredItems.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Hiển thị {filteredItems.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-
            {Math.min(currentPage * PAGE_SIZE, filteredItems.length)} trên {filteredItems.length} phiếu
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-md border border-gray-200 text-gray-500 disabled:opacity-40"
              disabled={currentPage === 1}
            >
              {'<'}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(0, 7)
              .map((num) => (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`w-8 h-8 rounded-md text-sm font-semibold ${
                    currentPage === num ? 'bg-[#059669] text-white' : 'border border-gray-200 text-gray-600'
                  }`}
                >
                  {num}
                </button>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 rounded-md border border-gray-200 text-gray-500 disabled:opacity-40"
              disabled={currentPage === totalPages}
            >
              {'>'}
            </button>
          </div>
        </div>
      )}

      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDetailsModal(false)} />
          <section className="relative z-10 w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Chi tiết phiếu kiểm kê</h3>
                <p className="text-xs text-gray-500 mt-1">Xem thông tin chi tiết và kết quả kiểm kê.</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              {detailsLoading ? (
                <div className="py-10 text-center text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                  Đang tải chi tiết...
                </div>
              ) : detailsError ? (
                <div className="rounded-xl px-4 py-3 border bg-red-50 border-red-200 text-sm text-red-700">
                  {detailsError}
                </div>
              ) : detailsData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="text-xs text-gray-500">Mã phiếu</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{detailsData.checkNumber}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="text-xs text-gray-500">Trạng thái</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{getStatusLabel(detailsData.status)}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                        <tr>
                          <th className="px-4 py-3 text-left">Sản phẩm</th>
                          <th className="px-4 py-3 text-left">SL hệ thống</th>
                          <th className="px-4 py-3 text-left">SL thực tế</th>
                          <th className="px-4 py-3 text-left">Chênh lệch</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailsData.items.length === 0 ? (
                          <tr>
                            <td className="px-4 py-8 text-center text-gray-500" colSpan={4}>Chưa có dữ liệu item</td>
                          </tr>
                        ) : (
                          detailsData.items.map((item) => (
                            <tr key={item.id} className="border-t border-gray-100">
                              <td className="px-4 py-3 text-gray-700">
                                <p className="font-semibold">{detailProductNameMap.get(item.productId) || item.productId}</p>
                                <p className="text-xs text-gray-500 font-mono">{item.productId}</p>
                              </td>
                              <td className="px-4 py-3 text-gray-700">{item.systemQuantity}</td>
                              <td className="px-4 py-3 text-gray-700">{item.actualQuantity}</td>
                              <td className="px-4 py-3 text-gray-700">{item.difference}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
