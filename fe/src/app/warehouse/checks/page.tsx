'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Search, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import {
  getInventoryChecks,
  getInventoryCheckById,
  createInventoryCheck,
  submitInventoryCheck,
  type InventoryCheckListDto,
  type InventoryCheckDto,
  type InventoryCheckItemDto,
  type CreateInventoryCheckDto,
  type SubmitInventoryCheckDto,
} from '@/services/inventory-check-api'

export default function InventoryChecksPage() {
  const { user, token } = useAuthStore()
  
  // Checks list state
  const [checks, setChecks] = useState<InventoryCheckListDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ totalChecks: 0, completedChecks: 0, totalDiscrepancies: 0 })
  
  // Modal states
  const [showNewCheckModal, setShowNewCheckModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCheck, setSelectedCheck] = useState<InventoryCheckDto | null>(null)
  
  // Form states
  const [checkType, setCheckType] = useState<'PARTIAL' | 'FULL'>('PARTIAL')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Detail modal states
  const [searchQuery, setSearchQuery] = useState('')
  const [itemsToCheck, setItemsToCheck] = useState<InventoryCheckItemDto[]>([])
  const [checkedItems, setCheckedItems] = useState<Record<string, { actualQuantity: number; note: string }>>({})

  const userWorkplaceId = user?.workplaceId || user?.warehouseId || user?.storeId || ''
  const userWorkplaceName = user?.name || 'Chỗ làm việc'

  // Fetch inventory checks
  const fetchChecks = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await getInventoryChecks()
      setChecks(data)
      
      // Calculate stats
      const completed = data.filter(c => c.status === 'COMPLETED').length
      const discrepancies = data.reduce((sum, c) => sum + (c.totalDiscrepancies || 0), 0)
      setStats({
        totalChecks: data.length,
        completedChecks: completed,
        totalDiscrepancies: discrepancies,
      })
    } catch (err) {
      setError('Không thể tải danh sách phiếu kiểm kê.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  // Fetch items for check detail
  const fetchCheckItems = useCallback(async (checkId: string) => {
    if (!token) return
    try {
      const data = await getInventoryCheckById(checkId)
      setItemsToCheck(data.items || [])
    } catch (err) {
      console.error('Failed to fetch check items:', err)
      setItemsToCheck([])
    }
  }, [token])

  useEffect(() => {
    if (token && userWorkplaceId) {
      fetchChecks()
    }
  }, [token, userWorkplaceId, fetchChecks])

  const handleSubmit = async () => {
    if (!userWorkplaceId) {
      alert('Không tìm thấy thông tin chỗ làm việc.')
      return
    }

    try {
      setIsSubmitting(true)
      const payload: CreateInventoryCheckDto = {
        locationId: userWorkplaceId,
        locationType: user?.roleId === 7 ? 'WAREHOUSE' : 'STORE',
        checkType: checkType,
        notes: notes,
      }
      
      await createInventoryCheck(payload)
      alert(`Tạo phiếu kiểm kê thành công!`)
      setCheckType('PARTIAL')
      setNotes('')
      setShowNewCheckModal(false)
      fetchChecks()
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Không thể tạo phiếu kiểm kê. Vui lòng thử lại.'
      alert(msg)
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenDetailModal = (check: InventoryCheckListDto) => {
    setSelectedCheck(null) // Will be loaded by fetchCheckItems
    setShowDetailModal(true)
    setCheckedItems({})
    setSearchQuery('')
    fetchCheckItems(check.id)
    // Store check info for display
    setSelectedCheck(check as any)
  }

  const handleCompleteCheck = async () => {
    if (!selectedCheck) return
    
    const payload: SubmitInventoryCheckDto = {
      items: itemsToCheck.map(item => ({
        productId: item.productId,
        unit: item.Unit || item.unit,
        actualQuantity: checkedItems[item.id]?.actualQuantity ?? item.actualQuantity ?? 0,
        note: checkedItems[item.id]?.note ?? item.note ?? '',
      })),
    }

    try {
      await submitInventoryCheck(selectedCheck.id, payload)
      alert('Hoàn thành kiểm kê thành công!')
      setShowDetailModal(false)
      setSelectedCheck(null)
      setCheckedItems({})
      fetchChecks()
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Không thể hoàn thành kiểm kê.'
      alert(msg)
      console.error(error)
    }
  }

  // Filter items by search
  const filteredItems = itemsToCheck.filter(item =>
    item.productId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Old mock data removed - no longer needed

  return (
    <div className="space-y-6 pb-10">
      {/* ══════════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tổng phiếu kiểm kê</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalChecks}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Plus size={18} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Đã hoàn thành</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedChecks}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={18} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tổng chênh lệch</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalDiscrepancies}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════ */}
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

      {/* ══════════════════════════════════════════════════════
          CHECKS LIST
      ══════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Lịch sử kiểm kê</h2>
        </div>

        {error && (
          <div className="mx-4 mt-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Phiếu kiểm kê', 'Ngày kiểm', 'Người kiểm', 'Chênh lệch', 'Trạng thái', 'Ghi chú'].map(col => (
                  <th key={col} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    Đang tải...
                  </td>
                </tr>
              ) : checks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    Chưa có phiếu kiểm kê nào
                  </td>
                </tr>
              ) : (
                checks.map((check) => (
                  <tr 
                    key={check.id} 
                    onClick={() => handleOpenDetailModal(check)}
                    className="border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{check.checkNumber || check.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(check.checkDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {check.checkedBy ? `${check.checkedBy.slice(0, 8)}...` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={check.totalDiscrepancies && check.totalDiscrepancies > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                        {check.totalDiscrepancies ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        check.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        check.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {check.status === 'COMPLETED' ? 'Hoàn thành' :
                         check.status === 'IN_PROGRESS' ? 'Đang kiểm' :
                         'Chờ xử lý'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                      —
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          CREATE CHECK MODAL
      ══════════════════════════════════════════════════════ */}
      {showNewCheckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Tạo Phiếu Kiểm Kê</h2>
              <button
                onClick={() => setShowNewCheckModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Loại vị trị
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm">
                  {user?.roleId === 7 ? 'Kho (WAREHOUSE)' : 'Cửa hàng (STORE)'}
                </div>
                <p className="text-xs text-gray-400 mt-1">Tự động được set dựa trên vai trò của bạn</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Vị trị làm việc
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm">
                  {userWorkplaceName}
                </div>
                <p className="text-xs text-gray-400 mt-1">Không thể thay đổi</p>
              </div>

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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">Lưu ý:</span> Phiếu kiểm kê sẽ được gửi đến các nhân viên trong quản lý của bạn.
                </p>
              </div>
            </div>

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
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                Tạo phiếu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          CHECK DETAIL MODAL
      ══════════════════════════════════════════════════════ */}
      {showDetailModal && selectedCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Kiểm tra tồn kho</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedCheck.checkNumber || selectedCheck.id.slice(0, 8)} • {selectedCheck.checkType === 'FULL' ? 'Kiểm kê toàn bộ' : 'Kiểm kê cục bộ'}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  Kiểm tra và nhập số lượng thực tế của các sản phẩm. Hệ thống sẽ so sánh với số lượng trong kho.
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm theo tên hoặc SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {['Sản phẩm', 'SL Hệ thống', 'SL Thực tế', 'Chênh lệch', 'Ghi chú'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">
                          Không tìm thấy sản phẩm
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const actualQty = checkedItems[item.id]?.actualQuantity ?? item.actualQuantity ?? 0
                        const discrepancy = actualQty - item.systemQuantity
                        const unit = item.Unit || item.unit || ''
                        return (
                          <tr key={item.id} className={discrepancy === 0 ? 'bg-green-50' : ''}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{item.productId}</div>
                            </td>
                            <td className="px-4 py-3 font-medium">{item.systemQuantity} {unit}</td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={checkedItems[item.id]?.actualQuantity ?? ''}
                                onChange={(e) => {
                                  setCheckedItems(prev => ({
                                    ...prev,
                                    [item.id]: {
                                      actualQuantity: Math.max(0, parseInt(e.target.value) || 0),
                                      note: prev[item.id]?.note ?? ''
                                    }
                                  }))
                                }}
                                className="w-24 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                min="0"
                              />
                            </td>
                            <td className="px-4 py-3">
                              {discrepancy === 0 ? (
                                <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                                  <CheckCircle size={14} /> Khớp
                                </span>
                              ) : (
                                <span className={`font-semibold ${discrepancy > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                  {discrepancy > 0 ? '+' : ''}{discrepancy}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={checkedItems[item.id]?.note ?? ''}
                                onChange={(e) => {
                                  setCheckedItems(prev => ({
                                    ...prev,
                                    [item.id]: {
                                      actualQuantity: prev[item.id]?.actualQuantity ?? item.actualQuantity ?? 0,
                                      note: e.target.value
                                    }
                                  }))
                                }}
                                placeholder="Ghi chú..."
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                              />
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{Object.keys(checkedItems).length}</div>
                    <div className="text-xs text-gray-600">Đã kiểm tra</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{filteredItems.length}</div>
                    <div className="text-xs text-gray-600">Tổng sản phẩm</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {Object.entries(checkedItems).filter(([id, data]) => {
                        const item = itemsToCheck.find(i => i.id === id)
                        return item && data.actualQuantity !== item.systemQuantity
                      }).length}
                    </div>
                    <div className="text-xs text-gray-600">Chênh lệch</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCompleteCheck}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle size={14} />
                Hoàn thành kiểm tra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
