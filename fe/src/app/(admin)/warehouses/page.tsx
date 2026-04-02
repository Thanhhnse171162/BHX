'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { DataTable } from '@/shared/ui/DataTable'
import Modal from '@/shared/ui/Modal'
import { Toast } from '@/shared/ui/Toast'
import type { 
  AdminWarehouse, 
  AdminWarehouseFilters, 
  AdminWarehouseFormData 
} from '@/shared/types/warehouse.types'

const statusLabels = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
}

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  Active: 'bg-green-100 text-green-800',
  Inactive: 'bg-gray-100 text-gray-800',
}

// Normalize status value to handle both ACTIVE/INACTIVE and Active/Inactive
const normalizeStatus = (status: unknown): string => {
  if (!status || typeof status !== 'string') return 'INACTIVE'
  const normalized = status.toUpperCase()
  if (normalized === 'ACTIVE' || normalized === 'INACTIVE') {
    return normalized
  }
  return 'INACTIVE'
}

// Translate error messages from English to Vietnamese
const translateErrorMessage = (message: string): string => {
  const translations: Record<string, string> = {
    'Cannot delete warehouse because some inventory records still have quantity > 0': 'Không thể xóa kho vì một số bản ghi tồn kho vẫn có hàng',
    'Failed to delete warehouse': 'Không thể xóa kho',
    'Unauthorized': 'Không có quyền truy cập',
  }
  
  for (const [en, vi] of Object.entries(translations)) {
    if (message && message.includes(en)) {
      return message.replace(en, vi)
    }
  }
  
  return message
}

