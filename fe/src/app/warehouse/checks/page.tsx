'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { useAuthStore } from '@/store/auth.store'

export default function InventoryChecksPage() {
  const { user } = useAuthStore()
  const [showNewCheckModal, setShowNewCheckModal] = useState(false)
  const [checkType, setCheckType] = useState<'PARTIAL' | 'FULL'>('PARTIAL')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get user's workplace/location info
  const userWorkplaceId = user?.workplaceId || user?.warehouseId || user?.storeId || ''
  const userWorkplaceName = user?.name || 'Chỗ làm việc'

  const handleSubmit = async () => {
    if (!userWorkplaceId) {
      alert('Không tìm thấy thông tin chỗ làm việc.')
      return
    }

    try {
      setIsSubmitting(true)
      // TODO: Submit to API
      const payload = {
        locationId: userWorkplaceId,
        locationType: user?.roleId === 7 ? 'WAREHOUSE' : 'STORE',
        checkType: checkType,
        notes: notes,
        assignedStaff: [], // Chỉ gửi cho nhân viên nó quản lý
      }
      
      console.log('Creating inventory check:', payload)
      alert(`Tạo phiếu kiểm kê thành công!`)
      
      // Reset form
      setCheckType('PARTIAL')
      setNotes('')
      setShowNewCheckModal(false)
    } catch (error) {
      alert('Không thể tạo phiếu kiểm kê. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Old mock data removed - no longer needed

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kiểm kê tồn kho</h1>
          <p className="text-gray-600 mt-1">Tạo và quản lý phiếu kiểm kê tồn kho</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          onClick={() => setShowNewCheckModal(true)}
        >
          <Plus size={18} />
          Tạo phiếu kiểm kê
        </Button>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-12 text-center">
          <div className="text-gray-300 mb-4 flex justify-center">
            <Plus size={64} />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có phiếu kiểm kê nào</h3>
          <p className="text-gray-500">
            Bấm nút "Tạo phiếu kiểm kê" ở trên để bắt đầu
          </p>
        </div>
      </div>

      {/* Create Check Modal */}
      {showNewCheckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Tạo Phiếu Kiểm Kê</h2>
              <button
                onClick={() => setShowNewCheckModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Loại vị trí */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Loại vị trị
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm">
                  {user?.roleId === 7 ? 'Kho (WAREHOUSE)' : 'Cửa hàng (STORE)'}
                </div>
                <p className="text-xs text-gray-400 mt-1">Tự động được set dựa trên vai trò của bạn</p>
              </div>

              {/* Vị trị */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Vị trị làm việc
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm">
                  {userWorkplaceName}
                </div>
                <p className="text-xs text-gray-400 mt-1">Không thể thay đổi</p>
              </div>

              {/* Loại kiểm kê */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Loại kiểm kê <span className="text-red-400">*</span>
                </label>
                <select
                  value={checkType}
                  onChange={(e) => setCheckType(e.target.value as 'PARTIAL' | 'FULL')}
                  className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                >
                  <option value="PARTIAL">Kiểm kê cục bộ (PARTIAL)</option>
                  <option value="FULL">Kiểm kê toàn bộ (FULL)</option>
                </select>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhập ghi chú về phiếu kiểm kê..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                />
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">Lưu ý:</span> Phiếu kiểm kê sẽ được gửi đến các nhân viên trong quản lý của bạn.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowNewCheckModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60"
              >
                {isSubmitting ? 'Đang tạo...' : 'Tạo phiếu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
