'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  Search,
  SlidersHorizontal,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  Tag,
  Barcode,
  ShoppingBasket,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Truck,
} from 'lucide-react'
import { ProductAPIService, ProductFromAPI } from '@/services/product-api.service'
import { InventoryAPIService, InventoryItem } from '@/services/inventory-api.service'
import { TransferAPIService, TransferFromAPI } from '@/services/transfer-api.service'
import { useAuthStore } from '@/store/auth.store'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string
  barcode: string
  name: string
  category: string
  brand: string
  unit: string
  price: number
  costPrice: number
  stock: number
  minStock: number
  status: 'Còn hàng' | 'Sắp hết' | 'Hết hàng'
  description: string
  origin: string
  expiry: string
  imageColor: string
  imageInitials: string
}

interface ReceiveTransferItemForm {
  transferItemId: string
  productId: string
  shippedQuantity: number
  damagedQuantity: number
  notes: string
}

// ─── Image helpers ───────────────────────────────────────────────────────────
const IMAGE_COLORS = [
  'bg-red-600', 'bg-orange-500', 'bg-amber-400', 'bg-yellow-500',
  'bg-green-600', 'bg-teal-600', 'bg-cyan-500', 'bg-blue-500',
  'bg-indigo-600', 'bg-purple-600', 'bg-pink-500', 'bg-rose-600',
]
function getImageColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return IMAGE_COLORS[Math.abs(hash) % IMAGE_COLORS.length]
}
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

// ─── API → UI mapper ─────────────────────────────────────────────────────────
function mapApiProduct(p: ProductFromAPI & Record<string, any>): Product {
  const isActive = p.isActive ?? true
  const stock: number = p.stock ?? p.quantity ?? 0
  const minStock: number = p.minStock ?? p.minQuantity ?? 0
  let status: Product['status'] = 'Còn hàng'
  if (!isActive || stock === 0) status = 'Hết hàng'
  else if (minStock > 0 && stock <= minStock) status = 'Sắp hết'
  return {
    id: p.id,
    barcode: p.barcode ?? p.sku ?? '',
    name: p.name,
    category: p.categoryName ?? '',
    brand: p.brand ?? '',
    unit: p.unit ?? '',
    price: p.price ?? 0,
    costPrice: p.costPrice ?? p.originalPrice ?? 0,
    stock,
    minStock,
    status,
    description: p.description ?? '',
    origin: p.origin ?? '',
    expiry: p.expiry ?? (p.shelfLifeDays ? `${p.shelfLifeDays} ngày` : ''),
    imageColor: getImageColor(p.id),
    imageInitials: getInitials(p.name),
  }
}

