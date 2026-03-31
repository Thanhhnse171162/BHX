 'use client'

import { useCallback, useEffect, useState } from 'react'
import { ProductAPIService, ProductFromAPI } from '@/services/product-api.service'
import { InventoryAPIService, InventoryItem } from '@/services/inventory-api.service'
import { CategoryAPIService, CategoryFromAPI } from '@/services/category-api.service'
import { supplierService } from '@/services/supplier.service'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import DataTable from '@/shared/ui/DataTable'
import PageHeader from '@/shared/ui/PageHeader'
import EmptyState from '@/shared/ui/EmptyState'
import Modal from '@/shared/ui/Modal'
import type { SupplierListItem } from '@/types/supplier.types'

type ProductStatus = 'ACTIVE' | 'INACTIVE'

interface ProductRow {
  id: string
  sku: string
  name: string
  category: string
  price: number
  unit: string
  status: ProductStatus
  createdAt: string
  // Inventory fields
  totalQuantity?: number
  availableQuantity?: number
  reservedQuantity?: number
  inventoryStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  reorderLevel?: number
  [key: string]: unknown
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  const [categories, setCategories] = useState<CategoryFromAPI[]>([])
  const [suppliers, setSuppliers] = useState<SupplierListItem[]>([])
  const [categoryIdByName, setCategoryIdByName] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [unit, setUnit] = useState('kg')
  const [status, setStatus] = useState<ProductStatus>('ACTIVE')
  
  // Additional fields from Swagger
  const [barcode, setBarcode] = useState('')
  const [description, setDescription] = useState('')
  const [brand, setBrand] = useState('')
  const [origin, setOrigin] = useState('')
  const [originalPrice, setOriginalPrice] = useState<number>(0)
  const [costPrice, setCostPrice] = useState<number>(0)
  const [weight, setWeight] = useState<number>(0)
  const [mainImage, setMainImage] = useState<File | null>(null)
  const [additionalImages, setAdditionalImages] = useState<File[]>([])
  const [slug, setSlug] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [metaKeywords, setMetaKeywords] = useState('')
  const [supplierId, setSupplierId] = useState('')

  const getCategoryId = (category: CategoryFromAPI): string => {
    const candidates: Array<unknown> = [
      category.id,
      (category as { ID?: string }).ID,
      category.Id,
      category.categoryId,
      category.CategoryId,
      category.categoryID,
      category.CategoryID,
      category.category_id,
      category.Category_Id,
      category._id,
    ]

    for (const candidate of candidates) {
      if (candidate === undefined || candidate === null) continue
      const normalized = String(candidate).trim()
      if (normalized) {
        return normalized
      }
    }

    return ''
  }

  const normalizeCategoryName = (value: string | null | undefined): string =>
    String(value || '').trim().toLowerCase()

  const availableCategories = categories
    .map((cat) => ({
      ...cat,
      resolvedId: getCategoryId(cat) || categoryIdByName[normalizeCategoryName(cat.name)] || '',
    }))
    .filter((cat) => !!cat.resolvedId)

