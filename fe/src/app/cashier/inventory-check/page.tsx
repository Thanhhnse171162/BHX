"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  Eye,
  Loader2,
  Package,
  Search,
  X,
} from 'lucide-react'
import {
  getInventoryCheckById,
  getInventoryChecks,
  submitInventoryCheck,
  type InventoryCheckDto,
  type InventoryCheckListDto,
  type SubmitInventoryCheckDto,
} from '@/services/inventory-check-api'
import { InventoryAPIService, type InventoryItem } from '@/services/inventory-api.service'
import { ProductAPIService, type ProductFromAPI } from '@/services/product-api.service'
import { useAuthStore } from '@/store/auth.store'

type ModalInventoryItem = {
  productId: string
  productName: string
  sku: string
  category: string
  systemQty: number
  unit: string
}

const PAGE_SIZE = 8

function normalizeLocationType(value?: string | null): 'STORE' | 'WAREHOUSE' | null {
  const upper = String(value || '').toUpperCase()
  if (upper === 'STORE' || upper === 'WAREHOUSE') return upper
  return null
}

function mapInventoryToModalItems(inventory: InventoryItem[], productMap: Map<string, ProductFromAPI>): ModalInventoryItem[] {
  return inventory.map((item) => {
    const product = productMap.get(item.productId)
    return {
      productId: item.productId,
      productName: item.product?.name || item.productName || item.name || product?.name || 'Unknown Product',
      sku: item.product?.sku || item.sku || product?.sku || 'N/A',
      category: item.product?.categoryName || item.categoryName || product?.categoryName || 'Uncategorized',
      systemQty: item.quantity,
      unit: item.product?.unit || item.unit || product?.unit || '',
    }
  })
}

