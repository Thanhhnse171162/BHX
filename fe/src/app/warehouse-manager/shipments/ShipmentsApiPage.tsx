'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import {
  ProductBatchAPIService,
  ProductBatchFromAPI,
  ProductBatchDetailFromAPI,
} from '@/services/product-batch-api.service'

type BatchStatus = 'all' | 'AVAILABLE' | 'NEAR_EXPIRY' | 'EXPIRED' | 'OUT_OF_STOCK'

function normalizeId(value?: string | null): string {
  return String(value ?? '').trim()
}

function mapStatus(s?: string): Exclude<BatchStatus, 'all'> {
  const status = String(s ?? '').toUpperCase()
  if (status === 'EXPIRED') return 'EXPIRED'
  if (status === 'NEAR_EXPIRY') return 'NEAR_EXPIRY'
  if (status === 'OUT_OF_STOCK') return 'OUT_OF_STOCK'
  return 'AVAILABLE'
}

function statusLabel(status: string): string {
  const mapped = mapStatus(status)
  if (mapped === 'EXPIRED') return 'Hết hạn'
  if (mapped === 'NEAR_EXPIRY') return 'Sắp hết hạn'
  if (mapped === 'OUT_OF_STOCK') return 'Hết tồn'
  return 'Còn hàng'
}