  const totalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProducts = products.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [products.length])

  // Fetch products từ API backend
  const fetchCategories = useCallback(async () => {
    try {
      const data = await CategoryAPIService.getAllCategories()
      const activeCategories = data.filter((c) => {
        const normalizedStatus = String(c.status || '').trim().toUpperCase()
        const isDeletedRaw = (c as CategoryFromAPI & { isDeleted?: unknown }).isDeleted ?? c.is_deleted

        const isDeleted =
          isDeletedRaw === 1 ||
          isDeletedRaw === '1' ||
          isDeletedRaw === true ||
          String(isDeletedRaw || '').toLowerCase() === 'true'

        // Accept empty status to avoid hiding all categories when BE response is inconsistent.
        const isActive = !normalizedStatus || normalizedStatus === 'ACTIVE'

        return isActive && !isDeleted
      })
      setCategories(activeCategories)
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }, [])

  const fetchSuppliers = useCallback(async () => {
    try {
      const data = await supplierService.getSuppliers()
      const activeSuppliers = data.filter((s) => {
        const normalizedStatus = String(s.status || '').trim().toUpperCase()
        return !s.isDeleted && (!normalizedStatus || normalizedStatus === 'ACTIVE')
      })
      setSuppliers(activeSuppliers)
      setSupplierId((prev) => prev || activeSuppliers[0]?.id || '')
    } catch (err) {
      console.error('Error loading suppliers:', err)
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch cả products và inventory
      const [productsData, inventoryData] = await Promise.all([
        ProductAPIService.getAllProducts(),
        InventoryAPIService.getAllInventory().catch(() => [] as InventoryItem[])
      ])
      
      // Tạo map để tính tổng quantity cho mỗi product
      const inventoryMap = new Map<string, {
        totalQuantity: number
        availableQuantity: number
        reservedQuantity: number
        isLowStock: boolean
        minStockLevel: number
      }>()
      
      inventoryData.forEach((inv) => {
        const existing = inventoryMap.get(inv.productId)
        if (existing) {
          existing.totalQuantity += inv.quantity
          existing.availableQuantity += inv.availableQuantity
          existing.reservedQuantity += inv.reservedQuantity
          // Cập nhật low stock status nếu có bất kỳ location nào low stock
          if (inv.isLowStock) {
            existing.isLowStock = true
          }
        } else {
          inventoryMap.set(inv.productId, {
            totalQuantity: inv.quantity,
            availableQuantity: inv.availableQuantity,
            reservedQuantity: inv.reservedQuantity,
            isLowStock: inv.isLowStock,
            minStockLevel: inv.minStockLevel,
          })
        }
      })
      
      // Transform API data sang ProductRow format với inventory info
      const rows: ProductRow[] = productsData.map((p: ProductFromAPI) => {
        const inventory = inventoryMap.get(p.id)
        return {
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: p.categoryName || 'Unknown',
          price: p.price,
          unit: p.unit || '',
          status: p.isActive ? 'ACTIVE' : 'INACTIVE',
          createdAt: p.createdAt,
          totalQuantity: inventory?.totalQuantity ?? 0,
          availableQuantity: inventory?.availableQuantity ?? 0,
          reservedQuantity: inventory?.reservedQuantity ?? 0,
          inventoryStatus: inventory?.isLowStock 
            ? (inventory.availableQuantity === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK') 
            : 'IN_STOCK',
          reorderLevel: inventory?.minStockLevel ?? 0,
        }
      })

      const derivedCategoryIdByName: Record<string, string> = {}
      productsData.forEach((p) => {
        const normalizedName = normalizeCategoryName(p.categoryName)
        if (normalizedName && p.categoryId) {
          derivedCategoryIdByName[normalizedName] = p.categoryId
        }
      })

      setCategoryIdByName(derivedCategoryIdByName)
      
      setProducts(rows)
    } catch (err) {
      console.error('Error loading products:', err)
      setError('Không thể tải danh sách sản phẩm. Vui lòng kiểm tra backend đang chạy.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchProducts()
    void fetchCategories()
    void fetchSuppliers()
  }, [fetchProducts, fetchCategories, fetchSuppliers])

  const handleOpenCreate = () => {
    setMode('create')
    setEditingId(null)
    setSku('')
    setName('')
    setCategory(availableCategories.length > 0 ? availableCategories[0].resolvedId : '')
    setPrice(0)
    setUnit('kg')
    setStatus('ACTIVE')
    setBarcode('')
    setDescription('')
    setBrand('')
    setOrigin('')
    setOriginalPrice(0)
    setCostPrice(0)
    setWeight(0)
    setMainImage(null)
    setAdditionalImages([])
    setSlug('')
    setMetaTitle('')
    setMetaDescription('')
    setMetaKeywords('')
    setSupplierId(suppliers[0]?.id || '')
    setIsModalOpen(true)
  }

  // Helper function to parse number and remove leading zeros
  const parseNumberInput = (value: string): number => {
    if (!value || value === '') return 0
    const num = parseFloat(value)
    return isNaN(num) ? 0 : num
  }

  const handleEdit = (row: ProductRow) => {
    setMode('edit')
    setEditingId(row.id)
    setSku(row.sku)
    setName(row.name)
    const matchedCategory = availableCategories.find((c) => c.name === row.category)
    setCategory(matchedCategory ? matchedCategory.resolvedId : '')
    setPrice(row.price)
    setUnit(row.unit)
    setStatus(row.status)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return
    
    try {
      await ProductAPIService.deleteProduct(id)
      await fetchProducts() // Reload lại danh sách
      alert('Xóa sản phẩm thành công!')
    } catch (err) {
      console.error('Error deleting product:', err)
      alert('Không thể xóa sản phẩm. Vui lòng thử lại.')
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
  }

  const parseApiErrorMessage = (payload: unknown): string => {
    if (payload === null || payload === undefined) return ''

    if (typeof payload === 'string') {
      const trimmed = payload.trim()
      if (!trimmed) return ''
      try {
        const parsed = JSON.parse(trimmed) as unknown
        const parsedMessage = parseApiErrorMessage(parsed)
        return parsedMessage || trimmed
      } catch {
        return trimmed
      }
    }

    if (typeof payload !== 'object') {
      return String(payload)
    }

    const data = payload as {
      message?: unknown
      error?: unknown
      title?: unknown
      errors?: Record<string, unknown>
    }

    const lines: string[] = []

    if (typeof data.message === 'string' && data.message.trim()) {
      lines.push(data.message.trim())
    }

    if (typeof data.error === 'string' && data.error.trim()) {
      lines.push(data.error.trim())
    }

    if (typeof data.title === 'string' && data.title.trim()) {
      lines.push(data.title.trim())
    }

    if (data.errors && typeof data.errors === 'object') {
      Object.entries(data.errors).forEach(([field, value]) => {
        if (Array.isArray(value)) {
          const fieldErrors = value
            .map((item) => String(item).trim())
            .filter(Boolean)
            .join(', ')

          if (fieldErrors) {
            lines.push(`${field}: ${fieldErrors}`)
          }
        } else if (value !== null && value !== undefined) {
          const singleError = String(value).trim()
          if (singleError) {
            lines.push(`${field}: ${singleError}`)
          }
        }
      })
    }

    return Array.from(new Set(lines)).join('\n').trim()
  }

  const getReadableErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object') {
      const axiosLikeResponseData = (error as { response?: { data?: unknown } }).response?.data
      const fromAxiosData = parseApiErrorMessage(axiosLikeResponseData)
      if (fromAxiosData) return fromAxiosData
    }

    if (error instanceof Error) {
      const parsed = parseApiErrorMessage(error.message)
      if (parsed) return parsed
      return error.message
    }

    const fallback = parseApiErrorMessage(error)
    return fallback || 'Đã có lỗi không xác định từ server.'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (mode === 'create') {
        if (!category) {
          alert('Vui lòng chọn category hợp lệ.')
          return
        }

        if (!supplierId) {
          alert('Vui lòng chọn nhà cung cấp (SupplierId).')
          return
        }

        const formData = new FormData()
        const appendIfDefined = (key: string, value: unknown) => {
          if (value === undefined || value === null || value === '') return
          formData.append(key, String(value))
        }

        appendIfDefined('Sku', sku)
        appendIfDefined('Name', name)
        appendIfDefined('CategoryId', category)
        appendIfDefined('SupplierId', supplierId)
        appendIfDefined('Price', price)
        appendIfDefined('Unit', unit)
        appendIfDefined('Barcode', barcode)
        appendIfDefined('Description', description)
        appendIfDefined('Brand', brand)
        appendIfDefined('Origin', origin)
        appendIfDefined('OriginalPrice', originalPrice)
        appendIfDefined('CostPrice', costPrice)
        appendIfDefined('Weight', weight)
        appendIfDefined('IsAvailable', status === 'ACTIVE')
        appendIfDefined('IsFeatured', false)
        appendIfDefined('IsNew', true)
        appendIfDefined('Slug', slug)
        appendIfDefined('MetaTitle', metaTitle)
        appendIfDefined('MetaDescription', metaDescription)
        appendIfDefined('MetaKeywords', metaKeywords)
        if (mainImage) {
          formData.append('MainImage', mainImage)
        }
        additionalImages.forEach((file) => {
          formData.append('AdditionalImages', file)
        })

        const token = useAuthStore.getState().token
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData,
        })

        if (!response.ok) {
          const responseContentType = response.headers.get('content-type') || ''
          const errorPayload = responseContentType.includes('application/json')
            ? await response.json().catch(() => null)
            : await response.text().catch(() => '')

          const detailedMessage =
            parseApiErrorMessage(errorPayload) ||
            (typeof errorPayload === 'string' ? errorPayload : '') ||
            `Create product failed (${response.status})`

          throw new Error(detailedMessage)
        }

        alert('Tạo sản phẩm thành công!')
      } else if (mode === 'edit' && editingId) {
        await ProductAPIService.updateProduct(editingId, {
          sku,
          name,
          price,
          unit,
          isAvailable: status === 'ACTIVE',
        })
        alert('Cập nhật sản phẩm thành công!')
      }

      setIsModalOpen(false)
      await fetchProducts() // Reload lại danh sách
    } catch (err) {
      console.error('Error saving product:', err)
      const detailedError = getReadableErrorMessage(err)
      alert(`Không thể lưu sản phẩm:\n${detailedError}`)
    }
  }

  const createProductButton = (
    <Button onClick={handleOpenCreate}>
      Tạo sản phẩm
    </Button>
  )

  return (
    <div className="p-6">
      <PageHeader
        title="Sản phẩm"
        subtitle="Quản lý danh mục sản phẩm"
        actions={createProductButton}
        breadcrumbs={[
          { label: 'Quản trị', href: '/admin' },
          { label: 'Danh mục', href: '/admin/catalog' },
          { label: 'Sản phẩm', href: '/admin/catalog/products' },
        ]}
      />

      <div className="card">
        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-600">Đang tải dữ liệu...</div>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">Lỗi kết nối</p>
            <p className="text-sm mt-1">{error}</p>
            <button 
              onClick={fetchProducts}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && products.length === 0 && (
          <EmptyState
            title="Không có sản phẩm"
            description="Thêm sản phẩm đầu tiên vào danh mục"
            action={createProductButton}
          />
        )}

        {/* Data table */}
        {!isLoading && !error && products.length > 0 && (
          <>
            <DataTable
              data={paginatedProducts}
              columns={[
                { key: 'sku', label: 'SKU' },
                { key: 'name', label: 'Tên' },
                { key: 'category', label: 'Danh mục' },
                {
                  key: 'price',
                  label: 'Giá',
                  render: (value) =>
                    new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(value as number),
                },
                { key: 'unit', label: 'Đơn vị' },
                {
                  key: 'totalQuantity',
                  label: 'Tổng tồn',
                  render: (value) => (
                    <span className="font-medium">
                      {value !== undefined && value !== null ? String(value) : 'N/A'}
                    </span>
                  ),
                },
                {
                  key: 'availableQuantity',
                  label: 'Khả dụng',
                  render: (value) => (
                    <span className="font-medium text-green-600">
                      {value !== undefined && value !== null ? String(value) : 'N/A'}
                    </span>
                  ),
                },
                {
                  key: 'reservedQuantity',
                  label: 'Đã giữ',
                  render: (value) => (
                    <span className="font-medium text-orange-600">
                      {value !== undefined && value !== null ? String(value) : 'N/A'}
                    </span>
                  ),
                },
                {
                  key: 'inventoryStatus',
                  label: 'Trạng thái tồn kho',
                  render: (value) => {
                    const statusColors = {
                      IN_STOCK: 'bg-green-100 text-green-800',
                      LOW_STOCK: 'bg-yellow-100 text-yellow-800',
                      OUT_OF_STOCK: 'bg-red-100 text-red-800',
                    }
                    const statusLabels = {
                      IN_STOCK: 'Còn hàng',
                      LOW_STOCK: 'Sắp hết hàng',
                      OUT_OF_STOCK: 'Hết hàng',
                    }
                    const status = value as 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
                    return (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          statusColors[status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {statusLabels[status] || 'Không xác định'}
                      </span>
                    )
                  },
                },
                {
                  key: 'status',
                  label: 'Trạng thái',
                  render: (value) => (
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        value === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {value === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  ),
                },
                {
                  key: 'createdAt',
                  label: 'Ngày tạo',
                  render: (value) =>
                    new Date(value as string).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }),
                },
                {
                  key: 'id',
                  label: 'Thao tác',
                  render: (_value, item) => {
                    const row = item as unknown as ProductRow
                    return (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(row)
                          }}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(row.id)
                          }}
                        >
                          Xóa
                        </Button>
                      </div>
                    )
                  },
                },
              ]}
            />

            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-sm text-gray-600">
                Hiển thị {products.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, products.length)} trên {products.length} sản phẩm
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage === 1}
                >
                  Trước
                </Button>
                <span className="text-sm text-gray-700 min-w-[72px] text-center">
                  Trang {safeCurrentPage}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage === totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={mode === 'create' ? 'Tạo sản phẩm' : 'Sửa sản phẩm'}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleClose}>
              Hủy
            </Button>
            <Button onClick={handleSubmit}>
              Lưu
            </Button>
          </div>
        }
      >
        <div className="max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
          <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="SKU-001"
            required
          />
          <Input
            label="Tên"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Gạo thơm ST25"
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Danh mục *
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="" disabled>
                {availableCategories.length > 0 ? 'Chọn danh mục' : 'Không có danh mục'}
              </option>
              {availableCategories.map((cat) => {
                const categoryId = cat.resolvedId
                return (
                  <option key={categoryId} value={categoryId}>
                    {cat.name}
                  </option>
                )
              })}
            </select>
          </div>
          {mode === 'create' && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Nhà cung cấp *
              </label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
              >
                <option value="" disabled>
                  {suppliers.length > 0 ? 'Chọn nhà cung cấp' : 'Không có nhà cung cấp'}
                </option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Input
            label="Giá"
            type="number"
            value={price || ''}
            onChange={(e) => setPrice(parseNumberInput(e.target.value))}
            required
          />
          <Input
            label="Đơn vị"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="kg, gói, hộp, chai..."
            required
          />
          
          <Input
            label="Barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="8934680010043"
          />
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả sản phẩm..."
              rows={3}
            />
          </div>
          
          <Input
            label="Brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Vinamilk, TH True Milk..."
          />
          
          <Input
            label="Origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Việt Nam"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Original Price"
              type="number"
              value={originalPrice || ''}
              onChange={(e) => setOriginalPrice(parseNumberInput(e.target.value))}
              placeholder="0"
            />
            <Input
              label="Cost Price"
              type="number"
              value={costPrice || ''}
              onChange={(e) => setCostPrice(parseNumberInput(e.target.value))}
              placeholder="0"
            />
          </div>
          
          <Input
            label="Weight (kg)"
            type="number"
            value={weight || ''}
            onChange={(e) => setWeight(parseNumberInput(e.target.value))}
            placeholder="0"
          />
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Main Image *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setMainImage(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100"
            />
            <p className="text-xs text-gray-500">Co the bo trong neu backend khong bat buoc anh chinh.</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Additional Images
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setAdditionalImages(Array.from(e.target.files || []))}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100"
            />
            {additionalImages.length > 0 && (
              <p className="text-xs text-gray-500">Da chon {additionalImages.length} anh phu</p>
            )}
          </div>
          
          <Input
            label="Slug (SEO URL)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="gao-thom-st25"
          />
          
          <Input
            label="Meta Title (SEO)"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="Gạo thơm ST25 cao cấp"
          />
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Meta Description (SEO)
            </label>
            <textarea
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Mô tả cho SEO..."
              rows={2}
            />
          </div>
          
          <Input
            label="Meta Keywords (SEO)"
            value={metaKeywords}
            onChange={(e) => setMetaKeywords(e.target.value)}
            placeholder="gạo, thơm, st25"
          />
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Trạng thái
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
            >
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Không hoạt động</option>
            </select>
          </div>
        </form>
        </div>
      </Modal>
    </div>
  )
}