export default function CashierInventoryCheckPage() {
  const { user, hydrated } = useAuthStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checks, setChecks] = useState<InventoryCheckListDto[]>([])

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [showCheckModal, setShowCheckModal] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [activeCheck, setActiveCheck] = useState<InventoryCheckListDto | null>(null)
  const [modalItems, setModalItems] = useState<ModalInventoryItem[]>([])
  const [actualMap, setActualMap] = useState<Map<string, number>>(new Map())
  const [submitting, setSubmitting] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [detailsData, setDetailsData] = useState<InventoryCheckDto | null>(null)
  const [detailProductNameMap, setDetailProductNameMap] = useState<Map<string, string>>(new Map())

  const loadChecks = useCallback(async () => {
    if (!hydrated || !user?.workplaceId) {
      setChecks([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const all = await getInventoryChecks()
      const locationId = String(user.workplaceId).trim().toLowerCase()
      const filtered = all.filter((check) => String(check.locationId || '').trim().toLowerCase() === locationId)
      setChecks(filtered)
      setPage(1)
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tải danh sách phiếu kiểm kê.'
      setError(message)
      setChecks([])
    } finally {
      setLoading(false)
    }
  }, [hydrated, user?.workplaceId])

  useEffect(() => {
    void loadChecks()
  }, [loadChecks])

  const filteredChecks = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return checks

    return checks.filter((check) => {
      const checkNumber = String(check.checkNumber || '').toLowerCase()
      const locationId = String(check.locationId || '').toLowerCase()
      return checkNumber.includes(keyword) || locationId.includes(keyword)
    })
  }, [checks, search])

  const totalPages = Math.max(1, Math.ceil(filteredChecks.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageChecks = filteredChecks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const checkedCount = actualMap.size
  const discrepancyCount = useMemo(() => {
    return modalItems.filter((item) => {
      const actual = actualMap.get(item.productId)
      return actual !== undefined && actual !== item.systemQty
    }).length
  }, [actualMap, modalItems])

  const openCheckModal = async (check: InventoryCheckListDto) => {
    const status = String(check.status || '').toUpperCase()
    if (status === 'COMPLETED' || status === 'APPROVED') return

    setActiveCheck(check)
    setShowCheckModal(true)
    setModalLoading(true)
    setModalError(null)
    setActualMap(new Map())
    setModalItems([])

    try {
      if (!hydrated) throw new Error('Đang tải thông tin tài khoản. Vui lòng thử lại.')

      const locationType = normalizeLocationType(user?.workplaceType)
      const locationId = user?.workplaceId?.trim()
      if (!locationType || !locationId) throw new Error('Tài khoản chưa được gán kho/cửa hàng.')

      const [inventoryData, productsData] = await Promise.all([
        InventoryAPIService.getInventoryByLocation(locationType, locationId),
        ProductAPIService.getAllProducts(),
      ])

      const productMap = new Map<string, ProductFromAPI>()
      productsData.forEach((p) => productMap.set(p.id, p))

      const mapped = mapInventoryToModalItems(inventoryData, productMap)
      setModalItems(mapped)
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu kiểm kê.'
      setModalError(message)
    } finally {
      setModalLoading(false)
    }
  }

  const closeCheckModal = () => {
    if (submitting) return
    setShowCheckModal(false)
    setActiveCheck(null)
    setModalItems([])
    setActualMap(new Map())
    setModalError(null)
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

  const onQtyChange = (productId: string, value: string) => {
    const next = new Map(actualMap)
    if (value === '') {
      next.delete(productId)
    } else {
      next.set(productId, Number.parseInt(value, 10) || 0)
    }
    setActualMap(next)
  }

  const submitCheckItems = async () => {
    if (!activeCheck) return
    if (actualMap.size === 0) {
      alert('Vui lòng nhập số lượng thực tế ít nhất 1 sản phẩm.')
      return
    }

    setSubmitting(true)

    try {
      const payload: SubmitInventoryCheckDto = {
        items: Array.from(actualMap.entries()).map(([productId, actualQuantity]) => ({
          productId,
          actualQuantity,
          note: '',
        })),
      }

      await submitInventoryCheck(activeCheck.id, payload)
      await loadChecks()
      closeCheckModal()
      alert('Đã gửi kết quả kiểm kê thành công.')
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể gửi kết quả kiểm kê.'
      alert(`Lỗi: ${message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const statusLabel = (status?: string) => {
    const value = String(status || '').toUpperCase()
    if (value === 'COMPLETED' || value === 'APPROVED') return 'Hoàn thành'
    if (value === 'PENDING') return 'Chờ xử lý'
    if (value === 'IN_PROGRESS') return 'Đang kiểm kê'
    return status || '--'
  }

  const statusClass = (status?: string) => {
    const value = String(status || '').toUpperCase()
    if (value === 'COMPLETED' || value === 'APPROVED') return 'bg-emerald-100 text-emerald-700'
    if (value === 'PENDING') return 'bg-amber-100 text-amber-700'
    return 'bg-blue-100 text-blue-700'
  }

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Phiếu kiểm kê từ quản lý</h2>
          <p className="text-sm text-gray-500 mt-1">Nhập số lượng thực tế và gửi kết quả kiểm kê.</p>
        </div>

        {error && (
          <div className="px-5 py-4 bg-red-50 border-b border-red-200">
            <div className="text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
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
              placeholder="Tìm mã phiếu..."
              className="pl-9 pr-3 h-10 w-full rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left">Mã phiếu</th>
                <th className="px-5 py-3 text-left">Ngày kiểm</th>
                <th className="px-5 py-3 text-left">Trạng thái</th>
                <th className="px-5 py-3 text-left">Chênh lệch</th>
                <th className="px-5 py-3 text-left">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-5 py-12 text-center text-gray-500" colSpan={5}>
                    <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : pageChecks.length === 0 ? (
                <tr>
                  <td className="px-5 py-12 text-center text-gray-500" colSpan={5}>
                    Chưa có phiếu kiểm kê nào
                  </td>
                </tr>
              ) : (
                pageChecks.map((check) => {
                  const isDone = ['COMPLETED', 'APPROVED'].includes(String(check.status || '').toUpperCase())
                  return (
                    <tr key={check.id} className="border-t border-gray-100 hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-[#2563eb]">#{check.checkNumber || check.id}</p>
                        <p className="text-xs text-gray-500">{String(check.id).slice(0, 8)}...</p>
                      </td>
                      <td className="px-5 py-4 text-gray-700 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {String(check.checkDate || check.createdAt || '').slice(0, 10)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass(check.status)}`}>
                          {statusLabel(check.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-700 font-semibold">{check.totalDiscrepancies || 0}</td>
                      <td className="px-5 py-4">
                        {isDone ? (
                          <button
                            onClick={() => openDetailsModal(check.id)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Chi tiết
                          </button>
                        ) : (
                          <button
                            onClick={() => openCheckModal(check)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            Bắt đầu kiểm kê
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredChecks.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredChecks.length)} trên {filteredChecks.length} phiếu
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
                    className={`w-8 h-8 rounded-md text-sm font-semibold ${currentPage === num ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600'}`}
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
      </section>

      {showCheckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeCheckModal} />
          <section className="relative z-10 w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Kiểm kê phiếu {activeCheck?.checkNumber}</h3>
                <p className="text-xs text-gray-500 mt-1">Nhập số lượng thực tế để gửi kết quả kiểm kê.</p>
              </div>
              <button onClick={closeCheckModal} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mx-5 mt-4 rounded-xl px-4 py-3 border bg-red-50 border-red-200">
                <p className="text-sm text-red-700">{modalError}</p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5">
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">Sản phẩm</th>
                      <th className="px-4 py-3 text-left">SKU</th>
                      <th className="px-4 py-3 text-left">SL hệ thống</th>
                      <th className="px-4 py-3 text-left">SL thực tế</th>
                      <th className="px-4 py-3 text-left">Chênh lệch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalLoading ? (
                      <tr>
                        <td className="px-4 py-10 text-center text-gray-500" colSpan={5}>
                          <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                          Đang tải tồn kho...
                        </td>
                      </tr>
                    ) : modalItems.length === 0 ? (
                      <tr>
                        <td className="px-4 py-10 text-center text-gray-500" colSpan={5}>
                          <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          Không có sản phẩm để kiểm kê
                        </td>
                      </tr>
                    ) : (
                      modalItems.map((item) => {
                        const actual = actualMap.get(item.productId)
                        const diff = actual === undefined ? null : actual - item.systemQty
                        return (
                          <tr key={item.productId} className="border-t border-gray-100">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-900">{item.productName}</p>
                              <p className="text-xs text-gray-500">{item.category}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{item.sku}</td>
                            <td className="px-4 py-3 text-gray-700 font-semibold">{item.systemQty} {item.unit}</td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                value={actual === undefined ? '' : actual}
                                onChange={(e) => onQtyChange(item.productId, e.target.value)}
                                placeholder="Nhập số lượng"
                                className="w-32 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </td>
                            <td className="px-4 py-3">
                              {diff === null ? (
                                <span className="text-sm text-gray-300">--</span>
                              ) : diff === 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                  <CheckCircle className="w-3.5 h-3.5" />0
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  {diff > 0 ? `+${diff}` : diff}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {!modalLoading && modalItems.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center">
                    <p className="text-3xl font-bold text-gray-900">{checkedCount}</p>
                    <p className="text-sm text-gray-500 mt-1 inline-flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />Đã kiểm tra
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center">
                    <p className="text-3xl font-bold text-gray-900">{modalItems.length}</p>
                    <p className="text-sm text-gray-500 mt-1">Tổng sản phẩm</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center">
                    <p className="text-3xl font-bold text-gray-900">{discrepancyCount}</p>
                    <p className="text-sm text-gray-500 mt-1">Chênh lệch</p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={closeCheckModal}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                onClick={submitCheckItems}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
                disabled={submitting || modalLoading || modalItems.length === 0}
              >
                {submitting ? 'Đang gửi...' : 'Gửi kết quả kiểm kê'}
              </button>
            </div>
          </section>
        </div>
      )}

      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDetailsModal(false)} />
          <section className="relative z-10 w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Chi tiết phiếu kiểm kê</h3>
                <p className="text-xs text-gray-500 mt-1">Xem thông tin và kết quả kiểm kê của phiếu.</p>
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
                      <p className="text-sm font-semibold text-gray-900 mt-1">{statusLabel(detailsData.status)}</p>
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
    </div>
  )
}
