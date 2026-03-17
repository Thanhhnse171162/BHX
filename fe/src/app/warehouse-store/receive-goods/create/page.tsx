'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Trash2, Upload, ChevronDown, AlertCircle, X } from 'lucide-react'
import { ProductAPIService, ProductFromAPI } from '@/services/product-api.service'

interface Product {
  id: number | string
  name: string
  sku: string
  quantity: number
  batch: string
  expiredDate: string
  location: string
  condition: string
}

const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Sữa Vinamilk 1L',
    sku: 'VNM-MILK-1000',
    quantity: 120,
    batch: 'LOT-001',
    expiredDate: '12/31/2025',
    location: 'A1-0',
    condition: 'Tốt'
  },
  {
    id: 2,
    name: 'Bột giặt Omo Matic 4kg',
    sku: 'OMO-MATIC-4KG',
    quantity: 50,
    batch: 'LOT-002',
    expiredDate: '03/15/2026',
    location: 'C2-0',
    condition: 'Tốt'
  },
  {
    id: 3,
    name: 'Bơi giải Omo Matic 4kg',
    sku: 'OMO-MATIC-4KG',
    quantity: 100,
    batch: 'LOT-003',
    expiredDate: 'mm/dd/yyyy',
    location: 'C2-0',
    condition: 'Tú'
  }
]