export default function ShipmentsApiPage() {
  const { user, hydrated } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [batches, setBatches] = useState<ProductBatchFromAPI[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<BatchStatus>('all')
  const [selectedBatchId, setSelectedBatchId] = useState<string>('')
  const [toast, setToast] = useState('')

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState<ProductBatchDetailFromAPI | null>(null)

  const [allocateOpen, setAllocateOpen] = useState(false)
  const [allocateLoading, setAllocateLoading] = useState(false)
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('')
  const [allocateQuantity, setAllocateQuantity] = useState<number>(0)
  const [shippingDate, setShippingDate] = useState('')

  const [receiveOpen, setReceiveOpen] = useState(false)
  const [receiveLoading, setReceiveLoading] = useState(false)
  const [supplierId, setSupplierId] = useState('')
  const [receiveBatchId, setReceiveBatchId] = useState('')
  const [receiveQuantity, setReceiveQuantity] = useState<number>(0)

  const workplaceId = useMemo(
    () =>
      normalizeId(
        user?.workplaceId ||
          (user as any)?.workplace_id ||
          (user as any)?.workplace?.id ||
          user?.warehouseId ||
          user?.storeId ||
          ''
      ),
    [user]
  )

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const fetchBatches = async () => {
    if (!hydrated) return
    if (!workplaceId) {
      setBatches([])
      setError('Tài khoản chưa được gán kho để tải lô hàng.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await ProductBatchAPIService.getByWarehouse(workplaceId)
      setBatches(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setError('Không thể tải danh sách lô hàng.')
      setBatches([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, workplaceId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return batches.filter((b) => {
      const st = mapStatus(b.status)
      const matchesStatus = status === 'all' || st === status
      const matchesSearch =
        !q ||
        String(b.id).toLowerCase().includes(q) ||
        String(b.batchNumber).toLowerCase().includes(q) ||
        String(b.productId).toLowerCase().includes(q) ||
        String(b.supplier).toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [batches, search, status])

  const selectedBatch = useMemo(
    () => filtered.find((b) => b.id === selectedBatchId) ?? null,
    [filtered, selectedBatchId]
  )

  const openDetail = async (batchId: string) => {
    setDetailOpen(true)
    setDetailLoading(true)
    setDetail(null)
    try {
      const data = await ProductBatchAPIService.getById(batchId)
      setDetail(data)
    } finally {
      setDetailLoading(false)
    }
  }

  const onAllocate = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedBatchId || !destinationWarehouseId || !shippingDate || allocateQuantity <= 0) {
      showToast('Vui lòng nhập đủ thông tin phân bổ.')
      return
    }
    setAllocateLoading(true)
    const ok = await ProductBatchAPIService.allocateBatch({
      batchId: selectedBatchId,
      quantity: allocateQuantity,
      destinationWarehouseId,
      shippingDate,
    })
    setAllocateLoading(false)
    if (!ok) {
      showToast('Allocate batch thất bại.')
      return
    }
    setAllocateOpen(false)
    showToast('Tạo phiếu xuất/chuyển thành công.')
    await fetchBatches()
  }

  const onReceive = async (e: FormEvent) => {
    e.preventDefault()
    if (!supplierId || !receiveBatchId || receiveQuantity <= 0) {
      showToast('Vui lòng nhập đủ thông tin nhập từ nhà cung cấp.')
      return
    }
    setReceiveLoading(true)
    const ok = await ProductBatchAPIService.receiveFromSupplier({
      supplierId,
      batchId: receiveBatchId,
      quantity: receiveQuantity,
    })
    setReceiveLoading(false)
    if (!ok) {
      showToast('Nhập hàng từ NCC thất bại.')
      return
    }
    setReceiveOpen(false)
    showToast('Nhập hàng từ NCC thành công.')
    await fetchBatches()
  }

  const onExpiredOutbound = async (batch: ProductBatchFromAPI) => {
    const ok = await ProductBatchAPIService.createOutboundForExpiredBatches({
      batchId: batch.id,
      quantity: Math.max(1, Number(batch.quantity || 0)),
    })
    if (!ok) {
      showToast('Tạo phiếu xuất cho hàng hết hạn thất bại.')
      return
    }
    showToast(`Đã tạo phiếu xuất hàng hết hạn cho lô ${batch.batchNumber}.`)
    await fetchBatches()
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lô hàng</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý lô và tạo phiếu xuất/chuyển theo kho hiện tại</p>
          <p className="text-xs text-slate-500 mt-1">warehouseId: {workplaceId || '—'}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setReceiveOpen(true)}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm hover:bg-slate-100"
          >
            Nhận hàng từ NCC
          </button>
          <button
            onClick={() => setAllocateOpen(true)}
            disabled={!selectedBatchId}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            Tạo phiếu xuất/chuyển
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm mã lô, productId, nhà cung cấp..."
          className="h-10 px-3 border border-slate-200 rounded-lg text-sm w-80"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as BatchStatus)}
          className="h-10 px-3 border border-slate-200 rounded-lg text-sm"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="AVAILABLE">Còn hàng</option>
          <option value="NEAR_EXPIRY">Sắp hết hạn</option>
          <option value="EXPIRED">Hết hạn</option>
          <option value="OUT_OF_STOCK">Hết tồn</option>
        </select>
        <button onClick={fetchBatches} className="h-10 px-4 border border-slate-200 rounded-lg text-sm hover:bg-slate-100">
          Làm mới
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left">
              <th className="p-3">Chọn</th>
              <th className="p-3">Mã lô</th>
              <th className="p-3">Product</th>
              <th className="p-3">Số lượng</th>
              <th className="p-3">Nhà cung cấp</th>
              <th className="p-3">HSD</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-6 text-center text-slate-500" colSpan={8}>Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="p-6 text-center text-slate-500" colSpan={8}>Không có lô hàng</td></tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="p-3">
                    <input
                      type="radio"
                      name="selected-batch"
                      checked={selectedBatchId === b.id}
                      onChange={() => setSelectedBatchId(b.id)}
                    />
                  </td>
                  <td className="p-3 font-mono text-xs text-emerald-700">{b.batchNumber || b.id}</td>
                  <td className="p-3">{b.productId}</td>
                  <td className="p-3 font-semibold">{Number(b.quantity || 0).toLocaleString()}</td>
                  <td className="p-3">{b.supplier || '—'}</td>
                  <td className="p-3">{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString('vi-VN') : '—'}</td>
                  <td className="p-3">{statusLabel(b.status)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDetail(b.id)}
                        className="px-2.5 py-1 border border-slate-200 rounded-md text-xs hover:bg-slate-50"
                      >
                        Chi tiết
                      </button>
                      {mapStatus(b.status) === 'EXPIRED' && (
                        <button
                          onClick={() => onExpiredOutbound(b)}
                          className="px-2.5 py-1 border border-red-300 text-red-600 rounded-md text-xs hover:bg-red-50"
                        >
                          Xử lý hết hạn
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {detailOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Chi tiết lô hàng</h3>
              <button onClick={() => setDetailOpen(false)} className="text-slate-500">Dong</button>
            </div>
            <div className="p-4 text-sm">
              {detailLoading ? (
                <p className="text-slate-500">Đang tải chi tiết...</p>
              ) : !detail ? (
                <p className="text-slate-500">Không có dữ liệu chi tiết.</p>
              ) : (
                <div className="space-y-2">
                  <p><span className="text-slate-500">Batch:</span> {detail.batchNumber || detail.id}</p>
                  <p><span className="text-slate-500">Product:</span> {detail.productId}</p>
                  <p><span className="text-slate-500">Warehouse:</span> {detail.warehouseId}</p>
                  <p><span className="text-slate-500">Số lượng:</span> {Number(detail.quantity || 0).toLocaleString()}</p>
                  <p><span className="text-slate-500">HSD:</span> {detail.expiryDate || '—'}</p>
                  <p><span className="text-slate-500">Trạng thái:</span> {statusLabel(detail.status)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {allocateOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={onAllocate} className="w-full max-w-lg bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="font-semibold text-slate-800">Tạo phiếu xuất/chuyển</h3>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm"
            >
              <option value="">Chọn lô hàng</option>
              {filtered.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber || b.id} - Ton: {Number(b.quantity || 0)}
                </option>
              ))}
            </select>
            <input
              value={destinationWarehouseId}
              onChange={(e) => setDestinationWarehouseId(e.target.value)}
              placeholder="destinationWarehouseId"
              className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm"
            />
            <input
              type="number"
              min={1}
              value={allocateQuantity || ''}
              onChange={(e) => setAllocateQuantity(Number(e.target.value) || 0)}
              placeholder="Số lượng phân bổ"
              className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm"
            />
            <input
              type="date"
              value={shippingDate}
              onChange={(e) => setShippingDate(e.target.value)}
              className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setAllocateOpen(false)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
              <button disabled={allocateLoading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">
                {allocateLoading ? 'Đang gửi...' : 'Phân bổ'}
              </button>
            </div>
          </form>
        </div>
      )}

      {receiveOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={onReceive} className="w-full max-w-lg bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="font-semibold text-slate-800">Nhận hàng từ nhà cung cấp</h3>
            <input
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              placeholder="supplierId"
              className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm"
            />
            <input
              value={receiveBatchId}
              onChange={(e) => setReceiveBatchId(e.target.value)}
              placeholder="batchId"
              className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm"
            />
            <input
              type="number"
              min={1}
              value={receiveQuantity || ''}
              onChange={(e) => setReceiveQuantity(Number(e.target.value) || 0)}
              placeholder="Số lượng"
              className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setReceiveOpen(false)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
              <button disabled={receiveLoading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">
                {receiveLoading ? 'Đang gửi...' : 'Nhập kho'}
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <div className="fixed right-6 bottom-6 bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm shadow-lg">
          {toast}
        </div>
      )}

      {selectedBatch && (
        <div className="text-xs text-slate-500">
          Dang chon: {selectedBatch.batchNumber || selectedBatch.id} - Ton {Number(selectedBatch.quantity || 0).toLocaleString()}
        </div>
      )}
    </div>
  )
}
