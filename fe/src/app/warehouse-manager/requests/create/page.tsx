'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save, Loader2, AlertCircle } from 'lucide-react'
import { TransferAPIService, CreateTransferDTO, TransferFromAPI } from '@/services/transfer-api.service'
import { ProductAPIService, ProductFromAPI } from '@/services/product-api.service'
import { useAuthStore } from '@/store/auth.store'

interface TransferItem {
  id: string
  productName: string
  productId: string
  sku: string
  quantity: number
  unit: string
  batchId?: string
}

interface WarehouseLocation {
  id: string
  name: string
  parentId?: string | null
  parent_id?: string | null
}

type LocationType = 'WAREHOUSE' | 'STORE'

export default function CreateTransferOrderPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)

  const [items, setItems] = useState<TransferItem[]>([])
  const [formData, setFormData] = useState({
    fromLocationType: 'WAREHOUSE' as LocationType,
    fromLocationId: '',
    toLocationType: 'STORE' as LocationType,
    toLocationId: '',
    expectedDelivery: '',
    shippedBy: user?.name || user?.email || '',
    notes: ''
  })

  const [newItem, setNewItem] = useState({
    quantity: '',
    batchId: ''
  })
  const [selectedProduct, setSelectedProduct] = useState<ProductFromAPI | null>(null)

  // Autocomplete sản phẩm
  const [products, setProducts] = useState<ProductFromAPI[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const productInputRef = useRef<HTMLInputElement>(null)

  // Warehouses/Stores
  const [locations, setLocations] = useState<WarehouseLocation[]>([])
  const [loadingLocations, setLoadingLocations] = useState(true)

  // States for submission
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  // Load products
  useEffect(() => {
    ProductAPIService.getAllProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
  }, [])

  // Load warehouses and stores
  useEffect(() => {
    setLoadingLocations(true)
    fetch('/api/warehouses', {
      headers: { Authorization: `Bearer ${token ?? ''}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
        setLocations(
          raw.map((w: any) => ({
            id: w.id,
            name: w.name ?? w.code ?? w.id,
            parentId: w.parentId ?? w.parent_id ?? null,
            parent_id: w.parent_id ?? w.parentId ?? null,
          }))
        )
      })
      .catch(() => setLocations([]))
      .finally(() => setLoadingLocations(false))
  }, [token])

  const handleAddItem = () => {
    if (selectedProduct && newItem.quantity) {
      const quantity = parseInt(newItem.quantity)
      if (quantity <= 0) {
        alert('Vui lòng nhập số lượng lớn hơn 0')
        return
      }

      setItems([
        ...items,
        {
          id: Date.now().toString(),
          productName: selectedProduct.name,
          productId: selectedProduct.id,
          sku: selectedProduct.sku,
          unit: selectedProduct.unit || 'Cái',
          quantity: quantity,
          batchId: newItem.batchId || undefined
        }
      ])
      setNewItem({ quantity: '', batchId: '' })
      setProductSearch('')
      setSelectedProduct(null)
    } else {
      alert('Vui lòng chọn sản phẩm và nhập số lượng')
    }
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleSubmit = async () => {
    // Validate form
    if (!formData.fromLocationId) {
      alert('Vui lòng chọn kho/cửa hàng nguồn')
      return
    }
    if (!formData.toLocationId) {
      alert('Vui lòng chọn kho/cửa hàng đích')
      return
    }
    if (items.length === 0) {
      alert('Vui lòng thêm ít nhất một sản phẩm')
      return
    }
    if (formData.fromLocationId === formData.toLocationId) {
      alert('Kho nguồn và kho đích không được giống nhau')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      const createDTO: CreateTransferDTO = {
        fromLocationType: formData.fromLocationType,
        fromLocationId: formData.fromLocationId,
        toLocationType: formData.toLocationType,
        toLocationId: formData.toLocationId,
        expectedDelivery: formData.expectedDelivery || undefined,
        shippedBy: formData.shippedBy || undefined,
        notes: formData.notes || undefined,
        items: items.map(item => ({
          productId: item.productId,
          batchId: item.batchId || null,
          requestedQuantity: item.quantity,
          receivedQuantity: 0,
        }))
      }

      await TransferAPIService.create(createDTO)
      setSubmitSuccess('Đơn vận chuyển đã được tạo thành công!')

      setTimeout(() => {
        router.push('/warehouse-manager/requests')
      }, 1500)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Tạo đơn vận chuyển thất bại. Vui lòng thử lại.'
      setSubmitError(errorMessage)
      console.error('Submit error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalItems = items.length

  const fromWarehouse = locations.find(l => l.id === formData.fromLocationId)
  const toWarehouse = locations.find(l => l.id === formData.toLocationId)

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Tạo đơn vận chuyển mới
            </h1>
            <p className="text-sm text-slate-500">
              Chuyển hàng giữa các kho, cửa hàng hoặc điểm phân phối
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save size={18} />
              Lưu đơn vận chuyển
            </>
          )}
        </button>
      </div>

      {/* SUCCESS/ERROR MESSAGES */}
      {submitSuccess && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
          <div className="text-emerald-600">✓</div>
          <span className="text-emerald-700">{submitSuccess}</span>
        </div>
      )}

      {submitError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle size={18} className="text-red-600" />
          <span className="text-red-700">{submitError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-6">
          {/* THÔNG TIN CHUNG */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Thông tin chung</h2>

            <div className="space-y-4">
              {/* Location Types */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Loại kho nguồn <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.fromLocationType}
                    onChange={(e) => {
                      setFormData({ ...formData, fromLocationType: e.target.value as LocationType })
                      setFormData({ ...formData, fromLocationId: '' })
                    }}
                  >
                    <option value="WAREHOUSE">Kho hàng</option>
                    <option value="STORE">Cửa hàng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Loại kho đích <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.toLocationType}
                    onChange={(e) => {
                      setFormData({ ...formData, toLocationType: e.target.value as LocationType })
                      setFormData({ ...formData, toLocationId: '' })
                    }}
                  >
                    <option value="WAREHOUSE">Kho hàng</option>
                    <option value="STORE">Cửa hàng</option>
                  </select>
                </div>
              </div>

              {/* Source and Destination Locations */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {formData.fromLocationType === 'WAREHOUSE' ? 'Kho hàng' : 'Cửa hàng'} nguồn{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                    value={formData.fromLocationId}
                    onChange={(e) => setFormData({ ...formData, fromLocationId: e.target.value })}
                    disabled={loadingLocations}
                  >
                    <option value="">Chọn {formData.fromLocationType === 'WAREHOUSE' ? 'kho hàng' : 'cửa hàng'}</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {formData.toLocationType === 'WAREHOUSE' ? 'Kho hàng' : 'Cửa hàng'} đích{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                    value={formData.toLocationId}
                    onChange={(e) => setFormData({ ...formData, toLocationId: e.target.value })}
                    disabled={loadingLocations}
                  >
                    <option value="">Chọn {formData.toLocationType === 'WAREHOUSE' ? 'kho hàng' : 'cửa hàng'}</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date and Delivery Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ngày giao dự kiến
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.expectedDelivery}
                    onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Giao bởi
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Tên người giao hàng"
                    value={formData.shippedBy}
                    onChange={(e) => setFormData({ ...formData, shippedBy: e.target.value })}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ghi chú
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder="Nhập ghi chú cho đơn vận chuyển (tùy chọn)..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* DANH SÁCH SẢN PHẨM */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Danh sách sản phẩm</h2>

            {/* ADD ITEM FORM */}
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Thêm sản phẩm</h3>
              <div className="space-y-3 mb-3">
                <div className="relative">
                  <input
                    ref={productInputRef}
                    type="text"
                    placeholder="Tên sản phẩm hoặc SKU"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={selectedProduct ? selectedProduct.name : productSearch}
                    onChange={e => {
                      setProductSearch(e.target.value)
                      setSelectedProduct(null)
                      setShowProductDropdown(true)
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    autoComplete="off"
                    readOnly={!!selectedProduct}
                  />
                  {showProductDropdown && productSearch && !selectedProduct && (
                    <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                      {products.filter(p =>
                        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                        p.sku.toLowerCase().includes(productSearch.toLowerCase())
                      ).slice(0, 10).map(product => (
                        <button
                          type="button"
                          key={product.id}
                          className="w-full text-left px-4 py-2 hover:bg-emerald-50 border-b last:border-b-0"
                          onClick={() => {
                            setSelectedProduct(product)
                            setProductSearch(product.name)
                            setShowProductDropdown(false)
                          }}
                        >
                          <div className="font-medium text-slate-900">{product.name}</div>
                          <div className="text-xs text-slate-500">SKU: {product.sku} | Đơn vị: {product.unit}</div>
                        </button>
                      ))}
                      {products.filter(p =>
                        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                        p.sku.toLowerCase().includes(productSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-4 py-3 text-slate-400 text-sm">Không tìm thấy sản phẩm</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      placeholder="Số lượng"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                      min="1"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Lô hàng (tùy chọn)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newItem.batchId}
                      onChange={(e) => setNewItem({ ...newItem, batchId: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddItem}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                type="button"
              >
                <Plus size={16} />
                Thêm sản phẩm
              </button>

              {/* Close dropdown when clicking outside */}
              {showProductDropdown && (
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowProductDropdown(false)}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* ITEMS TABLE */}
            {items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left">
                      <th className="p-3 font-medium text-slate-600">Tên sản phẩm</th>
                      <th className="p-3 font-medium text-slate-600">SKU</th>
                      <th className="p-3 font-medium text-slate-600">Số lượng</th>
                      <th className="p-3 font-medium text-slate-600">Đơn vị</th>
                      <th className="p-3 font-medium text-slate-600">Lô hàng</th>
                      <th className="p-3 font-medium text-slate-600 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-800">{item.productName}</td>
                        <td className="p-3 text-slate-600 font-mono">{item.sku}</td>
                        <td className="p-3 text-slate-800 font-semibold">{item.quantity}</td>
                        <td className="p-3 text-slate-600">{item.unit}</td>
                        <td className="p-3 text-slate-600">{item.batchId || '—'}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500">Chưa có sản phẩm nào. Hãy thêm sản phẩm để tiếp tục.</p>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          {/* SUMMARY */}
          <div className="bg-white rounded-xl border p-6 sticky top-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Tóm lược</h2>

            <div className="space-y-4">
              <div className="space-y-3 pb-3 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Từ:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[140px] break-words">
                    {fromWarehouse?.name || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Đến:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[140px] break-words">
                    {toWarehouse?.name || '—'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pb-3 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Tổng SKU:</span>
                  <span className="font-semibold text-slate-800">{totalItems}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Tổng số lượng:</span>
                  <span className="font-semibold text-slate-800">{totalQuantity}</span>
                </div>
              </div>

              {formData.expectedDelivery && (
                <div className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Giao dự kiến:</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(formData.expectedDelivery).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2">
                {formData.shippedBy && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Giao bởi:</span>
                    <span className="font-semibold text-slate-800">{formData.shippedBy}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full mt-6 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Lưu đơn vận chuyển
                </>
              )}
            </button>

            <button
              onClick={() => router.back()}
              className="w-full mt-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
          </div>

          {/* INSTRUCTIONS */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Hướng dẫn</h3>
            <ul className="text-xs text-blue-800 space-y-2">
              <li>✓ Chọn loại kho nguồn và đích</li>
              <li>✓ Chọn vị trí cụ thể từ danh sách</li>
              <li>✓ Thêm sản phẩm từ danh sách hàng</li>
              <li>✓ Nhập số lượng và lô hàng (nếu cần)</li>
              <li>✓ Xem tóm lược bên cạnh</li>
              <li>✓ Nhấn "Lưu" để tạo đơn</li>
            </ul>
          </div>

          {/* TIPS */}
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">Mẹo</h3>
            <p className="text-xs text-amber-800">
              Bạn có thể cập nhật thông tin giao hàng sau khi tạo đơn vận chuyển.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