export default function WarehousesAdminPage() {
  const { token } = useAuthStore()
  const [filteredWarehouses, setFilteredWarehouses] = useState<AdminWarehouse[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
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
    parentId: undefined,
    isDeleted: false,
  })

  // Available warehouses for parent selection
  const [availableWarehouses, setAvailableWarehouses] = useState<AdminWarehouse[]>([])

  // Filter state
  const [filters] = useState<AdminWarehouseFilters>({
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

  // Normalize warehouse data from API
  const normalizeWarehouseData = (warehouses: AdminWarehouse[]): AdminWarehouse[] => {
    return warehouses.map(w => ({
      ...w,
      status: normalizeStatus(w.status) as 'ACTIVE' | 'INACTIVE'
    }))
  }

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }, [])

  // Fetch warehouses
  const fetchWarehouses = useCallback(async () => {
    setLoading(true)
    setCurrentPage(1) // Reset to page 1 when fetching new data
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

      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/warehouses?${queryParams.toString()}`, { headers })
      const data = await response.json()

      if (data.success) {
        // Normalize status values from API
        const normalizedData = Array.isArray(data.data) ? normalizeWarehouseData(data.data) : []
        setFilteredWarehouses(normalizedData)
      } else {
        showToast('Failed to fetch warehouses', 'error')
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error)
      showToast('Failed to fetch warehouses', 'error')
    } finally {
      setLoading(false)
    }
  }, [token, filters, showToast])

  useEffect(() => {
    void fetchWarehouses()
  }, [fetchWarehouses])

  // Fetch all warehouses for parent selection dropdown
  const fetchAllWarehousesForParent = async () => {
    try {
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/warehouses?is_deleted=0', { headers })
      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        // Normalize status values from API
        const normalizedData = normalizeWarehouseData(data.data)
        setAvailableWarehouses(normalizedData)
      }
    } catch (error) {
      console.error('Error fetching warehouses for parent selection:', error)
    }
  }

  const handleOpenCreate = () => {
    setMode('create')
    setEditingId(null)
    setFormData({
      name: '',
      location: '',
      capacity: 1,
      status: 'ACTIVE',
      parentId: undefined,
      isDeleted: false,
    })
    fetchAllWarehousesForParent()
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      name: '',
      location: '',
      capacity: 0,
      status: 'ACTIVE',
      parentId: undefined,
      isDeleted: false,
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
      parentId: warehouse.parentId,
      isDeleted: warehouse.isDeleted,
    })
    fetchAllWarehousesForParent()
    setIsModalOpen(true)
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa kho này? (Soft delete)')) {
      return
    }

    try {
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/warehouses/${id}`, {
        method: 'DELETE',
        headers,
      })

      console.log('DELETE Response status:', response.status, 'ok:', response.ok)

      if (response.ok || response.status === 200) {
        showToast('Warehouse deleted successfully', 'success')
        fetchWarehouses()
      } else {
        let errorMessage = 'Không thể xóa kho'
        try {
          const data = await response.json()
          errorMessage = translateErrorMessage(data.message || errorMessage)
        } catch (_e) {
          const text = await response.text()
          console.log('Response text:', text)
        }
        showToast(errorMessage, 'error')
      }
    } catch (error) {
      console.error('Error deleting warehouse:', error)
      showToast('Không thể xóa kho', 'error')
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
        // Create new warehouse - flat payload, backend auto-sets createdBy from JWT
        const payload: any = {
          name: formData.name,
          location: formData.location,
          capacity: formData.capacity,
          status: formData.status === 'ACTIVE' ? 'Active' : 'Inactive', // .NET API expects "Active"/"Inactive"
        }
        
        // Only include parentId if it has a value
        if (formData.parentId) {
          payload.parentId = formData.parentId
        }

        const headers: HeadersInit = { 'Content-Type': 'application/json' }
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch('/api/warehouses', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        })

        console.log('POST Response status:', response.status, 'ok:', response.ok)
        console.log('POST payload:', payload)

        if (response.ok || response.status === 200 || response.status === 201) {
          showToast('Warehouse created successfully', 'success')
          fetchWarehouses()
          handleCloseModal()
        } else {
          let errorMessage = 'Failed to create warehouse'
          try {
            const data = await response.json()
            errorMessage = data.message || errorMessage
          } catch (_e) {
            const text = await response.text()
            console.log('Response text:', text)
          }
          showToast(errorMessage, 'error')
        }
      } else if (mode === 'edit' && editingId) {
        // Update existing warehouse
        const payload: any = {
          name: formData.name,
          location: formData.location,
          capacity: formData.capacity,
          status: formData.status === 'ACTIVE' ? 'Active' : 'Inactive',
          isDeleted: formData.isDeleted || false,
        }
        
        // Only include parentId if it has a value
        if (formData.parentId) {
          payload.parentId = formData.parentId
        }

        const headers: HeadersInit = { 'Content-Type': 'application/json' }
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch(`/api/Warehouse/warehouses/${editingId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload),
        })

        console.log('PATCH Response status:', response.status, 'ok:', response.ok)
        console.log('PATCH payload:', payload)

        if (response.ok || response.status === 200) {
          showToast('Warehouse updated successfully', 'success')
          fetchWarehouses()
          handleCloseModal()
        } else {
          let errorMessage = 'Failed to update warehouse'
          try {
            const data = await response.json()
            errorMessage = data.message || errorMessage
          } catch (_e) {
            const text = await response.text()
            console.log('Response text:', text)
          }
          showToast(errorMessage, 'error')
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      showToast('An error occurred', 'error')
    }
  }

  const formatDate = (dateString: unknown) => {
    if (!dateString || typeof dateString !== 'string') return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'N/A'
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return 'N/A'
    }
  }

  // Get parent warehouse name by ID
  const getParentWarehouseName = (parentId: string | undefined): string => {
    if (!parentId) return 'Không'
    const parentWarehouse = filteredWarehouses.find(w => w.id === parentId)
    return parentWarehouse ? parentWarehouse.name : parentId.substring(0, 12) + '...'
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredWarehouses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedWarehouses = filteredWarehouses.slice(startIndex, endIndex)

  const columns = [
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
      key: 'parentId' as keyof AdminWarehouse,
      label: 'Kho Phụ',
      render: (_: unknown, item: AdminWarehouse) => (
        <div className="text-sm text-gray-700">
          {getParentWarehouseName(item.parentId)}
        </div>
      ),
    },
    {
      key: 'status' as keyof AdminWarehouse,
      label: 'Trạng Thái',
      render: (_: unknown, item: AdminWarehouse) => {
        const normalizedStatus = normalizeStatus(item.status)
        const label = statusLabels[normalizedStatus as keyof typeof statusLabels] || 'Unknown'
        const color = statusColors[normalizedStatus as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
          >
            {label}
          </span>
        )
      },
    },
    {
      key: 'createdAt' as keyof AdminWarehouse,
      label: 'Ngày Tạo',
      render: (_: unknown, item: AdminWarehouse) => {
        const dateValue = item.createdAt
        if (!dateValue) {
          console.warn('No createdAt for item:', item)
        }
        return <div className="text-sm text-gray-600">{formatDate(dateValue)}</div>
      },
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
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteItem(item.id)}
            disabled={item.isDeleted}
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
          <>
            <DataTable columns={columns} data={paginatedWarehouses} />
            
            {/* Pagination Controls */}
            <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-semibold">{startIndex + 1}</span> đến&nbsp;
                <span className="font-semibold">{Math.min(endIndex, filteredWarehouses.length)}</span> trong&nbsp;
                <span className="font-semibold">{filteredWarehouses.length}</span> kho
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  ← Trang trước
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Trang sau →
                </Button>
              </div>
            </div>
          </>
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

          {mode === 'edit' && (
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
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kho Phụ Thuộc
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.parentId || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  parentId: e.target.value || undefined,
                })
              }
            >
              <option value="">Không chọn (Kho gốc)</option>
              {availableWarehouses
                .filter((w) => w.id !== editingId && !w.isDeleted) // Exclude current warehouse and deleted warehouses
                .map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({warehouse.location})
                  </option>
                ))}
            </select>
          </div>

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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDeleted"
              checked={formData.isDeleted || false}
              onChange={(e) =>
                setFormData({ ...formData, isDeleted: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="isDeleted" className="text-sm font-medium text-gray-700 cursor-pointer">
              Đánh dấu là đã xóa
            </label>
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
