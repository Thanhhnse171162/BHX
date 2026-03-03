'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { DataTable } from '@/shared/ui/DataTable'
import { CategoryAPIService, CategoryFromAPI } from '@/services/category-api.service'

interface CategoryRow {
  id: string
  name: string
  description: string
  level: number
  status: string
  createdAt: string
  [key: string]: unknown
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await CategoryAPIService.getAllCategories()
      
      // Transform API data
      const rows: CategoryRow[] = data.map((c: CategoryFromAPI) => ({
        id: c.id,
        name: c.name,
        description: c.description || '-',
        level: c.level,
        status: c.isActive ? 'Active' : 'Inactive',
        createdAt: c.createdAt,
      }))
      
      setCategories(rows)
    } catch (err) {
      console.error('Error loading categories:', err)
      setError('Không thể tải danh sách categories. Vui lòng kiểm tra backend.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Categories"
        subtitle="Manage product categories"
        actions={<Button>Create Category</Button>}
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
            action={<Button>Create Category</Button>}
          />
        )}

        {/* Data table */}
        {!isLoading && !error && categories.length > 0 && (
          <DataTable
            data={categories}
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'description', label: 'Description' },
              { key: 'level', label: 'Level' },
              {
                key: 'status',
                label: 'Status',
                render: (value) => (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      value === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {value}
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
            ]}
          />
        )}
      </div>
    </div>
  )
}
