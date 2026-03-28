'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Send, Plus, Trash2 } from 'lucide-react'

interface DispatchItem {
  id: string
  productName: string
  sku: string
  quantity: number
  unit: string
  location: string
}

export default function DispatchDetailPage() {
  const router = useRouter()
  const [items, setItems] = useState<DispatchItem[]>([
    {
      id: '1',
      productName: 'Sữa Vinamilk 1L',
      sku: 'SKU-001',
      quantity: 100,
      unit: 'Hộp',
      location: 'A1-01'
    },
    {
      id: '2',
      productName: 'Dầu ăn Tường An 2L',
      sku: 'SKU-002',
      quantity: 50,
      unit: 'Chai',
      location: 'B2-03'
    }
  ])

  const [showAddItem, setShowAddItem] = useState(false)
  const [newItem, setNewItem] = useState({
    productName: '',
    sku: '',
    quantity: '',
    unit: 'Hộp',
    location: ''
  })

  const handleAddItem = () => {
    if (newItem.productName && newItem.sku && newItem.quantity && newItem.location) {
      setItems([
        ...items,
        {
          id: Date.now().toString(),
          ...newItem,
          quantity: parseInt(newItem.quantity)
        }
      ])
      setNewItem({
        productName: '',
        sku: '',
        quantity: '',
        unit: 'Hộp',
        location: ''
      })
      setShowAddItem(false)
    }
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Phiếu xuất hàng DIS-240801-001
            </h1>
            <p className="text-sm text-slate-500">
              Xuất hàng đến Cửa hàng Quận 1
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download size={18} />
            Xuất PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
            <Send size={18} />
            Gửi hàng
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-6">
          {/* THÔNG TIN CHUNG */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Thông tin chung</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Mã phiếu</label>
                <p className="mt-1 text-slate-800 font-semibold">DIS-240801-001</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Ngày tạo</label>
                <p className="mt-1 text-slate-800">01/08/2024</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Kho nguồn</label>
                <p className="mt-1 text-slate-800">Kho Quận 12</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Cửa hàng đích</label>
                <p className="mt-1 text-slate-800">Cửa hàng Quận 1</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Ưu tiên</label>
                <p className="mt-1">
                  <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium">
                    Cao
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Trạng thái</label>
                <p className="mt-1">
                  <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium">
                    Hoàn tất
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* DANH SÁCH SẢN PHẨM */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Danh sách sản phẩm</h2>
              <button
                onClick={() => setShowAddItem(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <Plus size={16} />
                Thêm sản phẩm
              </button>
            </div>

            {/* ADD ITEM FORM */}
            {showAddItem && (
              <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Tên sản phẩm"
                    className="px-3 py-2 border rounded-lg text-sm"
                    value={newItem.productName}
                    onChange={(e) => setNewItem({ ...newItem, productName: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="SKU"
                    className="px-3 py-2 border rounded-lg text-sm"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Số lượng"
                    className="px-3 py-2 border rounded-lg text-sm"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  />
                  <select
                    className="px-3 py-2 border rounded-lg text-sm"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  >
                    <option>Hộp</option>
                    <option>Chai</option>
                    <option>Cái</option>
                    <option>Bộ</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Vị trí kho"
                    className="px-3 py-2 border rounded-lg text-sm col-span-2"
                    value={newItem.location}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddItem}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
                  >
                    Thêm
                  </button>
                  <button
                    onClick={() => setShowAddItem(false)}
                    className="px-3 py-1.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            {/* ITEMS TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left">
                    <th className="p-3 font-medium text-slate-600">Tên sản phẩm</th>
                    <th className="p-3 font-medium text-slate-600">SKU</th>
                    <th className="p-3 font-medium text-slate-600">Số lượng</th>
                    <th className="p-3 font-medium text-slate-600">Đơn vị</th>
                    <th className="p-3 font-medium text-slate-600">Vị trí kho</th>
                    <th className="p-3 font-medium text-slate-600 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800">{item.productName}</td>
                      <td className="p-3 text-slate-600">{item.sku}</td>
                      <td className="p-3 text-slate-800 font-semibold">{item.quantity}</td>
                      <td className="p-3 text-slate-600">{item.unit}</td>
                      <td className="p-3 text-slate-600">{item.location}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GHI CHÚ */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Ghi chú</h2>
            <textarea
              className="w-full px-3 py-2 border rounded-lg text-sm"
              rows={4}
              placeholder="Nhập ghi chú cho phiếu xuất hàng..."
              defaultValue="Hàng được đóng gói cẩn thận, ki��m tra kỹ trước khi gửi."
            />
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          {/* TÓMLƯỢC */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Tóm lược</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Tổng SKU:</span>
                <span className="font-semibold text-slate-800">{items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Tổng số lượng:</span>
                <span className="font-semibold text-slate-800">{totalQuantity}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Trạng thái:</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium">
                    Hoàn tất
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* LỊCH SỬ */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Lịch sử</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-slate-800">Gửi hàng</p>
                  <p className="text-slate-500">02/08/2024 10:30 AM</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-slate-800">Tạo phiếu</p>
                  <p className="text-slate-500">01/08/2024 02:15 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* THÔNG TIN LIÊN HỆ */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Thông tin liên hệ</h2>
            
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-slate-600">Người tạo:</p>
                <p className="font-medium text-slate-800">Nguyễn Văn A</p>
              </div>
              <div>
                <p className="text-slate-600">Người gửi:</p>
                <p className="font-medium text-slate-800">Trần Thị B</p>
              </div>
              <div>
                <p className="text-slate-600">Người nhận:</p>
                <p className="font-medium text-slate-800">Lê Văn C</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
