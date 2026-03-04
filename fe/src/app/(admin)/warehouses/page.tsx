'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { DataTable } from '@/shared/ui/DataTable'
import Modal from '@/shared/ui/Modal'
import { FilterBar } from '@/shared/ui/FilterBar'
import { Toast } from '@/shared/ui/Toast'
import type { 
  AdminWarehouse, 
  AdminWarehouseFilters, 
  AdminWarehouseFormData 
} from '@/shared/types/warehouse.types'

const statusLabels = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
}

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
}

export default function WarehousesAdminPage() {
  const [filteredWarehouses, setFilteredWarehouses] = useState<AdminWarehouse[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Toast state
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error'
  }>({ show: false, message: '', type: 'success' })

  // Form state
  const [formData, setFormData] = useState<AdminWarehouseFormData>({
    name: '',
    location: '',
    capacity: 0,
    status: 'ACTIVE',
  })

  // Filter state
  const [filters, setFilters] = useState<AdminWarehouseFilters>({
    id: '',
    name: '',
    location: '',
    capacityMin: '',
    capacityMax: '',
    status: '',
    isDeleted: '0', // Default to show only active (not deleted)
    createdAtFrom: '',
    createdAtTo: '',
    createdBy: '',
  })

  // Fetch warehouses
  const fetchWarehouses = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      
      if (filters.id) queryParams.append('id', filters.id)
      if (filters.name) queryParams.append('name', filters.name)
      if (filters.location) queryParams.append('location', filters.location)
      if (filters.capacityMin) queryParams.append('capacity_min', filters.capacityMin)
      if (filters.capacityMax) queryParams.append('capacity_max', filters.capacityMax)
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.isDeleted) queryParams.append('is_deleted', filters.isDeleted)
      if (filters.createdAtFrom) queryParams.append('created_at_from', filters.createdAtFrom)
      if (filters.createdAtTo) queryParams.append('created_at_to', filters.createdAtTo)
      if (filters.createdBy) queryParams.append('created_by', filters.createdBy)

      const response = await fetch(`/api/warehouses?${queryParams.toString()}`)
      const data = await response.json()

      if (data.success) {
        setFilteredWarehouses(data.data)
      } else {
        showToast('Failed to fetch warehouses', 'error')
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error)
      showToast('Failed to fetch warehouses', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWarehouses()
  }, []) // Initial load

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  const handleOpenCreate = () => {
    setMode('create')
    setEditingId(null)
    setFormData({
      name: '',
      location: '',
      capacity: 0,
      status: 'ACTIVE',
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      name: '',
      location: '',
      capacity: 0,
      status: 'ACTIVE',
    })
    setEditingId(null)
  }

  const handleEditClick = (warehouse: AdminWarehouse) => {
    setMode('edit')
    setEditingId(warehouse.id)
    setFormData({
      name: warehouse.name,
      location: warehouse.location,
      capacity: warehouse.capacity,
      status: warehouse.status,
    })
    setIsModalOpen(true)
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa kho này? (Soft delete)')) {
      return
    }

    try {
      const response = await fetch(`/api/warehouses/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        showToast('Warehouse deleted successfully', 'success')
        fetchWarehouses()
      } else {
        showToast(data.message || 'Failed to delete warehouse', 'error')
      }
    } catch (error) {
      console.error('Error deleting warehouse:', error)
      showToast('Failed to delete warehouse', 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.location || formData.capacity <= 0) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    try {
      if (mode === 'create') {
        // Create new warehouse
        const response = await fetch('/api/warehouses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            created_by: 'current-user-id', // Replace with actual user ID
          }),
        })

        const data = await response.json()

        if (data.success) {
          showToast('Warehouse created successfully', 'success')
          fetchWarehouses()
          handleCloseModal()
        } else {
          showToast(data.message || 'Failed to create warehouse', 'error')
        }
      } else if (mode === 'edit' && editingId) {
        // Update existing warehouse
        const response = await fetch(`/api/warehouses/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        const data = await response.json()

        if (data.success) {
          showToast('Warehouse updated successfully', 'success')
          fetchWarehouses()
          handleCloseModal()
        } else {
          showToast(data.message || 'Failed to update warehouse', 'error')
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      showToast('An error occurred', 'error')
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleApplyFilters = () => {
    fetchWarehouses()
  }

  const handleResetFilters = () => {
    setFilters({
      id: '',
      name: '',
      location: '',
      capacityMin: '',
      capacityMax: '',
      status: '',
      isDeleted: '0',
      createdAtFrom: '',
      createdAtTo: '',
      createdBy: '',
    })
    // Fetch will be triggered by useEffect or you can call it directly
    setTimeout(() => fetchWarehouses(), 100)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const columns = [
    {
      key: 'id' as keyof AdminWarehouse,
      label: 'ID',
      render: (_: unknown, item: AdminWarehouse) => (
        <div className="font-mono text-xs text-gray-600">
          {item.id.substring(0, 20)}...
        </div>
      ),
    },
    {
      key: 'name' as keyof AdminWarehouse,
      label: 'Tên Kho',
      render: (_: unknown, item: AdminWarehouse) => (
        <div className="font-semibold text-gray-900">{item.name}</div>
      ),
    },
    {
      key: 'location' as keyof AdminWarehouse,
      label: 'Địa Điểm',
      render: (_: unknown, item: AdminWarehouse) => (
        <div className="text-gray-700">{item.location}</div>
      ),
    },
    {
      key: 'capacity' as keyof AdminWarehouse,
      label: 'Dung Lượng',
      render: (_: unknown, item: AdminWarehouse) => (
        <div className="text-gray-900">{item.capacity}</div>
      ),
    },
    {
      key: 'status' as keyof AdminWarehouse,
      label: 'Trạng Thái',
      render: (_: unknown, item: AdminWarehouse) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            statusColors[item.status]
          }`}
        >
          {statusLabels[item.status]}
        </span>
      ),
    },
    {
      key: 'is_deleted' as keyof AdminWarehouse,
      label: 'Đã Xóa',
      render: (_: unknown, item: AdminWarehouse) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            item.is_deleted === 0
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {item.is_deleted === 0 ? 'No' : 'Yes'}
        </span>
      ),
    },
    {
      key: 'created_at' as keyof AdminWarehouse,
      label: 'Ngày Tạo',
      render: (_: unknown, item: AdminWarehouse) => (
        <div className="text-sm text-gray-600">{formatDate(item.created_at)}</div>
      ),
    },
    {
      key: 'created_by' as keyof AdminWarehouse,
      label: 'Người Tạo',
      render: (_: unknown, item: AdminWarehouse) => (
        <div className="font-mono text-xs text-gray-600">
          {item.created_by.substring(0, 15)}...
        </div>
      ),
    },
    {
      key: 'actions' as keyof AdminWarehouse,
      label: 'Thao Tác',
      render: (_: unknown, item: AdminWarehouse) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditClick(item)}
            disabled={item.is_deleted === 1}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteItem(item.id)}
            disabled={item.is_deleted === 1}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-[1600px] mx-auto">
        <PageHeader
          title="Quản Lý Kho"
          subtitle="Quản lý thông tin kho hàng trong hệ thống"
          actions={
            <Button onClick={handleOpenCreate}>
              + Thêm Kho Mới
            </Button>
          }
        />

        {/* Filters */}
        <FilterBar onReset={handleResetFilters}>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Row 1 */}
            <Input
              label="ID"
              placeholder="Tìm theo ID..."
              value={filters.id}
              onChange={(e) => handleFilterChange('id', e.target.value)}
            />
            <Input
              label="Tên Kho"
              placeholder="Tìm theo tên..."
              value={filters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
            />
            <Input
              label="Địa Điểm"
              placeholder="Tìm theo địa điểm..."
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng Thái
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Row 2 */}
            <Input
              label="Dung Lượng Tối Thiểu"
              type="number"
              placeholder="Min capacity..."
              value={filters.capacityMin}
              onChange={(e) => handleFilterChange('capacityMin', e.target.value)}
            />
            <Input
              label="Dung Lượng Tối Đa"
              type="number"
              placeholder="Max capacity..."
              value={filters.capacityMax}
              onChange={(e) => handleFilterChange('capacityMax', e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đã Xóa
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.isDeleted}
                onChange={(e) => handleFilterChange('isDeleted', e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="0">Chưa xóa</option>
                <option value="1">Đã xóa</option>
              </select>
            </div>
            <Input
              label="Người Tạo"
              placeholder="Tìm theo người tạo..."
              value={filters.createdBy}
              onChange={(e) => handleFilterChange('createdBy', e.target.value)}
            />

            {/* Row 3 */}
            <Input
              label="Ngày Tạo (Từ)"
              type="date"
              value={filters.createdAtFrom}
              onChange={(e) => handleFilterChange('createdAtFrom', e.target.value)}
            />
            <Input
              label="Ngày Tạo (Đến)"
              type="date"
              value={filters.createdAtTo}
              onChange={(e) => handleFilterChange('createdAtTo', e.target.value)}
            />
            <div className="flex items-end">
              <Button onClick={handleApplyFilters} className="w-full">
                Áp Dụng Lọc
              </Button>
            </div>
          </div>
        </FilterBar>

        {/* Data Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        ) : filteredWarehouses.length === 0 ? (
          <EmptyState
            title="Không có kho nào"
            description="Bắt đầu bằng cách thêm kho mới vào hệ thống"
            action={
              <Button onClick={handleOpenCreate}>
                + Thêm Kho Đầu Tiên
              </Button>
            }
          />
        ) : (
          <DataTable columns={columns} data={filteredWarehouses} />
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={mode === 'create' ? 'Thêm Kho Mới' : 'Chỉnh Sửa Kho'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tên Kho"
            required
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="Nhập tên kho..."
          />

          <Input
            label="Địa Điểm"
            required
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="Nhập địa điểm..."
          />

          <Input
            label="Dung Lượng"
            type="number"
            required
            value={formData.capacity}
            onChange={(e) =>
              setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })
            }
            placeholder="Nhập dung lượng..."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng Thái
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'ACTIVE' | 'INACTIVE',
                })
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Hủy
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Tạo Kho' : 'Cập Nhật'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  )
}
