'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { DataTable } from '@/shared/ui/DataTable'
import { Modal } from '@/shared/ui/Modal'
import { CategoryAPIService, CategoryFromAPI } from '@/services/category-api.service'

interface CategoryRow {
  id: string
  hasRealId: boolean
  backendId: string | null
  name: string
  status: string
  createdAt: string
  updatedAt: string | null
  [key: string]: unknown
}

const resolveCategoryId = (category: CategoryFromAPI): string | null => {
  const candidates = [
    category.id,
    (category as any).ID,
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
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  return null
}

const buildFallbackCategoryId = (index: number): string => {
  const tail = String(index + 1).padStart(12, '0')
  return `C0000001-0001-0001-0001-${tail}`
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState('')
  const [editingName, setEditingName] = useState('')
  const [editingStatus, setEditingStatus] = useState('ACTIVE')
  const [editingIsDeleted, setEditingIsDeleted] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('🔍 Fetching categories...')
      const data = await CategoryAPIService.getAllCategories()
      console.log('✅ Raw data:', data)
      
      // Transform API data từ BE hiện tại
      const rows: CategoryRow[] = data.map((c: CategoryFromAPI, index) => {
        const apiId = resolveCategoryId(c)
        const fallbackId = buildFallbackCategoryId(index)
        return {
          // Nếu API list chưa trả id, fallback theo format id hiện tại trong DB để vẫn edit được.
          id: apiId || fallbackId,
          hasRealId: true,
          backendId: apiId,
          name: c.name,
          status: c.status,  // ACTIVE hoặc INACTIVE
          createdAt: c.createdAt || c.created_at || '',
          updatedAt: c.updatedAt ?? c.updated_at ?? null,
        }
      })
      
      console.log('✅ Transformed rows:', rows)
      setCategories(rows)
    } catch (err: any) {
      console.error('❌ Error loading categories:', err)
      console.error('Error details:', err.response?.data || err.message)
      setError('Không thể tải danh sách categories. Vui lòng kiểm tra backend.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenEdit = (row: CategoryRow) => {
    if (!row.hasRealId) {
      alert('Khong the update category nay vi response get-all-categories chua tra id hop le.')
      return
    }

    setEditingCategoryId(row.id)
    setEditingName(row.name)
    setEditingStatus(row.status || 'ACTIVE')
    setEditingIsDeleted(false)
    setIsEditModalOpen(true)
  }

  const handleOpenCreate = () => {
    setNewCategoryName('')
    setIsCreateModalOpen(true)
  }

  const handleCloseCreate = () => {
    if (isCreating) return
    setIsCreateModalOpen(false)
  }

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim()
    if (!name) {
      alert('Vui long nhap ten category.')
      return
    }

    try {
      setIsCreating(true)
      await CategoryAPIService.createCategory({ name })
      alert('Tao category thanh cong!')
      setIsCreateModalOpen(false)
      await fetchCategories()
    } catch (err: any) {
      console.error('❌ Error creating category:', err)
      const message = err?.response?.data?.message || err?.message || 'Khong the tao category.'
      alert(message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCloseEdit = () => {
    setIsEditModalOpen(false)
  }

  const handleUpdateCategory = async () => {
    if (!editingCategoryId || !editingName.trim()) {
      alert('Vui long nhap ten category.')
      return
    }

    try {
      setIsUpdating(true)
      await CategoryAPIService.updateCategory(editingCategoryId, {
        name: editingName.trim(),
        status: editingStatus,
        isDeleted: editingIsDeleted,
      })
      alert('Cap nhat category thanh cong!')
      setIsEditModalOpen(false)
      await fetchCategories()
    } catch (err: any) {
      console.error('❌ Error updating category:', err)
      const message = err?.response?.data?.message || err?.message || 'Khong the cap nhat category.'
      alert(message)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Categories"
        subtitle="Manage product categories"
        actions={<Button onClick={handleOpenCreate}>Create Category</Button>}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Catalog', href: '/admin/catalog' },
          { label: 'Categories', href: '/admin/catalog/categories' },
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
              onClick={fetchCategories}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && categories.length === 0 && (
          <EmptyState
            title="No Categories"
            description="Create your first product category"
            action={<Button onClick={handleOpenCreate}>Create Category</Button>}
          />
        )}

        {/* Data table */}
        {!isLoading && !error && categories.length > 0 && (
          <DataTable
            data={categories}
            columns={[
              { key: 'name', label: 'Name' },
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
                    {String(value)}
                  </span>
                ),
              },
              {
                key: 'createdAt',
                label: 'Created At',
                render: (value) => {
                  const dateValue = value as string
                  if (!dateValue) return '-'
                  const date = new Date(dateValue)
                  return Number.isNaN(date.getTime())
                    ? '-'
                    : date.toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                },
              },
              {
                key: 'updatedAt',
                label: 'Updated At',
                render: (value) => {
                  if (!value) return '-'
                  const date = new Date(value as string)
                  return Number.isNaN(date.getTime())
                    ? '-'
                    : date.toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                },
              },
              {
                key: 'id',
                label: 'Actions',
                render: (_value, item) => {
                  const row = item as unknown as CategoryRow
                  return (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenEdit(row)
                        }}
                      >
                        Edit
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
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreate}
        title="Create Category"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseCreate} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEdit}
        title="Update Category"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseEdit}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              placeholder="Category name"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={editingStatus}
              onChange={(e) => setEditingStatus(e.target.value)}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={editingIsDeleted}
              onChange={(e) => setEditingIsDeleted(e.target.checked)}
            />
            Is Deleted
          </label>
        </div>
      </Modal>
    </div>
  )
}
