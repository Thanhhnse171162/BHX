'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { DataTable } from '@/shared/ui/DataTable'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Modal } from '@/shared/ui/Modal'
import { Input } from '@/shared/ui/Input'
import { Toast } from '@/shared/ui/Toast'
import type { AdminWarehouse } from '@/shared/types/warehouse.types'

interface CreateWarehouseForm {
  name: string
  location: string
  capacity: string
}

export default function WarehouseManagementPage() {
  const { user, token } = useAuthStore()
  const [warehouses, setWarehouses] = useState<AdminWarehouse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [formData, setFormData] = useState<CreateWarehouseForm>({
    name: '',
    location: '',
    capacity: '',
  })
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error'
  }>({ show: false, message: '', type: 'success' })

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
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

  const normalizeStatus = (status: unknown): 'ACTIVE' | 'INACTIVE' => {
    if (!status || typeof status !== 'string') return 'INACTIVE'
    const normalized = status.toUpperCase()
    if (normalized === 'ACTIVE' || normalized === 'INACTIVE') {
      return normalized as 'ACTIVE' | 'INACTIVE'
    }
    return 'INACTIVE'
  }

  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      location: '',
      capacity: '',
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      name: '',
      location: '',
      capacity: '',
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.workplaceId) {
      showToast('Unable to determine your warehouse location', 'error')
      return
    }

    if (!formData.name || !formData.location || !formData.capacity) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    const capacity = parseInt(formData.capacity, 10)
    if (isNaN(capacity) || capacity <= 0) {
      showToast('Capacity must be a positive number', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: formData.name,
        location: formData.location,
        capacity: capacity,
        status: 'ACTIVE',
        parentId: user.workplaceId,
        // createdBy is auto-set from JWT token by backend
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

      console.log('POST Response status:', response.status)

      if (response.ok || response.status === 200 || response.status === 201) {
        showToast('Warehouse created successfully', 'success')
        handleCloseModal()
        fetchSubWarehouses()
      } else {
        let errorMessage = 'Failed to create warehouse'
        try {
          const data = await response.json()
          errorMessage = data.message || errorMessage
        } catch (e) {
          const text = await response.text()
          console.log('Response text:', text)
        }
        showToast(errorMessage, 'error')
      }
    } catch (error) {
      console.error('Error creating warehouse:', error)
      showToast('Failed to create warehouse', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fetch sub-warehouses for the current user's workplace
  const fetchSubWarehouses = useCallback(async () => {
    if (!user?.workplaceId) {
      setError('Unable to determine your warehouse location')
      setWarehouses([])
      return
    }

    setLoading(true)
    setError(null)
    setCurrentPage(1)
    try {
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // Fetch all warehouses, then filter for sub-warehouses of current user's workplace
      const response = await fetch(`/api/warehouses?is_deleted=0`, { headers })
      const data = await response.json()

      if (data.success && Array.isArray(data.data)) {
        // Filter warehouses where parentId matches the current user's workplaceId
        const subWarehouses = data.data.filter(
          (w: AdminWarehouse) => w.parentId === user.workplaceId
        )
        
        // Normalize status values from API
        const normalized = subWarehouses.map((w: AdminWarehouse) => ({
          ...w,
          status: normalizeStatus(w.status),
        }))
        
        setWarehouses(normalized)
      } else {
        setError('Failed to fetch warehouse data')
        setWarehouses([])
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error)
      setError('Failed to load warehouses')
      setWarehouses([])
    } finally {
      setLoading(false)
    }
  }, [user?.workplaceId, token])

  useEffect(() => {
    void fetchSubWarehouses()
  }, [fetchSubWarehouses])

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    Active: 'Active',
    Inactive: 'Inactive',
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
    Active: 'bg-green-100 text-green-800',
    Inactive: 'bg-gray-100 text-gray-800',
  }

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
      key: 'status' as keyof AdminWarehouse,
      label: 'Trạng Thái',
      render: (_: unknown, item: AdminWarehouse) => {
        const normalized = normalizeStatus(item.status)
        const label = statusLabels[normalized] || 'Unknown'
        const color = statusColors[normalized] || 'bg-gray-100 text-gray-800'
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
      render: (_: unknown, item: AdminWarehouse) => (
        <div className="text-sm text-gray-600">{formatDate(item.createdAt)}</div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-[1600px] mx-auto">
        <PageHeader
          title="Quản Lý Kho"
          subtitle="Danh sách kho chi nhánh đang quản lý"
          actions={
            <Button onClick={handleOpenCreateModal}>
              + Thêm Kho Chi Nhánh
            </Button>
          }
        />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        ) : warehouses.length === 0 ? (
          <EmptyState
            title="Không có chi nhánh kho"
            description="Bạn hiện không quản lý chi nhánh kho nào"
          />
        ) : (
          <>
            {/* Data Table */}
            <DataTable 
              columns={columns} 
              data={warehouses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)} 
            />

            {/* Pagination Controls */}
            {warehouses.length > 0 && (
              <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-600">
                  Hiển thị <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> đến&nbsp;
                  <span className="font-semibold">{Math.min(currentPage * itemsPerPage, warehouses.length)}</span> trong&nbsp;
                  <span className="font-semibold">{warehouses.length}</span> kho
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
                    {Array.from({ length: Math.ceil(warehouses.length / itemsPerPage) }, (_, i) => i + 1)
                      .filter(page => {
                        const totalPages = Math.ceil(warehouses.length / itemsPerPage)
                        if (totalPages <= 5) return true
                        if (page === 1 || page === totalPages) return true
                        if (Math.abs(page - currentPage) <= 1) return true
                        return false
                      })
                      .map((page, idx, arr) => (
                        <div key={page}>
                          {idx > 0 && arr[idx - 1] !== page - 1 && <span className="px-1 text-gray-500">...</span>}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(warehouses.length / itemsPerPage)))}
                    disabled={currentPage === Math.ceil(warehouses.length / itemsPerPage)}
                  >
                    Trang sau →
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Thêm Kho Chi Nhánh"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tên Kho"
            required
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Nhập tên kho chi nhánh..."
          />

          <Input
            label="Địa Điểm"
            required
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Nhập địa điểm..."
          />

          <Input
            label="Dung Lượng"
            type="number"
            required
            name="capacity"
            value={formData.capacity}
            onChange={handleInputChange}
            placeholder="Nhập dung lượng..."
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo Kho'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}
    </div>
  )
}