// ─── Inventory → UI mapper ───────────────────────────────────────────────────
function mapInventoryToProduct(item: InventoryItem): Product {
  // Backend có thể trả về product nested hoặc flattened
  const product = item.product
  const id = item.productId || item.id
  
  // Thử nhiều cách lấy tên product
  const name = product?.name || item.productName || item.name || item.sku || item.barcode || `Product ${id.substring(0, 8)}`
  const sku = product?.sku || item.sku || item.barcode || id
  const categoryName = product?.categoryName || item.categoryName || 'Chưa phân loại'
  const brand = product?.brand || item.brand || ''
  const unit = product?.unit || item.unit || 'sản phẩm'
  const price = product?.price || item.price || 0
  const costPrice = product?.costPrice || product?.originalPrice || item.costPrice || item.originalPrice || 0
  const isActive = product?.isActive ?? true
  
  const stock = item.quantity || item.availableQuantity || 0
  const minStock = item.minStockLevel || 0
  
  let status: Product['status'] = 'Còn hàng'
  if (!isActive || stock === 0) status = 'Hết hàng'
  else if (minStock > 0 && stock <= minStock) status = 'Sắp hết'
  
  return {
    id,
    barcode: sku,
    name,
    category: categoryName,
    brand,
    unit,
    price,
    costPrice,
    stock,
    minStock,
    status,
    description: product?.description || '',
    origin: '',
    expiry: '',
    imageColor: getImageColor(id),
    imageInitials: getInitials(name),
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatVND(amount: number) {
  return amount.toLocaleString('vi-VN') + ' ₫'
}

const STATUS_CONFIG: Record<Product['status'], { dot: string; badge: string; icon: React.ReactNode }> = {
  'Còn hàng': {
    dot: 'bg-green-500',
    badge: 'bg-green-100 text-green-700',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  'Sắp hết': {
    dot: 'bg-yellow-500',
    badge: 'bg-yellow-100 text-yellow-700',
    icon: <TrendingDown className="w-3.5 h-3.5" />,
  },
  'Hết hàng': {
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
}

type StatusFilter = Product['status'] | null
type CategoryFilter = string | null

const PAGE_SIZE = 12

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function ProductDetailPanel({ product, onClose }: { product: Product; onClose: () => void }) {
  const sc = STATUS_CONFIG[product.status]
  return (
    <div className="absolute top-16 right-4 z-30 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100% - 80px)' }}>
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${product.imageColor}`}>
            {product.imageInitials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{product.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{product.brand} · {product.unit}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Price highlight */}
      <div className="px-5 py-4 border-b border-gray-100 text-center bg-teal-50">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Giá bán lẻ</p>
        <p className="text-2xl font-bold text-teal-700">{formatVND(product.price)}</p>
        <p className="text-xs text-gray-400 mt-0.5">Giá vốn: {formatVND(product.costPrice)}</p>
      </div>

      {/* Barcode */}
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2.5">
          <Barcode className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Mã vạch (Barcode)</p>
            <p className="text-sm font-mono font-bold text-gray-800 tracking-widest">{product.barcode}</p>
          </div>
        </div>
      </div>

      {/* Stock & Status */}
      <div className="px-5 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tồn kho</p>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Hiện tại</span>
          <span className={`text-sm font-bold ${product.stock === 0 ? 'text-red-600' : product.stock <= product.minStock ? 'text-yellow-600' : 'text-gray-900'}`}>
            {product.stock} {product.unit.split(' ')[0]}
          </span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">Tối thiểu</span>
          <span className="text-sm text-gray-600">{product.minStock} {product.unit.split(' ')[0]}</span>
        </div>
        {/* Stock bar */}
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${product.stock === 0 ? 'bg-red-400' : product.stock <= product.minStock ? 'bg-yellow-400' : 'bg-teal-500'}`}
            style={{ width: `${Math.min(100, (product.stock / Math.max(product.minStock * 2, 1)) * 100)}%` }}
          />
        </div>
        <div className="mt-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.badge}`}>
            {sc.icon}
            {product.status}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="px-5 py-3 border-b border-gray-100 flex-1 overflow-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Chi tiết sản phẩm</p>
        <div className="space-y-2.5 text-sm">
          {[
            { label: 'Danh mục', value: product.category },
            { label: 'Thương hiệu', value: product.brand },
            { label: 'Đơn vị', value: product.unit },
            { label: 'Xuất xứ', value: product.origin },
            { label: 'Hạn sử dụng', value: product.expiry },
            { label: 'Mã sản phẩm', value: product.id },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-start gap-2">
              <span className="text-gray-400 flex-shrink-0">{label}</span>
              <span className="font-medium text-gray-800 text-right">{value}</span>
            </div>
          ))}
        </div>
        {product.description && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Mô tả</p>
            <p className="text-xs text-gray-600 leading-relaxed">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CashierProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(null)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(null)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [incomingTransfers, setIncomingTransfers] = useState<TransferFromAPI[]>([])
  const [loadingTransfers, setLoadingTransfers] = useState(false)
  const [selectedTransferId, setSelectedTransferId] = useState('')
  const [receiveItems, setReceiveItems] = useState<ReceiveTransferItemForm[]>([])
  const [receiveNotes, setReceiveNotes] = useState('')
  const [receiving, setReceiving] = useState(false)
  const [receiveError, setReceiveError] = useState<string | null>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  const { user, hydrated } = useAuthStore()

  // Fetch data helper function
  const fetchData = useCallback(async () => {
    console.log('Fetching inventory and product data...')

    if (!user?.workplaceType || !user?.workplaceId) {
      throw new Error('Tài khoản chưa có thông tin cửa hàng (workplace). Vui lòng đăng xuất và đăng nhập lại.')
    }

    if (user.workplaceType !== 'STORE') {
      throw new Error('Tài khoản này không thuộc cửa hàng (STORE), không thể xem danh sách sản phẩm POS.')
    }
    
    // Fetch inventory data (có stock info)
    const inventoryData = await InventoryAPIService.getInventoryByLocation('STORE', user.workplaceId)
    console.log('Inventory data:', inventoryData?.length || 0, 'items')
    console.log('Sample inventory item:', inventoryData[0]) // Log để xem structure
    
    // Thử fetch product data (có tên, giá, category)
    let productsData: ProductFromAPI[] = []
    try {
      productsData = await ProductAPIService.getAllProducts()
      console.log('Products data:', productsData?.length || 0, 'items')
    } catch (productErr) {
      console.warn('⚠️ Product API failed, using inventory data only:', productErr)
    }
    
    // Create product map để join
    const productMap = new Map<string, ProductFromAPI>()
    productsData.forEach(product => {
      productMap.set(product.id, product)
    })
    
    // Join inventory với product data
    return inventoryData.map(item => {
      const product = productMap.get(item.productId)
      if (product) {
        // Có đầy đủ product info, merge với inventory
        console.log('✅ Found product for:', item.productId)
        return mapApiProduct({ ...product, stock: item.availableQuantity ?? item.quantity, minStock: item.minStockLevel })
      } else {
        // Không có product info, dùng inventory data thôi
        console.log('⚠️ No product found for:', item.productId, '- using inventory data only')
        return mapInventoryToProduct(item)
      }
    })
  }, [user?.workplaceType, user?.workplaceId])

  // Fetch products from API
  useEffect(() => {
    if (!hydrated) return
    let cancelled = false
    setLoading(true)
    setError(null)
    
    fetchData()
      .then(data => {
        if (!cancelled) {
          setProducts(data)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err?.response?.data?.error || err?.message || 'Không thể tải danh sách sản phẩm')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    
    return () => { cancelled = true }
  }, [hydrated, fetchData])

  // Close filter panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterPanel(false)
      }
    }
    if (showFilterPanel) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showFilterPanel])

  const allCategories = useMemo(
    () => Array.from(new Set(products.map(p => p.category))).filter(Boolean).sort(),
    [products]
  )

  const activeFilterCount = (statusFilter ? 1 : 0) + (categoryFilter ? 1 : 0)

  const selectedTransfer = useMemo(
    () => incomingTransfers.find(t => t.id === selectedTransferId) ?? null,
    [incomingTransfers, selectedTransferId],
  )

  const productNameById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const p of products) {
      const key = String(p.id ?? '').trim().toLowerCase()
      if (key) map[key] = p.name
    }
    return map
  }, [products])

  const openReceiveModal = async () => {
    if (!user?.workplaceId) {
      setReceiveError('Không xác định được cửa hàng hiện tại để nhận hàng')
      return
    }
    setShowReceiveModal(true)
    setLoadingTransfers(true)
    setReceiveError(null)
    setSelectedTransferId('')
    setReceiveItems([])
    setReceiveNotes('')

    try {
      const list = await TransferAPIService.getTransfers()
      const currentStoreId = String(user.workplaceId).trim().toLowerCase()
      const allowedStatus = new Set(['SHIPPED', 'IN_TRANSIT', 'DELIVERED'])
      const filtered = (list ?? []).filter(t => {
        const toId = String(t.toLocationId ?? '').trim().toLowerCase()
        const status = String(t.status ?? '').toUpperCase()
        return toId === currentStoreId && allowedStatus.has(status)
      })
      setIncomingTransfers(filtered)
      if (filtered.length > 0) {
        setSelectedTransferId(filtered[0].id)
      }
    } catch (err: any) {
      setReceiveError(err?.response?.data?.message || err?.message || 'Không tải được danh sách phiếu nhận hàng')
      setIncomingTransfers([])
    } finally {
      setLoadingTransfers(false)
    }
  }

  useEffect(() => {
    if (!selectedTransfer) {
      setReceiveItems([])
      return
    }

    const nextItems: ReceiveTransferItemForm[] = (selectedTransfer.items ?? []).map(item => ({
      transferItemId: item.id,
      productId: item.productId,
      shippedQuantity: Number(item.shippedQuantity ?? item.requestedQuantity ?? 0),
      damagedQuantity: Number(item.damagedQuantity ?? 0),
      notes: item.notes ?? '',
    }))

    setReceiveItems(nextItems)
    setReceiveNotes(selectedTransfer.notes ?? '')
  }, [selectedTransfer])

  const updateReceiveItem = (
    transferItemId: string,
    field: 'shippedQuantity' | 'damagedQuantity' | 'notes',
    value: number | string,
  ) => {
    setReceiveItems(prev => prev.map(item =>
      item.transferItemId === transferItemId ? { ...item, [field]: value } : item
    ))
  }

  const handleReceiveTransfer = async () => {
    if (!selectedTransferId) {
      setReceiveError('Vui lòng chọn phiếu chuyển hàng')
      return
    }

    if (receiveItems.length === 0) {
      setReceiveError('Phiếu chưa có sản phẩm để nhận')
      return
    }

    setReceiving(true)
    setReceiveError(null)
    try {
      await TransferAPIService.receiveTransfer(selectedTransferId, {
        items: receiveItems.map(item => ({
          transferItemId: item.transferItemId,
          shippedQuantity: Number(item.shippedQuantity || 0),
          damagedQuantity: Number(item.damagedQuantity || 0),
          notes: item.notes,
        })),
        notes: receiveNotes,
      })

      const refreshed = await fetchData()
      setProducts(refreshed)
      setShowReceiveModal(false)
      setIncomingTransfers([])
      setSelectedTransferId('')
      setReceiveItems([])
      setReceiveNotes('')
    } catch (err: any) {
      setReceiveError(err?.response?.data?.message || err?.message || 'Nhận hàng thất bại')
    } finally {
      setReceiving(false)
    }
  }

  const filtered = useMemo(() => {
    let list = [...products]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      )
    }
    if (statusFilter) list = list.filter(p => p.status === statusFilter)
    if (categoryFilter) list = list.filter(p => p.category === categoryFilter)
    return list
  }, [products, search, statusFilter, categoryFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearch = (v: string) => {
    setSearch(v)
    setPage(1)
  }

  const handleSelect = (p: Product) => {
    setSelectedProduct(prev => prev?.id === p.id ? null : p)
  }

  const stockCounts = useMemo(() => ({
    total: products.length,
    available: products.filter(p => p.status === 'Còn hàng').length,
    low: products.filter(p => p.status === 'Sắp hết').length,
    out: products.filter(p => p.status === 'Hết hàng').length,
  }), [products])

  return (
    <div className="relative flex h-full bg-gray-50">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-50/80">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <p className="text-sm text-gray-500">Đang tải danh sách sản phẩm...</p>
          </div>
        </div>
      )}
      {/* Error banner */}
      {error && !loading && (
        <div className="absolute inset-x-0 top-0 z-40 mx-6 mt-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <XCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button
            onClick={() => { 
              setError(null)
              setLoading(true)
              fetchData()
                .then(d => setProducts(d))
                .catch(e => setError(e?.message || 'Lỗi tải dữ liệu'))
                .finally(() => setLoading(false))
            }}
            className="text-xs font-medium text-red-600 underline hover:text-red-800"
          >Thử lại</button>
        </div>
      )}
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Summary cards */}
        <div className="px-6 pt-5 pb-1 grid grid-cols-4 gap-4">
          {[
            { label: 'Tổng sản phẩm', value: stockCounts.total, icon: <Package className="w-5 h-5" />, color: 'text-teal-600 bg-teal-50' },
            { label: 'Còn hàng', value: stockCounts.available, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-green-600 bg-green-50' },
            { label: 'Sắp hết hàng', value: stockCounts.low, icon: <AlertTriangle className="w-5 h-5" />, color: 'text-yellow-600 bg-yellow-50' },
            { label: 'Hết hàng', value: stockCounts.out, icon: <XCircle className="w-5 h-5" />, color: 'text-red-600 bg-red-50' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.color}`}>{card.icon}</div>
              <div>
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 mt-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã vạch, thương hiệu..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={openReceiveModal}
            className="ml-auto inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Truck className="w-4 h-4" />
            Nhận hàng
          </button>
        </div>

        {/* Filter row */}
        <div className="bg-white border-b border-gray-100 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilterPanel(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  showFilterPanel || activeFilterCount > 0
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Bộ lọc
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-teal-700 text-[10px] font-bold leading-none ml-0.5">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {showFilterPanel && (
                <div className="absolute left-0 top-full mt-2 z-40 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4">
                  {/* Status filter */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Tag className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Trạng thái</p>
                    </div>
                    <div className="space-y-1">
                      {(['Còn hàng', 'Sắp hết', 'Hết hàng'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => { setStatusFilter(prev => prev === s ? null : s); setPage(1) }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                            statusFilter === s ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_CONFIG[s].dot}`} />
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="w-full h-px bg-gray-100 mb-4" />

                  {/* Category filter */}
                  <div className="mb-4 max-h-52 overflow-auto">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <ShoppingBasket className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Danh mục</p>
                    </div>
                    <div className="space-y-1">
                      {allCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => { setCategoryFilter(prev => prev === cat ? null : cat); setPage(1) }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            categoryFilter === cat ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => { setStatusFilter(null); setCategoryFilter(null); setPage(1) }}
                      className="w-full py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Active chips */}
            {statusFilter && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                {statusFilter}
                <button onClick={() => { setStatusFilter(null); setPage(1) }}><X className="w-3 h-3" /></button>
              </span>
            )}
            {categoryFilter && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                {categoryFilter}
                <button onClick={() => { setCategoryFilter(null); setPage(1) }}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>

          <span className="text-xs text-gray-400 flex-shrink-0">
            Hiển thị {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} trong {filtered.length} sản phẩm
          </span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wide border-r border-gray-200">Sản phẩm</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wide border-r border-gray-200">Mã vạch</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wide border-r border-gray-200">Danh mục</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wide border-r border-gray-200">Giá bán</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wide border-r border-gray-200">Tồn kho</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wide border-r border-gray-200">Trạng thái</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-400">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      Không tìm thấy sản phẩm
                    </td>
                  </tr>
                ) : (
                  paginated.map(p => {
                    const sc = STATUS_CONFIG[p.status]
                    const isSelected = selectedProduct?.id === p.id
                    return (
                      <tr
                        key={p.id}
                        onClick={() => handleSelect(p)}
                        className={`border-b border-gray-200 last:border-0 cursor-pointer transition-colors ${isSelected ? 'bg-teal-50 border-l-4 border-l-teal-600' : 'hover:bg-gray-50'}`}
                      >
                        {/* Product name + brand */}
                        <td className={`px-4 py-3 border-r border-gray-200 ${isSelected ? 'pl-3' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${p.imageColor}`}>
                              {p.imageInitials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate max-w-[180px]">{p.name}</p>
                              <p className="text-xs text-gray-400">{p.brand} · {p.unit}</p>
                            </div>
                          </div>
                        </td>

                        {/* Barcode */}
                        <td className="px-4 py-3 border-r border-gray-200">
                          <div className="flex items-center gap-1.5">
                            <Barcode className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                            <span className="font-mono text-xs text-gray-600 tracking-wider">{p.barcode}</span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3 border-r border-gray-200">
                          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">{p.category}</span>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3 border-r border-gray-200 text-right">
                          <span className="font-semibold text-gray-900">{formatVND(p.price)}</span>
                        </td>

                        {/* Stock */}
                        <td className="px-4 py-3 border-r border-gray-200 text-center">
                          <span className={`font-medium ${p.stock === 0 ? 'text-red-600' : p.stock <= p.minStock ? 'text-yellow-600' : 'text-gray-700'}`}>
                            {p.stock}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 border-r border-gray-200 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {p.status}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={e => { e.stopPropagation(); handleSelect(p) }}
                            title="Xem chi tiết"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Xem
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500">Trang {page} / {totalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${pg === page ? 'bg-teal-700 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating detail panel */}
      {selectedProduct && (
        <ProductDetailPanel product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Nhận hàng từ phiếu chuyển</h3>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-auto">
              {loadingTransfers ? (
                <div className="py-8 text-center text-gray-500 text-sm">Đang tải danh sách phiếu...</div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phiếu chuyển hàng</label>
                    <select
                      value={selectedTransferId}
                      onChange={(e) => setSelectedTransferId(e.target.value)}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    >
                      {incomingTransfers.length === 0 ? (
                        <option value="">Không có phiếu đang vận chuyển về cửa hàng</option>
                      ) : (
                        incomingTransfers.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.transferNumber} - {t.status}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {selectedTransfer && receiveItems.length > 0 && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="px-3 py-2 text-left">Sản phẩm</th>
                            <th className="px-3 py-2 text-left">SL nhận</th>
                            <th className="px-3 py-2 text-left">SL hỏng</th>
                            <th className="px-3 py-2 text-left">Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receiveItems.map(item => (
                            <tr key={item.transferItemId} className="border-t border-gray-100">
                              <td className="px-3 py-2 text-xs text-gray-700">
                                {productNameById[String(item.productId ?? '').trim().toLowerCase()] || item.productId}
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min={0}
                                  value={item.shippedQuantity}
                                  onChange={(e) => updateReceiveItem(item.transferItemId, 'shippedQuantity', Number(e.target.value || 0))}
                                  className="w-24 border border-gray-200 rounded-md px-2 py-1.5"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min={0}
                                  value={item.damagedQuantity}
                                  onChange={(e) => updateReceiveItem(item.transferItemId, 'damagedQuantity', Number(e.target.value || 0))}
                                  className="w-24 border border-gray-200 rounded-md px-2 py-1.5"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  value={item.notes}
                                  onChange={(e) => updateReceiveItem(item.transferItemId, 'notes', e.target.value)}
                                  className="w-full border border-gray-200 rounded-md px-2 py-1.5"
                                  placeholder="Ghi chú"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ghi chú chung</label>
                    <textarea
                      value={receiveNotes}
                      onChange={(e) => setReceiveNotes(e.target.value)}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[88px]"
                      placeholder="Ghi chú nhận hàng"
                    />
                  </div>

                  {receiveError && (
                    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {receiveError}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowReceiveModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                onClick={handleReceiveTransfer}
                disabled={receiving || loadingTransfers || incomingTransfers.length === 0 || !selectedTransferId}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
              >
                {receiving ? 'Đang xác nhận...' : 'Xác nhận nhận hàng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

