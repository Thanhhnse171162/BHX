'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Search, RefreshCw, Package, AlertTriangle } from 'lucide-react'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import useAuthStore from '@/store/auth.store'
import { ProductBatchAPIService, type ProductBatchFromAPI } from '@/services/product-batch-api.service'
import { ProductAPIService, type ProductFromAPI } from '@/services/product-api.service'
import { WarehouseLookupAPIService } from '@/services/warehouse-lookup-api.service'

function normalizeId(value?: string | null): string {
  return String(value || '').trim().toLowerCase()
}

type BatchStatusFilter = 'Tất cả' | 'AVAILABLE' | 'NEAR_EXPIRY' | 'EXPIRED' | 'OUT_OF_STOCK'

const STATUS_OPTIONS: BatchStatusFilter[] = ['Tất cả', 'AVAILABLE', 'NEAR_EXPIRY', 'EXPIRED', 'OUT_OF_STOCK']
const PAGE_SIZE = 10

function statusLabel(status?: string) {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'NEAR_EXPIRY') return 'Cận date'
  if (normalized === 'EXPIRED') return 'Hết hạn'
  if (normalized === 'OUT_OF_STOCK') return 'Hết tồn'
  return 'Còn hàng'
}

export default function InventoryAuxPage() {
  const { user, token } = useAuthStore()

  const [rows, setRows] = useState<ProductBatchFromAPI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<BatchStatusFilter>('Tất cả')
  const [page, setPage] = useState(1)

  const [productMap, setProductMap] = useState<Record<string, ProductFromAPI>>({})
  const [warehouseName, setWarehouseName] = useState('')
  const [splitOpen, setSplitOpen] = useState(false)
  const [splitLoading, setSplitLoading] = useState(false)
  const [splitBatch, setSplitBatch] = useState<ProductBatchFromAPI | null>(null)
  const [allocatedQuantity, setAllocatedQuantity] = useState<number>(0)
  const [splitNotes, setSplitNotes] = useState('')
  const [toast, setToast] = useState('')

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
      setIsLoading(false)
      setError('Bạn chưa đăng nhập.')
      return
    }

    if (!workplaceId) {
      setRows([])
      setIsLoading(false)
      setError('Tài khoản chưa được gán cửa hàng/kho để xem dữ liệu lô.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const [batches, products] = await Promise.all([
        ProductBatchAPIService.getByWarehouse(workplaceId),
        ProductAPIService.getAllProducts().catch(() => []),
      ])

      const map: Record<string, ProductFromAPI> = {}
      for (const p of products) {
        map[normalizeId(p.id)] = p
      }

      setProductMap(map)
      setRows(Array.isArray(batches) ? batches : [])

      try {
        const warehouse = await WarehouseLookupAPIService.getById(workplaceId)
        setWarehouseName(warehouse?.name || '')
      } catch {
        setWarehouseName('')
      }
    } catch {
      setRows([])
      setError('Không thể tải dữ liệu lô từ hệ thống BE.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, workplaceId])

  const stats = useMemo(() => {
    const totalQty = rows.reduce((sum, r) => sum + Math.max(0, Number(r.quantity || 0)), 0)
    const nearExpiry = rows.filter((r) => String(r.status || '').toUpperCase() === 'NEAR_EXPIRY').length
    const expired = rows.filter((r) => String(r.status || '').toUpperCase() === 'EXPIRED').length

    return {
      totalBatches: rows.length,
      totalQty,
      nearExpiry,
      expired,
    }
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return rows.filter((row) => {
      const status = String(row.status || '').toUpperCase()
      const product = productMap[normalizeId(row.productId)]
      const productName = String(product?.name || '').toLowerCase()
      const sku = String(product?.sku || '').toLowerCase()

      const matchesStatus = statusFilter === 'Tất cả' || status === statusFilter
      const matchesSearch =
        !q ||
        String(row.batchNumber || '').toLowerCase().includes(q) ||
        String(row.id || '').toLowerCase().includes(q) ||
        String(row.productId || '').toLowerCase().includes(q) ||
        productName.includes(q) ||
        sku.includes(q) ||
        String(row.supplier || '').toLowerCase().includes(q)

      return matchesStatus && matchesSearch
    })
  }, [rows, productMap, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const formatNumber = (value: number) => new Intl.NumberFormat('vi-VN').format(value)

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const openSplitModal = (batch: ProductBatchFromAPI) => {
    setSplitBatch(batch)
    setAllocatedQuantity(0)
    setSplitNotes('')
    setSplitOpen(true)
  }

  const onSplitBatch = async (e: FormEvent) => {
    e.preventDefault()
    if (!splitBatch || !workplaceId || allocatedQuantity <= 0) {
      showToast('Vui lòng nhập đủ thông tin tách lô.')
      return
    }

    const availableQty = Math.max(0, Number(splitBatch.quantity || 0))
    if (allocatedQuantity > availableQty) {
      showToast('Số lượng tách vượt quá số lượng hiện có.')
      return
    }

    setSplitLoading(true)
    const ok = await ProductBatchAPIService.allocateBatch({
      sourceBatchId: splitBatch.id,
      allocatedQuantity,
      targetWarehouseId: workplaceId,
      notes: splitNotes.trim(),
    })
    setSplitLoading(false)

    if (!ok) {
      showToast('Tách lô thất bại.')
      return
    }

    setSplitOpen(false)
    showToast('Tách lô thành công.')
    await fetchData()
  }

  return (
    <div className="p-6 space-y-4 bg-[#f5f7fb] min-h-screen">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[30px] leading-[32px] font-extrabold text-slate-900">Lô hàng cửa hàng</h1>
          {workplaceId && (
            <p className="text-xs text-slate-500 mt-1">Cửa hàng hiện tại: {warehouseName || workplaceId}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-2" disabled={isLoading}>
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[12px] text-slate-500 font-semibold">Tổng số lô</p>
          <p className="text-[30px] font-extrabold text-slate-900 mt-1">{formatNumber(stats.totalBatches)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[12px] text-slate-500 font-semibold">Tổng số lượng</p>
          <p className="text-[30px] font-extrabold text-green-600 mt-1">{formatNumber(stats.totalQty)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-slate-500 font-semibold">Lô cận date</p>
            <AlertTriangle size={14} className="text-amber-500" />
          </div>
          <p className="text-[30px] font-extrabold text-amber-600 mt-1">{formatNumber(stats.nearExpiry)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-slate-500 font-semibold">Lô hết hạn</p>
            <Package size={14} className="text-red-500" />
          </div>
          <p className="text-[30px] font-extrabold text-red-600 mt-1">{formatNumber(stats.expired)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
              Trạng thái
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as BatchStatusFilter)}
                className="block mt-1 min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === 'Tất cả' ? status : statusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
              Tìm kiếm
              <div className="relative mt-1 min-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Mã lô, sản phẩm, SKU, nhà cung cấp"
                  className="pl-9"
                />
              </div>
            </label>
          </div>
          <p className="text-[12px] text-slate-500">Đang hiển thị {Math.min(filtered.length, PAGE_SIZE)} trong {filtered.length} lô</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Mã lô', 'Sản phẩm', 'Nhà cung cấp', 'Số lượng', 'Ngày SX', 'Ngày HSD', 'Trạng thái', 'Nhập lúc', 'Thao tác'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 text-[13px]">Đang tải dữ liệu...</td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 text-[13px]">Không có dữ liệu lô cho cửa hàng hiện tại</td>
                </tr>
              ) : (
                paged.map((row) => {
                  const product = productMap[normalizeId(row.productId)]
                  const status = String(row.status || '').toUpperCase()

                  return (
                    <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{row.batchNumber || row.id}</div>
                        <div className="text-[11px] text-slate-400">ID: {row.id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{product?.name || row.productId}</div>
                        <div className="text-[11px] text-slate-400">{product?.sku || row.productId}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{row.supplier || '—'}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-green-600">{formatNumber(Math.max(0, Number(row.quantity || 0)))}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {row.manufacturingDate ? new Date(row.manufacturingDate).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                            status === 'EXPIRED'
                              ? 'bg-red-100 text-red-700'
                              : status === 'NEAR_EXPIRY'
                                ? 'bg-amber-100 text-amber-700'
                                : status === 'OUT_OF_STOCK'
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {statusLabel(status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {row.receivedAt ? new Date(row.receivedAt).toLocaleString('vi-VN') : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openSplitModal(row)}
                          className="border-green-200 text-green-700 hover:bg-green-50"
                        >
                          Tách lô
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <p className="text-[12px] text-slate-500">
            Hiển thị {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} lô
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Trước
            </Button>
            <span className="text-[12px] text-slate-600">Trang {page}/{totalPages}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Sau
            </Button>
          </div>
        </div>
      </div>

      {splitOpen && splitBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={onSplitBatch} className="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Tách lô hàng</h3>
              <p className="text-sm text-gray-500 mt-1">Tạo lô mới từ lô hiện tại trong cùng cửa hàng.</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm space-y-1">
              <p><span className="text-gray-500">Mã lô gốc:</span> {splitBatch.batchNumber || splitBatch.id}</p>
              <p><span className="text-gray-500">Sản phẩm:</span> {productMap[normalizeId(splitBatch.productId)]?.name || splitBatch.productId}</p>
              <p><span className="text-gray-500">Cửa hàng đích:</span> {warehouseName || workplaceId}</p>
              <p><span className="text-gray-500">Số lượng hiện có:</span> {Math.max(0, Number(splitBatch.quantity || 0))}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng tách</label>
              <Input
                type="number"
                min={1}
                value={allocatedQuantity || ''}
                onChange={(e) => setAllocatedQuantity(Number(e.target.value) || 0)}
                placeholder="Nhập allocatedQuantity"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lý do / Ghi chú</label>
              <textarea
                value={splitNotes}
                onChange={(e) => setSplitNotes(e.target.value)}
                placeholder="Nhập notes"
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSplitOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" className="bg-[#2d6e3e] hover:bg-[#245a31]" disabled={splitLoading}>
                {splitLoading ? 'Đang gửi...' : 'Xác nhận tách lô'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 rounded-xl bg-green-700 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