export default function CreateReceiveGoodsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS)
  const [supplier, setSupplier] = useState('')
  const [receivedDate, setReceivedDate] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [apiProducts, setApiProducts] = useState<ProductFromAPI[]>([])
  const [modalSearchTerm, setModalSearchTerm] = useState('')
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [modalError, setModalError] = useState('')

  // Load products from API when modal opens
  useEffect(() => {
    if (showModal && apiProducts.length === 0) {
      console.log('Modal opened, loading products...')
      loadProducts()
    }
  }, [showModal])

  const loadProducts = async () => {
    setIsLoadingProducts(true)
    setModalError('')
    try {
      console.log('Loading products...')
      const data = await ProductAPIService.getAllProducts()
      console.log('Products loaded:', data)
      if (data && data.length > 0) {
        setApiProducts(data)
      } else {
        // Fallback to mock data if API returns empty
        console.log('API returned empty, using mock data')
        const mockData: ProductFromAPI[] = [
          {
            id: '1',
            name: 'Rau Muống',
            sku: 'RAU-MUONG',
            description: null,
            categoryId: '1',
            categoryName: 'Rau',
            brandId: null,
            brand: 'VietGap',
            price: 15000,
            unit: 'Bó',
            originalPrice: 15000,
            weight: 0.5,
            volume: null,
            isFeatured: false,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Cải Thảo',
            sku: 'CAI-THAO',
            description: null,
            categoryId: '1',
            categoryName: 'Rau',
            brandId: null,
            brand: 'VietGap',
            price: 12000,
            unit: 'Kg',
            originalPrice: 12000,
            weight: 1,
            volume: null,
            isFeatured: false,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Cam Sánh',
            sku: 'CAM-SANH',
            description: null,
            categoryId: '2',
            categoryName: 'Trái Cây',
            brandId: null,
            brand: 'Trái Cây',
            price: 25000,
            unit: 'Kg',
            originalPrice: 25000,
            weight: 1,
            volume: null,
            isFeatured: false,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '4',
            name: 'Táo Envy',
            sku: 'TAO-ENVY',
            description: null,
            categoryId: '2',
            categoryName: 'Trái Cây',
            brandId: null,
            brand: 'Import',
            price: 45000,
            unit: 'Kg',
            originalPrice: 45000,
            weight: 1,
            volume: null,
            isFeatured: false,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '5',
            name: 'Sữa Tươi Vinamilk 100%',
            sku: 'VNM-MILK-100',
            description: null,
            categoryId: '3',
            categoryName: 'Sữa',
            brandId: null,
            brand: 'Vinamilk',
            price: 35000,
            unit: 'Lít',
            originalPrice: 35000,
            weight: 1,
            volume: 1000,
            isFeatured: false,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
        setApiProducts(mockData)
      }
    } catch (error) {
      console.error('Error loading products:', error)
      // Use mock data as fallback
      const mockData: ProductFromAPI[] = [
        {
          id: '1',
          name: 'Rau Muống',
          sku: 'RAU-MUONG',
          description: null,
          categoryId: '1',
          categoryName: 'Rau',
          brandId: null,
          brand: 'VietGap',
          price: 15000,
          unit: 'Bó',
          originalPrice: 15000,
          weight: 0.5,
          volume: null,
          isFeatured: false,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Cải Thảo',
          sku: 'CAI-THAO',
          description: null,
          categoryId: '1',
          categoryName: 'Rau',
          brandId: null,
          brand: 'VietGap',
          price: 12000,
          unit: 'Kg',
          originalPrice: 12000,
          weight: 1,
          volume: null,
          isFeatured: false,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Cam Sánh',
          sku: 'CAM-SANH',
          description: null,
          categoryId: '2',
          categoryName: 'Trái Cây',
          brandId: null,
          brand: 'Trái Cây',
          price: 25000,
          unit: 'Kg',
          originalPrice: 25000,
          weight: 1,
          volume: null,
          isFeatured: false,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Táo Envy',
          sku: 'TAO-ENVY',
          description: null,
          categoryId: '2',
          categoryName: 'Trái Cây',
          brandId: null,
          brand: 'Import',
          price: 45000,
          unit: 'Kg',
          originalPrice: 45000,
          weight: 1,
          volume: null,
          isFeatured: false,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '5',
          name: 'Sữa Tươi Vinamilk 100%',
          sku: 'VNM-MILK-100',
          description: null,
          categoryId: '3',
          categoryName: 'Sữa',
          brandId: null,
          brand: 'Vinamilk',
          price: 35000,
          unit: 'Lít',
          originalPrice: 35000,
          weight: 1,
          volume: 1000,
          isFeatured: false,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      setApiProducts(mockData)
      setModalError('')
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handleAddProduct = (apiProduct: ProductFromAPI) => {
    // Check if product already exists
    const exists = products.some(p => p.sku === apiProduct.sku)
    if (exists) {
      alert('Sản phẩm này đã có trong danh sách!')
      return
    }

    // Add new product to list
    const newProduct: Product = {
      id: apiProduct.id,
      name: apiProduct.name,
      sku: apiProduct.sku,
      quantity: 0,
      batch: '',
      expiredDate: '',
      location: 'A1-0',
      condition: 'Tốt'
    }
    setProducts([...products, newProduct])
    setShowModal(false)
    setModalSearchTerm('')
  }

  // Calculate summary
  const totalSKU = products.length
  const totalQty = products.reduce((sum, p) => sum + p.quantity, 0)
  const totalReceived = products.length

  const handleQuantityChange = (id: number | string, value: number) => {
    setProducts(prev =>
      prev.map(p => p.id === id ? { ...p, quantity: value } : p)
    )
  }

  const handleBatchChange = (id: number | string, value: string) => {
    setProducts(prev =>
      prev.map(p => p.id === id ? { ...p, batch: value } : p)
    )
  }

  const handleExpiredDateChange = (id: number | string, value: string) => {
    setProducts(prev =>
      prev.map(p => p.id === id ? { ...p, expiredDate: value } : p)
    )
  }

  const handleLocationChange = (id: number | string, value: string) => {
    setProducts(prev =>
      prev.map(p => p.id === id ? { ...p, location: value } : p)
    )
  }

  const handleDelete = (id: number | string) => {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = () => {
    alert('Phiếu nhập hàng đã được tạo thành công!')
    router.push('/warehouse-store/receive-goods')
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="bg-slate-50 min-h-screen p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">
            Tạo phiếu nhập hàng mới
          </h1>
          <p className="page-subtitle">
            Điền đầy đủ thông tin để khởi tạo quy trình nhập kho sản phẩm.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="px-5 py-2 rounded-lg border bg-white text-slate-600 font-medium hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
          >
            Xác nhận hoàn thành
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT PANEL */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          {/* Thông tin chung */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
              <h2 className="font-semibold text-slate-700">Thông tin chung</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">
                  Chọn đơn vị cung cấp
                </label>
                <select
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="">Chọn đơn vị cung cấp</option>
                  <option value="vinamilk">Vinamilk</option>
                  <option value="omo">Omo</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">
                  Ngày nhận thực tế
                </label>
                <input
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhập ghi chú hoặc hướng dẫn dỡ hàng..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Mẹo nhập liệu */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-700 text-sm mb-1">
                  Mẹo nhập liệu
                </h3>
                <p className="text-xs text-emerald-600">
                  Sử dụng phím Tab để di chuyển nhanh giữa các ô nhập liệu trong bảng sản phẩm.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-6">
          {/* Danh sách sản phẩm nhập */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
                <h2 className="font-semibold text-slate-700">Danh sách sản phẩm nhập</h2>
              </div>
              <div className="text-xs text-slate-500">
                Đã chọn: <span className="text-emerald-600 font-semibold">{String(totalReceived).padStart(2, '0')} mặt hàng</span>
              </div>
            </div>

            {/* Search */}
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm theo tên, mã SKU hoặc quét mã vạch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-200">
                    <th className="px-5 py-4 text-left font-semibold text-slate-700 text-sm tracking-wide">SẢN PHẨM / SKU</th>
                    <th className="px-5 py-4 text-center font-semibold text-slate-700 text-sm tracking-wide">SỐ LƯỢNG</th>
                    <th className="px-5 py-4 text-center font-semibold text-slate-700 text-sm tracking-wide">BATCH / SỐ LÔ</th>
                    <th className="px-5 py-4 text-center font-semibold text-slate-700 text-sm tracking-wide">HẠN SỬ DỤNG</th>
                    <th className="px-5 py-4 text-center font-semibold text-slate-700 text-sm tracking-wide">VỊ TRÍ KHO</th>
                    <th className="px-5 py-4 text-center font-semibold text-slate-700 text-sm tracking-wide">HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => (
                    <tr key={product.id} className={`border-b transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-emerald-50`}>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800 text-sm">{product.name}</div>
                        <div className="text-xs text-slate-500 mt-1">SKU: {product.sku}</div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <input
                          type="number"
                          min="0"
                          value={product.quantity}
                          onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0)}
                          className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm text-center font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <input
                          type="text"
                          value={product.batch}
                          onChange={(e) => handleBatchChange(product.id, e.target.value)}
                          className="w-28 border border-slate-300 rounded-lg px-3 py-2 text-sm text-center font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <input
                          type="text"
                          placeholder="mm/dd/yyyy"
                          value={product.expiredDate}
                          onChange={(e) => handleExpiredDateChange(product.id, e.target.value)}
                          className="w-32 border border-slate-300 rounded-lg px-3 py-2 text-sm text-center font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <select
                          value={product.location}
                          onChange={(e) => handleLocationChange(product.id, e.target.value)}
                          className="w-28 border border-slate-300 rounded-lg px-3 py-2 text-sm text-center font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                          <option value="A1-0">A1-0</option>
                          <option value="A1-1">A1-1</option>
                          <option value="C2-0">C2-0</option>
                          <option value="C2-1">C2-1</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-t-2 border-slate-200 font-semibold">
                    <td className="px-5 py-4 text-slate-800 text-sm">
                      Tổng SKU: <span className="text-emerald-600 font-bold">{totalSKU}</span>
                    </td>
                    <td className="px-5 py-4 text-center text-slate-800 text-sm">
                      Tổng số lượng: <span className="text-emerald-600 font-bold">{totalQty}</span>
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Add product button */}
            <div className="mt-4 flex justify-between items-center">
              <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 text-emerald-600 font-medium text-sm hover:text-emerald-700"
              >
                <Plus className="w-4 h-4" />
                Thêm sản phẩm nhanh
              </button>
            </div>
          </div>

          {/* Modal - Add Product */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Gợi ý sản phẩm</h2>
                    <p className="text-sm text-slate-500 mt-1">Chọn sản phẩm để thêm vào danh sách nhập hàng</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setModalSearchTerm('')
                    }}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Search */}
                <div className="p-4 border-b bg-slate-50">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm sản phẩm theo tên, SKU hoặc mã vạch..."
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {isLoadingProducts ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-slate-600 text-sm">Đang tải danh sách sản phẩm...</p>
                      </div>
                    </div>
                  ) : modalError ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                        <p className="text-red-600 text-sm">{modalError}</p>
                        <button
                          onClick={loadProducts}
                          className="mt-3 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
                        >
                          Thử l��i
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {apiProducts
                        .filter(p =>
                          p.name.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                          p.sku.toLowerCase().includes(modalSearchTerm.toLowerCase())
                        )
                        .map((product) => (
                          <button
                            key={product.id}
                            onClick={() => handleAddProduct(product)}
                            className="w-full flex items-center justify-between p-4 border rounded-lg hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-left"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m0 0l8 4m-8-4v10l8 4m0-10l8 4m-8-4v10l8 4M7 12l8 4m-8-4l-8-4" />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-slate-800">{product.name}</h3>
                                  <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              <div className="text-right">
                                <p className="text-xs text-slate-500">Giá</p>
                                <p className="font-semibold text-slate-800">{product.price.toLocaleString()}đ</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-slate-500">Đơn vị</p>
                                <p className="font-semibold text-slate-800">{product.unit}</p>
                              </div>
                              <Plus className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            </div>
                          </button>
                        ))}
                      {apiProducts.filter(p =>
                        p.name.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                        p.sku.toLowerCase().includes(modalSearchTerm.toLowerCase())
                      ).length === 0 && (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm">Không tìm thấy sản phẩm nào</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Đính kèm chứng từ */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-700 mb-1">Đính kèm chứng từ</h3>
                <p className="text-xs text-slate-400">Hóa đơn, biên bản bàn giao (PDF, JPG, PNG)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border border-emerald-600 text-emerald-600 font-medium rounded-lg text-sm hover:bg-emerald-50"
              >
                <Upload className="w-4 h-4" />
                Tải tệp lên
              </button>
              {file && (
                <span className="text-sm text-slate-500">{file.name}</span>
              )}
            </div>
          </div>

          {/* Điều kiện chứng thực */}
          <div className="bg-slate-50 border rounded-xl p-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-slate-400 mt-0.5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 text-sm mb-2">
                  Điều kiện chứng thực
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tôi đã kiểm tra đầy đủ các chứng từ, biên bản bàn giao (PDF, JPG, PNG)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
