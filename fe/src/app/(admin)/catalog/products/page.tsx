 'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { DataTable } from '@/shared/ui/DataTable'
import { Input } from '@/shared/ui/Input'
import Modal from '@/shared/ui/Modal'
import { ProductAPIService, ProductFromAPI } from '@/services/product-api.service'

type ProductStatus = 'ACTIVE' | 'INACTIVE'

interface ProductRow {
  id: string
  sku: string
  name: string
  category: string
  price: number
  status: ProductStatus
  createdAt: string
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
  const [status, setStatus] = useState<ProductStatus>('ACTIVE')

  // Fetch products từ API backend
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await ProductAPIService.getAllProducts()
      
      // Transform API data sang ProductRow format
      const rows: ProductRow[] = data.map((p: ProductFromAPI) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.categoryName || 'Unknown',
        price: p.price,
        status: p.isActive ? 'ACTIVE' : 'INACTIVE',
        createdAt: p.createdAt,
      }))
      
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
    setStatus('ACTIVE')
    setIsModalOpen(true)
  }

  const handleEdit = (row: ProductRow) => {
    setMode('edit')
    setEditingId(row.id)
    setSku(row.sku)
    setName(row.name)
    setCategory(row.category)
    setPrice(row.price)
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
        // TODO: Cần lấy categoryId thực từ API, hiện tại dùng giá trị tạm
        await ProductAPIService.createProduct({
          sku,
          name,
          // Tạm thời dùng categoryId mặc định, cần sửa sau khi có API Categories
          categoryId: '00000000-0000-0000-0000-000000000001',
          price,
          originalPrice: price,
          weight: 1,
          isActive: status === 'ACTIVE',
          isFeatured: false,
        })
        alert('Tạo sản phẩm thành công!')
      } else if (mode === 'edit' && editingId) {
        await ProductAPIService.updateProduct(editingId, {
          sku,
          name,
          price,
          isActive: status === 'ACTIVE',
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
      </Modal>
    </div>
  )
}
