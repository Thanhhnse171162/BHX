'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Search, ArrowUpDown, Package, AlertTriangle, RefreshCw, Download } from 'lucide-react'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import useAuthStore from '@/store/auth.store'
import { ProductBatchAPIService, type ProductBatchFromAPI } from '@/services/product-batch-api.service'
import { ProductAPIService, type ProductFromAPI } from '@/services/product-api.service'
import { WarehouseLookupAPIService } from '@/services/warehouse-lookup-api.service'

function normalizeId(value?: string | null): string {
  return String(value || '').trim().toLowerCase()
}

function resolveBatchUnit(row: ProductBatchFromAPI, product?: ProductFromAPI): string {
  return String(row.unit ?? row.Unit ?? product?.unit ?? '').trim()
}

export default function BackroomStockPage() {
  const { user, token } = useAuthStore()

  const [rows, setRows] = useState<ProductBatchFromAPI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<'receivedAt' | 'quantity'>('receivedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const [productMap, setProductMap] = useState<Record<string, ProductFromAPI>>({})
  const [warehouseName, setWarehouseName] = useState('')
  const [splitOpen, setSplitOpen] = useState(false)
  const [splitLoading, setSplitLoading] = useState(false)
  const [splitBatch, setSplitBatch] = useState<ProductBatchFromAPI | null>(null)
  const [allocatedQuantity, setAllocatedQuantity] = useState<number>(0)
  const [splitNotes, setSplitNotes] = useState('')
  const [toast, setToast] = useState('')
  const [exporting, setExporting] = useState(false)
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false)
  const [errorModal, setErrorModal] = useState<{ title: string; message: string; details?: string } | null>(null)
  
  // Edit quantity modal state
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editBatch, setEditBatch] = useState<ProductBatchFromAPI | null>(null)
  const [editQuantity, setEditQuantity] = useState<number>(0)
  const [editReason, setEditReason] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const workplaceId =
    user?.workplaceId ||
    (user as any)?.workplace_id ||
    (user as any)?.workplace?.id ||
    user?.warehouseId ||
    user?.storeId ||
    ''

  const itemsPerPage = 10

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
      setError('Tài khoản chưa được gán kho/cửa hàng để xem tồn kho theo lô.')
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
      for (const p of products) map[normalizeId(p.id)] = p

      setProductMap(map)
      setRows(Array.isArray(batches) ? batches : [])

      try {
        const info = await WarehouseLookupAPIService.getById(workplaceId)
        setWarehouseName(info?.name || '')
      } catch {
        setWarehouseName('')
      }
    } catch {
      setRows([])
      setError('Không thể tải dữ liệu lô theo kho/cửa hàng hiện tại.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, workplaceId])

  const stats = useMemo(() => {
    const totalQuantity = rows.reduce((sum, r) => sum + Math.max(0, Number(r.quantity || 0)), 0)
    const expiredCount = rows.filter(r => String(r.status || '').toUpperCase() === 'EXPIRED').length

    return {
      totalQuantity,
      expiredCount,
      totalBatches: rows.length,
    }
  }, [rows])

  const filteredAndSortedData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()

    const filtered = rows.filter((item) => {
      const product = productMap[normalizeId(item.productId)]
      const productName = String(product?.name || '').toLowerCase()
      const sku = String(product?.sku || '').toLowerCase()
      const status = String(item.status || '').toLowerCase()
      const localWarehouseName = String(warehouseName || '').toLowerCase()

      const matchesSearch =
        !q ||
        String(item.batchNumber || '').toLowerCase().includes(q) ||
        String(item.id || '').toLowerCase().includes(q) ||
        String(item.productId || '').toLowerCase().includes(q) ||
        productName.includes(q) ||
        sku.includes(q) ||
        status.includes(q) ||
        localWarehouseName.includes(q)

      const mfgDate = String(item.manufacturingDate || '').slice(0, 10)
      const expDate = String(item.expiryDate || '').slice(0, 10)

      let matchesDateRange = true
      if (dateFrom && dateTo) {
        matchesDateRange =
          (mfgDate >= dateFrom && mfgDate <= dateTo) ||
          (expDate >= dateFrom && expDate <= dateTo)
      } else if (dateFrom) {
        matchesDateRange = mfgDate >= dateFrom || expDate >= dateFrom
      } else if (dateTo) {
        matchesDateRange = mfgDate <= dateTo || expDate <= dateTo
      }

      return matchesSearch && matchesDateRange
    })

    filtered.sort((a, b) => {
      let aValue: number
      let bValue: number

      if (sortField === 'receivedAt') {
        aValue = new Date(a.receivedAt || a.manufacturingDate || 0).getTime()
        bValue = new Date(b.receivedAt || b.manufacturingDate || 0).getTime()
      } else {
        aValue = Math.abs(Number(a.quantity || 0))
        bValue = Math.abs(Number(b.quantity || 0))
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    })

    return filtered
  }, [rows, productMap, searchTerm, dateFrom, dateTo, sortField, sortOrder, warehouseName])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedData.slice(startIndex, endIndex)
  }, [filteredAndSortedData, currentPage])

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedData.length / itemsPerPage))

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, dateFrom, dateTo])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const handleSort = (field: 'receivedAt' | 'quantity') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const handleExportExpiredBatches = () => {
    setIsExportConfirmOpen(true)
  }

  const confirmExportExpiredBatches = async () => {
    if (!token || !workplaceId) {
      showToast('Vui lòng đảm bảo bạn đã đăng nhập và được gán kho.')
      return
    }

    setExporting(true)
    try {
      const response = await fetch('http://13.229.29.52:5003/api/ProductBatch/expired-batches/create-outbound', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          warehouseId: workplaceId,
          locationType: 'WAREHOUSE',
          locationId: workplaceId,
          notes: 'hết hạn',
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Không thể xuất lô hết hạn' }))
        
        // Phân tích lỗi từ backend
        let errorTitle = 'Lỗi xuất lô hết hạn'
        let errorMessage = error.message || 'Đã xảy ra lỗi khi xuất lô'
        let errorDetails = ''

        if (errorMessage.includes('Insufficient inventory')) {
          errorTitle = 'Tồn kho không đủ'
          errorMessage = 'Không thể xuất lô vì tồn kho không đủ.'
          // Trích xuất thông tin chi tiết từ lỗi
          const match = errorMessage.match(/available (\d+).*required (\d+)/)
          if (match) {
            errorDetails = `Có sẵn: ${match[1]} đơn vị\nYêu cầu: ${match[2]} đơn vị`
          }
        } else if (errorMessage.includes('No expired batches')) {
          errorTitle = '✅ Không có lô hết hạn'
          errorMessage = 'Không có lô nào hết hạn trong kho hiện tại.'
        }

        setErrorModal({
          title: errorTitle,
          message: errorMessage,
          details: errorDetails || undefined,
        })
        setIsExportConfirmOpen(false)
        setExporting(false)
        return
      }

      const data = await response.json()
      const totalBatches = data.data?.totalBatchesProcessed || 0
      const totalQty = data.data?.totalQuantityOutbound || 0
      
      setErrorModal({
        title: '✅ Xuất lô thành công',
        message: `Đã xuất ${totalBatches} lô hết hạn`,
        details: `Tổng số lượng: ${totalQty} đơn vị`,
      })
      
      setIsExportConfirmOpen(false)
      setTimeout(() => setErrorModal(null), 2000)
      await fetchData()
    } catch (err) {
      setErrorModal({
        title: 'Lỗi kết nối',
        message: err instanceof Error ? err.message : 'Không thể kết nối đến server',
      })
      setIsExportConfirmOpen(false)
    } finally {
      setExporting(false)
    }
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

  const openEditModal = (batch: ProductBatchFromAPI) => {
    setEditBatch(batch)
    setEditQuantity(Number(batch.quantity || 0))
    setEditReason('')
    setIsEditOpen(true)
  }

  const submitEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editBatch || editQuantity < 0) {
      showToast('Vui lòng nhập số lượng hợp lệ.')
      return
    }

    setEditLoading(true)
    try {
      const ok = await ProductBatchAPIService.adjustBatchQuantity({
        batchId: editBatch.id,
        newQuantity: editQuantity,
        reason: editReason.trim(),
      })

      setEditLoading(false)

      if (!ok) {
        showToast('Chỉnh sửa số lượng thất bại.')
        return
      }

      setIsEditOpen(false)
      showToast('Chỉnh sửa số lượng thành công.')
      await fetchData()
    } catch (err) {
      setEditLoading(false)
      showToast(err instanceof Error ? err.message : 'Lỗi khi chỉnh sửa số lượng.')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tồn kho theo lô</h1>
          <p className="text-gray-600 mt-1">
            Hiển thị lô theo đúng kho/cửa hàng được gán cho tài khoản hiện tại.
          </p>
          {workplaceId && (
            <p className="text-xs text-gray-500 mt-1">
              Kho hiện tại: {warehouseName || workplaceId}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2" disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Làm mới
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExpiredBatches} className="gap-2" disabled={exporting} style={{ borderColor: '#dc2626', color: '#dc2626' }}>
            <Download size={14} />
            Xuất lô hết hạn
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Tổng tồn kho theo lô</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalQuantity}</p>
              <p className="text-xs text-gray-500 mt-1">đơn vị</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Lô hết hạn</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.expiredCount}</p>
              <p className="text-xs text-gray-500 mt-1">/{stats.totalBatches} lô</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Tìm theo mã lô, sản phẩm, SKU, trạng thái..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {(dateFrom || dateTo) && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                }}
              >
                Xóa bộ lọc ngày
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Mã lô</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Sản phẩm</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Kho</th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center gap-1">
                    Số lượng
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ngày SX</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ngày HSD</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Trạng thái</th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('receivedAt')}
                >
                  <div className="flex items-center gap-1">
                    Nhập lúc
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Không có dữ liệu lô cho kho/cửa hàng hiện tại
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => {
                  const product = productMap[normalizeId(item.productId)]
                  const status = String(item.status || '').toUpperCase()
                  const unit = resolveBatchUnit(item, product)

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{item.batchNumber}</div>
                        <div className="text-xs text-gray-500">ID: {item.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{product?.name || item.productId}</div>
                        <div className="text-xs text-gray-500">{product?.sku || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{warehouseName || workplaceId}</div>
                        <div className="text-xs text-gray-500">{item.warehouseId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-green-600">
                          {Math.max(0, Number(item.quantity || 0))}{unit ? ` ${unit}` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.manufacturingDate ? new Date(item.manufacturingDate).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          status === 'EXPIRED'
                            ? 'bg-red-100 text-red-700'
                            : status === 'AVAILABLE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}>
                          {status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {item.receivedAt ? new Date(item.receivedAt).toLocaleDateString('vi-VN') : '—'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.receivedAt ? new Date(item.receivedAt).toLocaleTimeString('vi-VN') : '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(item)}
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            Chỉnh sửa
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openSplitModal(item)}
                            className="border-green-200 text-green-700 hover:bg-green-50"
                          >
                            Tách lô
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Hiển thị <span className="font-medium">{filteredAndSortedData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> đến{' '}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)}</span>{' '}
              trong <span className="font-medium">{filteredAndSortedData.length}</span> kết quả
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Trước
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? 'bg-[#2d6e3e] text-white' : ''}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Tiếp
              </Button>
            </div>
          </div>
        </div>
      </div>

      {splitOpen && splitBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={onSplitBatch} className="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Tách lô hàng</h3>
              <p className="text-sm text-gray-500 mt-1">Tạo lô mới từ lô hiện tại trong cùng kho.</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm space-y-1">
              <p><span className="text-gray-500">Mã lô gốc:</span> {splitBatch.batchNumber || splitBatch.id}</p>
              <p><span className="text-gray-500">Sản phẩm:</span> {productMap[normalizeId(splitBatch.productId)]?.name || splitBatch.productId}</p>
              <p><span className="text-gray-500">Kho đích:</span> {warehouseName || workplaceId}</p>
              <p>
                <span className="text-gray-500">Số lượng hiện có:</span>{' '}
                {Math.max(0, Number(splitBatch.quantity || 0))}
                {resolveBatchUnit(splitBatch, productMap[normalizeId(splitBatch.productId)])
                  ? ` ${resolveBatchUnit(splitBatch, productMap[normalizeId(splitBatch.productId)])}`
                  : ''}
              </p>
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

      {isEditOpen && editBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submitEdit} className="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Chỉnh sửa số lượng lô hàng</h3>
              <p className="text-sm text-gray-500 mt-1">Dùng để kiểm kê lại số lượng khi phát hiện thiếu hàng hoặc dư hàng.</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm space-y-1">
              <p><span className="text-gray-500">Mã lô:</span> {editBatch.batchNumber || editBatch.id}</p>
              <p><span className="text-gray-500">Sản phẩm:</span> {productMap[normalizeId(editBatch.productId)]?.name || editBatch.productId}</p>
              <p><span className="text-gray-500">Số lượng cũ:</span> {Math.max(0, Number(editBatch.quantity || 0))}{resolveBatchUnit(editBatch, productMap[normalizeId(editBatch.productId)]) ? ` ${resolveBatchUnit(editBatch, productMap[normalizeId(editBatch.productId)])}` : ''}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng mới</label>
              <Input
                type="number"
                min={0}
                value={editQuantity || ''}
                onChange={(e) => setEditQuantity(Number(e.target.value) || 0)}
                placeholder="Nhập số lượng mới"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lý do chỉnh sửa</label>
              <textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Ví dụ: Kiểm kê phát hiện thiếu 5 cái / Dư hàng khi kiểm kê"
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" className="bg-[#2d6e3e] hover:bg-[#245a31]" disabled={editLoading}>
                {editLoading ? 'Đang gửi...' : 'Xác nhận chỉnh sửa'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {isExportConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 space-y-4 shadow-lg">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold text-gray-900">Xuất lô hàng hết hạn</h3>
              <button 
                onClick={() => setIsExportConfirmOpen(false)}
                disabled={exporting}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <p className="text-sm text-gray-700">
              Bạn có chắc chắn muốn xuất tất cả các lô hàng hết hạn khỏi kho?
            </p>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-sm text-blue-900">
                ⓘ Hệ thống sẽ tạo phiếu xuất kho (outbound) cho tất cả các lô hàng có ngày hết hạn đã qua.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsExportConfirmOpen(false)}
                disabled={exporting}
                className="text-gray-700"
              >
                Hủy
              </Button>
              <button
                onClick={confirmExportExpiredBatches}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {exporting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {!exporting && <Download size={16} />}
                {exporting ? 'Đang xử lý...' : 'Xuất ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 space-y-4 shadow-lg">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{errorModal.title}</h3>
              <p className="text-sm text-gray-600 mt-2">{errorModal.message}</p>
              {errorModal.details && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-line">{errorModal.details}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setErrorModal(null)}
                className="text-gray-700"
              >
                Đóng
              </Button>
            </div>
          </div>
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
