'use client'

import { useState, useEffect, useRef } from 'react'
import { ProductAPIService, ProductFromAPI } from '@/services/product-api.service'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'

interface DispatchItem {
  id: string
  productName: string
  sku: string
  quantity: number
  unit: string
  location: string
}

export default function CreateDispatchPage() {
  const router = useRouter()
  const [items, setItems] = useState<DispatchItem[]>([])
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    priority: 'medium',
    notes: ''
  })

  const [newItem, setNewItem] = useState({
    quantity: '',
    location: ''
  })
  const [selectedProduct, setSelectedProduct] = useState<ProductFromAPI | null>(null)

  // Autocomplete sản phẩm
  const [products, setProducts] = useState<ProductFromAPI[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const productInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Lấy danh sách sản phẩm từ API
    ProductAPIService.getAllProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
  }, [])

  const handleAddItem = () => {
    if (selectedProduct && newItem.quantity && newItem.location) {
      setItems([
        ...items,
        {
          id: Date.now().toString(),
          productName: selectedProduct.name,
          sku: selectedProduct.sku,
          unit: selectedProduct.unit || 'Hộp',
          quantity: parseInt(newItem.quantity),
          location: newItem.location
        }
      ])
      setNewItem({ quantity: '', location: '' })
      setProductSearch('')
      setSelectedProduct(null)
    } else {
      alert('Vui lòng chọn sản phẩm và điền đủ số lượng, vị trí kho')
    }
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleSubmit = () => {
    if (!formData.source || !formData.destination || items.length === 0) {
      alert('Vui lòng điền đầy đủ thông tin phiếu xuất hàng')
      return
    }
    alert('Phiếu xuất hàng đã được tạo thành công!')
    router.push('/warehouse-store/receive-goods')
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

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
              Tạo phiếu xuất hàng mới
            </h1>
            <p className="text-sm text-slate-500">
              Điền thông tin và danh sách sản phẩm để tạo phiếu xuất hàng
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
        >
          <Save size={18} />
          Lưu phiếu
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-6">
          {/* THÔNG TIN CHUNG */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Thông tin chung</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Kho nguồn <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  >
                    <option value="">Chọn kho nguồn</option>
                    <option value="Kho Quận 12">Kho Quận 12</option>
                    <option value="Kho Bình Dương">Kho Bình Dương</option>
                    <option value="Kho Thủ Đức">Kho Thủ Đức</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cửa hàng đích <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  >
                    <option value="">Chọn cửa hàng đích</option>
                    <option value="Cửa hàng Quận 1">Cửa hàng Quận 1</option>
                    <option value="Cửa hàng Quận 3">Cửa hàng Quận 3</option>
                    <option value="Cửa hàng Quận 5">Cửa hàng Quận 5</option>
                    <option value="Cửa hàng Quận 7">Cửa hàng Quận 7</option>
                    <option value="Cửa hàng Quận 9">Cửa hàng Quận 9</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ưu tiên
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ngày tạo
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ghi chú
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder="Nhập ghi chú cho phiếu xuất hàng..."
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
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="relative">
                  <input
                    ref={productInputRef}
                    type="text"
                    placeholder="Tên sản phẩm"
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-100"
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
                    <div className="absolute z-20 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto mt-1">
                      {products.filter(p =>
                        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                        p.sku.toLowerCase().includes(productSearch.toLowerCase())
                      ).slice(0, 10).map(product => (
                        <button
                          type="button"
                          key={product.id}
                          className="w-full text-left px-4 py-2 hover:bg-emerald-50"
                          onClick={() => {
                            setSelectedProduct(product)
                            setProductSearch(product.name)
                            setShowProductDropdown(false)
                            setTimeout(() => { productInputRef.current?.blur() }, 100)
                          }}
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-slate-500">SKU: {product.sku} | Đơn vị: {product.unit}</div>
                        </button>
                      ))}
                      {products.filter(p =>
                        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                        p.sku.toLowerCase().includes(productSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-4 py-2 text-slate-400">Không tìm thấy sản phẩm</div>
                      )}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="SKU"
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-100"
                  value={selectedProduct ? selectedProduct.sku : ''}
                  readOnly
                />
                <input
                  type="number"
                  placeholder="Số lượng"
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                />
                <select
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-100"
                  value={selectedProduct ? selectedProduct.unit : ''}
                  disabled
                >
                  <option>{selectedProduct ? selectedProduct.unit : ''}</option>
                </select>
                <input
                  type="text"
                  placeholder="Vị trí kho (VD: A1-01)"
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 col-span-2"
                  value={newItem.location}
                  onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                />
              </div>
              <button
                onClick={handleAddItem}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                type="button"
              >
                <Plus size={16} />
                Thêm sản phẩm
              </button>
              {/* Đóng dropdown khi click ngoài */}
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
                      <th className="p-3 font-medium text-slate-600">Vị trí kho</th>
                      <th className="p-3 font-medium text-slate-600 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-800">{item.productName}</td>
                        <td className="p-3 text-slate-600">{item.sku}</td>
                        <td className="p-3 text-slate-800 font-semibold">{item.quantity}</td>
                        <td className="p-3 text-slate-600">{item.unit}</td>
                        <td className="p-3 text-slate-600">{item.location}</td>
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
          {/* TÓMLƯỢC */}
          <div className="bg-white rounded-xl border p-6 sticky top-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Tóm lược</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Tổng SKU:</span>
                <span className="font-semibold text-slate-800">{items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Tổng số lượng:</span>
                <span className="font-semibold text-slate-800">{totalQuantity}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Ưu tiên:</span>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    formData.priority === 'high' ? 'bg-red-100 text-red-700' :
                    formData.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {formData.priority === 'high' ? 'Cao' : formData.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full mt-6 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Lưu phiếu xuất hàng
            </button>

            <button
              onClick={() => router.back()}
              className="w-full mt-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
          </div>

          {/* HƯỚNG DẪN */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Hướng dẫn</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Chọn kho nguồn và cửa hàng đích</li>
              <li>• Thêm các sản phẩm cần xuất</li>
              <li>• Kiểm tra vị trí kho chính xác</li>
              <li>• Nhấn "Lưu phiếu" để hoàn tất</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
