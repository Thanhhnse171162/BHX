 'use client'

import { useEffect, useState } from 'react'
import { ProductAPIService, ProductFromAPI } from '@/services/product-api.service'
import { InventoryAPIService, InventoryItem } from '@/services/inventory-api.service'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import DataTable from '@/shared/ui/DataTable'
import PageHeader from '@/shared/ui/PageHeader'
import EmptyState from '@/shared/ui/EmptyState'
import Modal from '@/shared/ui/Modal'

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

  // Fetch products từ API backend
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
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
      
      setProducts(rows)
    } catch (err) {
      console.error('Error loading products:', err)
      setError('Không thể tải danh sách sản phẩm. Vui lòng kiểm tra backend đang chạy.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setMode('create')
    setEditingId(null)
    setSku('')
    setName('')
    setCategory('')
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
    setIsModalOpen(true)
  }

  const handleEdit = (row: ProductRow) => {
    setMode('edit')
    setEditingId(row.id)
    setSku(row.sku)
    setName(row.name)
    setCategory(row.category)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (mode === 'create') {
        // Swagger requires MainImage (multipart/form-data)
        if (!mainImage) {
          alert('Vui lòng chọn ảnh chính (Main Image).')
          return
        }

        const formData = new FormData()
        const appendIfDefined = (key: string, value: unknown) => {
          if (value === undefined || value === null || value === '') return
          formData.append(key, String(value))
        }

        appendIfDefined('Sku', sku)
        appendIfDefined('Name', name)
        appendIfDefined('CategoryId', category || '00000000-0000-0000-0000-000000000001')
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
        formData.append('MainImage', mainImage)
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
          const errorText = await response.text().catch(() => '')
          throw new Error(errorText || `Create product failed (${response.status})`)
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
      alert('Không thể lưu sản phẩm. Vui lòng thử lại.')
    }
  }

  const createProductButton = (
    <Button onClick={handleOpenCreate}>
      Create Product
    </Button>
  )

  return (
    <div className="p-6">
      <PageHeader
        title="Products"
        subtitle="Manage product catalog"
        actions={createProductButton}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Catalog', href: '/admin/catalog' },
          { label: 'Products', href: '/admin/catalog/products' },
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
            title="No Products"
            description="Add your first product to the catalog"
            action={createProductButton}
          />
        )}

        {/* Data table */}
        {!isLoading && !error && products.length > 0 && (
          <DataTable
            data={products}
            columns={[
              { key: 'sku', label: 'SKU' },
              { key: 'name', label: 'Name' },
              { key: 'category', label: 'Category' },
              {
                key: 'price',
                label: 'Price',
                render: (value) =>
                  new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(value as number),
              },
              { key: 'unit', label: 'Unit' },
              {
                key: 'totalQuantity',
                label: 'Total Stock',
                render: (value) => (
                  <span className="font-medium">
                    {value !== undefined && value !== null ? String(value) : 'N/A'}
                  </span>
                ),
              },
              {
                key: 'availableQuantity',
                label: 'Available',
                render: (value) => (
                  <span className="font-medium text-green-600">
                    {value !== undefined && value !== null ? String(value) : 'N/A'}
                  </span>
                ),
              },
              {
                key: 'reservedQuantity',
                label: 'Reserved',
                render: (value) => (
                  <span className="font-medium text-orange-600">
                    {value !== undefined && value !== null ? String(value) : 'N/A'}
                  </span>
                ),
              },
              {
                key: 'inventoryStatus',
                label: 'Stock Status',
                render: (value) => {
                  const statusColors = {
                    IN_STOCK: 'bg-green-100 text-green-800',
                    LOW_STOCK: 'bg-yellow-100 text-yellow-800',
                    OUT_OF_STOCK: 'bg-red-100 text-red-800',
                  }
                  const statusLabels = {
                    IN_STOCK: 'In Stock',
                    LOW_STOCK: 'Low Stock',
                    OUT_OF_STOCK: 'Out of Stock',
                  }
                  const status = value as 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
                  return (
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        statusColors[status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {statusLabels[status] || 'Unknown'}
                    </span>
                  )
                },
              },
              {
                key: 'status',
                label: 'Status',
                render: (value) => (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      value === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {value === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                ),
              },
              {
                key: 'createdAt',
                label: 'Created At',
                render: (value) =>
                  new Date(value as string).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }),
              },
              {
                key: 'id',
                label: 'Actions',
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
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(row.id)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  )
                },
              },
            ]}
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={mode === 'create' ? 'Create Product' : 'Edit Product'}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Save
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
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Gạo thơm ST25"
            required
          />
          <Input
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Gạo, mì"
            required
          />
          <Input
            label="Price"
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            required
          />
          <Input
            label="Unit"
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
              value={originalPrice}
              onChange={(e) => setOriginalPrice(Number(e.target.value))}
              placeholder="0"
            />
            <Input
              label="Cost Price"
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(Number(e.target.value))}
              placeholder="0"
            />
          </div>
          
          <Input
            label="Weight (kg)"
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
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
              Status
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </form>
        </div>
      </Modal>
    </div>
  )
}
