'use client'

import { useState } from 'react'
import { TrendingUp, Plus, Send, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/shared/ui/Button'

interface RestockRequest {
  id: string
  requestDate: string
  requestedBy: string
  status: 'pending' | 'approved' | 'delivering' | 'completed' | 'rejected'
  totalItems: number
  items: {
    productName: string
    sku: string
    requestedQty: number
    approvedQty?: number
  }[]
  note?: string
  approvedBy?: string
  approvedDate?: string
}

export default function RestockRequestPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Map<string, number>>(new Map())

  // Mock data
  const requests: RestockRequest[] = [
    {
      id: 'RQ-2026-001',
      requestDate: '2026-03-02',
      requestedBy: 'Lê Văn Quân Lý',
      status: 'pending',
      totalItems: 3,
      items: [
        { productName: 'Sprite 330ml', sku: 'BEV-003', requestedQty: 200 },
        { productName: 'Fanta 330ml', sku: 'BEV-004', requestedQty: 150 },
        { productName: 'Mars 51g', sku: 'MRS-001', requestedQty: 180 },
      ],
      note: 'Sản phẩm bán chạy, cần bổ sung gấp',
    },
    {
      id: 'RQ-2026-002',
      requestDate: '2026-03-01',
      requestedBy: 'Lê Văn Quân Lý',
      status: 'approved',
      totalItems: 2,
      items: [
        { productName: 'Pringles 100g', sku: 'CHP-003', requestedQty: 300, approvedQty: 300 },
        { productName: 'Twix 50g', sku: 'TWX-001', requestedQty: 200, approvedQty: 200 },
      ],
      note: 'Bổ sung cho khuyến mãi',
      approvedBy: 'Admin',
      approvedDate: '2026-03-01',
    },
    {
      id: 'RQ-2026-003',
      requestDate: '2026-02-28',
      requestedBy: 'Lê Văn Quân Lý',
      status: 'completed',
      totalItems: 4,
      items: [
        { productName: 'Coca Cola 330ml', sku: 'BEV-001', requestedQty: 500, approvedQty: 500 },
        { productName: 'Pepsi 330ml', sku: 'BEV-002', requestedQty: 400, approvedQty: 400 },
        { productName: 'Snickers 50g', sku: 'SNC-001', requestedQty: 300, approvedQty: 300 },
        { productName: 'KitKat 45g', sku: 'KTK-001', requestedQty: 250, approvedQty: 250 },
      ],
      approvedBy: 'Admin',
      approvedDate: '2026-02-28',
    },
  ]

  const availableProducts = [
    { id: '1', name: 'Coca Cola 330ml', sku: 'BEV-001', currentStock: 200, minStock: 150 },
    { id: '2', name: 'Pepsi 330ml', sku: 'BEV-002', currentStock: 160, minStock: 120 },
    { id: '3', name: 'Sprite 330ml', sku: 'BEV-003', currentStock: 95, minStock: 100 },
    { id: '4', name: 'Fanta 330ml', sku: 'BEV-004', currentStock: 45, minStock: 80 },
  ]

  const getStatusBadge = (status: string) => {
    const config = {
      'pending': { label: 'Chờ duyệt', class: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'approved': { label: 'Đã duyệt', class: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      'delivering': { label: 'Đang giao', class: 'bg-purple-100 text-purple-800', icon: TrendingUp },
      'completed': { label: 'Hoàn thành', class: 'bg-green-100 text-green-800', icon: CheckCircle },
      'rejected': { label: 'Từ chối', class: 'bg-red-100 text-red-800', icon: XCircle },
    }
    const cfg = config[status as keyof typeof config]
    const Icon = cfg.icon
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${cfg.class}`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    )
  }

  const handleCreateRequest = () => {
    if (selectedProducts.size === 0) {
      alert('Vui lòng chọn sản phẩm!')
      return
    }
    alert('Đã tạo yêu cầu nhập hàng thành công!')
    setShowCreateForm(false)
    setSelectedProducts(new Map())
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restock Request</h1>
          <p className="text-gray-600 mt-1">Yêu cầu nhập hàng từ kho tổng</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <Plus className="w-5 h-5 mr-2" />
          Tạo yêu cầu mới
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tạo yêu cầu nhập hàng</h2>
          
          <div className="space-y-4">
            {availableProducts.map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Tồn hiện tại: <span className="font-semibold">{product.currentStock}</span> | 
                      Mức tối thiểu: <span className="font-semibold">{product.minStock}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      placeholder="Số lượng"
                      value={selectedProducts.get(product.id) || ''}
                      onChange={(e) => {
                        const newMap = new Map(selectedProducts)
                        const qty = parseInt(e.target.value) || 0
                        if (qty > 0) {
                          newMap.set(product.id, qty)
                        } else {
                          newMap.delete(product.id)
                        }
                        setSelectedProducts(newMap)
                      }}
                      className="w-28 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
            <textarea
              rows={3}
              placeholder="Thêm ghi chú cho yêu cầu..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="primary" onClick={handleCreateRequest}>
              <Send className="w-4 h-4 mr-2" />
              Gửi yêu cầu
            </Button>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Danh sách yêu cầu</h2>
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{request.id}</h3>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Ngày tạo: {request.requestDate}</p>
                      <p>Người tạo: {request.requestedBy}</p>
                      {request.approvedBy && (
                        <p>Duyệt bởi: {request.approvedBy} - {request.approvedDate}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t pt-3 mt-3">
                  <p className="font-semibold text-gray-900 mb-2">Chi tiết sản phẩm:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {request.items.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded text-sm">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-gray-600">
                          Yêu cầu: <span className="font-semibold">{item.requestedQty}</span>
                          {item.approvedQty !== undefined && (
                            <> | Duyệt: <span className="font-semibold text-green-600">{item.approvedQty}</span></>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {request.note && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Ghi chú:</span> {request.note}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
