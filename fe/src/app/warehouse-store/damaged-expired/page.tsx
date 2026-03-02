'use client'

import { useState } from 'react'
import { AlertOctagon, Plus, Save, Calendar, Package } from 'lucide-react'
import { Button } from '@/shared/ui/Button'

interface DamagedExpiredRecord {
  id: string
  reportDate: string
  reportedBy: string
  type: 'damaged' | 'expired'
  productName: string
  sku: string
  quantity: number
  reason: string
  note?: string
  status: 'pending' | 'approved' | 'disposed'
}

export default function DamagedExpiredPage() {
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportType, setReportType] = useState<'damaged' | 'expired'>('damaged')

  // Mock data
  const records: DamagedExpiredRecord[] = [
    {
      id: 'DMG-2026-001',
      reportDate: '2026-03-02',
      reportedBy: 'Lê Văn Quân Lý',
      type: 'damaged',
      productName: 'Coca Cola 330ml',
      sku: 'BEV-001',
      quantity: 5,
      reason: 'Hư hỏng khi vận chuyển',
      note: 'Lon bị móp méo',
      status: 'pending',
    },
    {
      id: 'EXP-2026-001',
      reportDate: '2026-03-01',
      reportedBy: 'Lê Văn Quân Lý',
      type: 'expired',
      productName: 'Snickers 50g',
      sku: 'SNC-001',
      quantity: 15,
      reason: 'Hết hạn sử dụng',
      note: 'HSD: 28/02/2026',
      status: 'approved',
    },
    {
      id: 'DMG-2026-002',
      reportDate: '2026-02-28',
      reportedBy: 'Lê Văn Quân Lý',
      type: 'damaged',
      productName: 'Pringles 100g',
      sku: 'CHP-003',
      quantity: 3,
      reason: 'Bao bì rách',
      status: 'disposed',
    },
    {
      id: 'EXP-2026-002',
      reportDate: '2026-02-27',
      reportedBy: 'Lê Văn Quân Lý',
      type: 'expired',
      productName: 'KitKat 45g',
      sku: 'KTK-001',
      quantity: 8,
      reason: 'Hết hạn sử dụng',
      note: 'HSD: 25/02/2026',
      status: 'disposed',
    },
  ]

  const damagedRecords = records.filter(r => r.type === 'damaged')
  const expiredRecords = records.filter(r => r.type === 'expired')

  const getTypeBadge = (type: string) => {
    return type === 'damaged' ? (
      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
        Hư hỏng
      </span>
    ) : (
      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
        Hết hạn
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const config = {
      'pending': { label: 'Chờ xử lý', class: 'bg-yellow-100 text-yellow-800' },
      'approved': { label: 'Đã duyệt', class: 'bg-blue-100 text-blue-800' },
      'disposed': { label: 'Đã loại bỏ', class: 'bg-gray-100 text-gray-800' },
    }
    const cfg = config[status as keyof typeof config]
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${cfg.class}`}>
        {cfg.label}
      </span>
    )
  }

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Đã ghi nhận hàng hư hỏng/hết hạn và trừ tồn kho!')
    setShowReportForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Damaged / Expired Goods</h1>
          <p className="text-gray-600 mt-1">Quản lý hàng hư hỏng và hết hạn</p>
        </div>
        <Button
          variant="primary"
          className="bg-red-600 hover:bg-red-700"
          onClick={() => setShowReportForm(!showReportForm)}
        >
          <Plus className="w-5 h-5 mr-2" />
          Ghi nhận hư hỏng/hết hạn
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-red-50 rounded-xl shadow p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700">Hư hỏng tháng này</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{damagedRecords.length}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertOctagon className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-orange-50 rounded-xl shadow p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700">Hết hạn tháng này</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{expiredRecords.length}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">Tổng số lượng loại bỏ</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {records.reduce((sum, r) => sum + r.quantity, 0)}
              </p>
            </div>
            <div className="bg-gray-200 p-3 rounded-lg">
              <Package className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Report Form */}
      {showReportForm && (
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ghi nhận hàng hư hỏng / hết hạn</h2>
          
          <form onSubmit={handleSubmitReport} className="space-y-4">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    value="damaged"
                    checked={reportType === 'damaged'}
                    onChange={(e) => setReportType(e.target.value as 'damaged')}
                    className="w-4 h-4 text-red-600"
                  />
                  <span className="text-gray-700">Hư hỏng</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    value="expired"
                    checked={reportType === 'expired'}
                    onChange={(e) => setReportType(e.target.value as 'expired')}
                    className="w-4 h-4 text-orange-600"
                  />
                  <span className="text-gray-700">Hết hạn</span>
                </label>
              </div>
            </div>

            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sản phẩm</label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" required>
                <option value="">Chọn sản phẩm</option>
                <option value="BEV-001">Coca Cola 330ml (BEV-001)</option>
                <option value="BEV-002">Pepsi 330ml (BEV-002)</option>
                <option value="SNC-001">Snickers 50g (SNC-001)</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng</label>
              <input
                type="number"
                min="1"
                required
                placeholder="Nhập số lượng"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lý do</label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" required>
                <option value="">Chọn lý do</option>
                {reportType === 'damaged' ? (
                  <>
                    <option value="transport">Hư hỏng khi vận chuyển</option>
                    <option value="storage">Hư hỏng khi lưu kho</option>
                    <option value="package">Bao bì rách/hỏng</option>
                    <option value="quality">Lỗi chất lượng</option>
                    <option value="other">Khác</option>
                  </>
                ) : (
                  <>
                    <option value="expired">Hết hạn sử dụng</option>
                    <option value="near-expired">Gần hết hạn</option>
                    <option value="recall">Thu hồi sản phẩm</option>
                  </>
                )}
              </select>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
              <textarea
                rows={3}
                placeholder="Thêm ghi chúchi tiết..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" variant="primary" className="bg-red-600 hover:bg-red-700">
                <Save className="w-4 h-4 mr-2" />
                Lưu và trừ tồn kho
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowReportForm(false)}>
                Hủy
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Records List */}
      <div className="bg-white rounded-xl shadow border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Lịch sử ghi nhận</h2>
          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                className={`border rounded-lg p-4 ${
                  record.type === 'damaged' ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{record.id}</h3>
                      {getTypeBadge(record.type)}
                      {getStatusBadge(record.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-600">Sản phẩm</p>
                        <p className="font-semibold text-gray-900">{record.productName}</p>
                        <p className="text-xs text-gray-500">{record.sku}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Số lượng</p>
                        <p className="font-bold text-red-600">{record.quantity}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Ngày ghi nhận</p>
                        <p className="font-semibold text-gray-900">{record.reportDate}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Người ghi nhận</p>
                        <p className="font-semibold text-gray-900">{record.reportedBy}</p>
                      </div>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-700">
                        <span className="font-semibold">Lý do:</span> {record.reason}
                      </p>
                      {record.note && (
                        <p className="text-gray-700 mt-1">
                          <span className="font-semibold">Ghi chú:</span> {record.note}
                        </p>
                      )}
                    </div>
                  </div>
                  {record.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-4 text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Duyệt loại bỏ
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex gap-3">
          <AlertOctagon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-2">Lưu ý quan trọng</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Ghi nhận hàng hư hỏng/hết hạn ngay khi phát hiện</li>
              <li>• Chụp ảnh làm bằng chứng trước khi loại bỏ</li>
              <li>• Tách biệt hàng hư hỏng/hết hạn khỏi kho hàng tốt</li>
              <li>• Hệ thống sẽ tự động trừ tồn kho sau khi lưu biên bản</li>
              <li>• Cần có sự duyệt của quản lý trước khi loại bỏ hoàn toàn</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
