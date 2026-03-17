'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Eye, CheckCircle2, Clock3 } from 'lucide-react'

type StatusType = 'done' | 'pending' | 'error'

interface ImportOrder {
  code: string
  source: string
  dest: string
  createdAt: string
  receivedAt: string
  totalSku: number
  totalQty: number
  status: StatusType
}

const IMPORT_ORDERS: ImportOrder[] = [
  {
    code: 'REC-240801-001',
    source: 'Nhà máy Vinamilk',
    dest: 'Kho Quận 12',
    createdAt: '01/08/2024',
    receivedAt: '02/08/2024',
    totalSku: 12,
    totalQty: 1250,
    status: 'done'
  },
  {
    code: 'REC-240804-015',
    source: 'Kho Sóng Thần',
    dest: 'Kho Bình Dương',
    createdAt: '04/08/2024',
    receivedAt: '02/08/2026',
    totalSku: 8,
    totalQty: 450,
    status: 'pending'
  },
  {
    code: 'REC-240805-002',
    source: 'Nhà máy Hòa Phát',
    dest: 'Kho Thủ Đức',
    createdAt: '05/08/2024',
    receivedAt: '09/08/2024',
    totalSku: 5,
    totalQty: 200,
    status: 'done'
  },
  {
    code: 'REC-240806-009',
    source: 'Công ty TH True Milk',
    dest: 'Kho Quận 12',
    createdAt: '06/08/2025',
    receivedAt: '02/09/2025',
    totalSku: 15,
    totalQty: 1000,
    status: 'done'
  },
  {
    code: 'REC-240804-002',
    source: 'Hải Hà Kotobuki',
    dest: 'Kho Quận 12',
    createdAt: '04/08/2024',
    receivedAt: '07/08/2024',
    totalSku: 2,
    totalQty: 50,
    status: 'error'
  }
]

export default function ReceiveGoodsPage() {
  const router = useRouter();

  const [receivedQty, setReceivedQty] = useState('')
  const [expiredDate, setExpiredDate] = useState('')
  const [location, setLocation] = useState('')
  const [conditionNote, setConditionNote] = useState('')

  const [statusFilter, setStatusFilter] = useState<'all' | StatusType>('all')

  const selectedOrder = {
    id: 'REC-240801-001',
    productName: 'Sữa Vinamilk 1L',
    expectedQty: 100,
    sku: 'SKU-001'
  }

  const handleConfirmReceive = () => {
    alert('Đã xác nhận nhập hàng')
  }

  const filteredOrders = IMPORT_ORDERS.filter(order =>
    statusFilter === 'all' ? true : order.status === statusFilter
  )

  const statusBadge = (status: StatusType) => {
    switch (status) {
      case 'done':
        return (
          <span className="px-3 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium">
            Hoàn tất
          </span>
        )
      case 'pending':
        return (
          <span className="px-3 py-1 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">
            Chờ xử lý
          </span>
        )
      case 'error':
        return (
          <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-600 font-medium">
            Đã hủy
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Danh sách phiếu nhập hàng
          </h1>
          <p className="text-sm text-slate-500">
            Theo dõi và quản lý các chứng từ nhập kho
          </p>
        </div>

        <button
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm"
          onClick={() => router.push('/warehouse-store/receive-goods/create')}
        >
          <Plus size={18}/>
          Tạo phiếu nhập mới
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-xl border p-4 mb-6">

        <div className="flex flex-wrap gap-3 items-center">

          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-400"/>
            <input
              placeholder="Tìm kiếm mã phiếu, SKU..."
              className="pl-9 h-10 border rounded-lg text-sm px-3 w-[220px]"
            />
          </div>

          <select className="h-10 border rounded-lg px-3 text-sm">
            <option>Kho nguồn</option>
          </select>

          <select className="h-10 border rounded-lg px-3 text-sm">
            <option>Kho đích</option>
          </select>

          <input
            type="date"
            className="h-10 border rounded-lg px-3 text-sm"
          />

          <button className="h-10 px-4 border rounded-lg text-sm text-slate-600">
            Làm mới
          </button>

        </div>

        {/* STATUS TABS */}
        <div className="flex gap-2 mt-4">

          <button
            className={`px-4 py-1.5 rounded-full text-sm ${
              statusFilter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
            onClick={() => setStatusFilter('all')}
          >
            Tất cả
          </button>

          <button
            className={`px-4 py-1.5 rounded-full text-sm ${
              statusFilter === 'pending'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
            onClick={() => setStatusFilter('pending')}
          >
            Chờ xử lý
          </button>

          <button
            className={`px-4 py-1.5 rounded-full text-sm ${
              statusFilter === 'done'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
            onClick={() => setStatusFilter('done')}
          >
            Hoàn tất
          </button>

          <button
            className={`px-4 py-1.5 rounded-full text-sm ${
              statusFilter === 'error'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
            onClick={() => setStatusFilter('error')}
          >
            Đã hủy
          </button>

        </div>

      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-slate-50 text-slate-600">
            <tr className="text-left">
              <th className="p-4 font-medium">Mã phiếu</th>
              <th className="p-4 font-medium">Kho nguồn</th>
              <th className="p-4 font-medium">Kho đích</th>
              <th className="p-4 font-medium">Ngày tạo</th>
              <th className="p-4 font-medium">Ngày nhận</th>
              <th className="p-4 font-medium">Tổng SKU</th>
              <th className="p-4 font-medium">Số lượng</th>
              <th className="p-4 font-medium">Trạng thái</th>
              <th className="p-4 font-medium text-center">Hành động</th>
            </tr>
          </thead>

          <tbody>

            {filteredOrders.map(order => (

              <tr
                key={order.code}
                className="border-t hover:bg-slate-50"
              >
                <td className="p-4 font-semibold text-emerald-600">
                  {order.code}
                </td>

                <td className="p-4">{order.source}</td>

                <td className="p-4">{order.dest}</td>

                <td className="p-4">{order.createdAt}</td>

                <td className="p-4">{order.receivedAt}</td>

                <td className="p-4">{order.totalSku}</td>

                <td className="p-4 font-medium">
                  {order.totalQty.toLocaleString()}
                </td>

                <td className="p-4">
                  {statusBadge(order.status)}
                </td>

                <td className="p-4 text-center">
                  <button
                    className="text-slate-500 hover:text-emerald-600"
                    onClick={() => alert(`Xem chi tiết phiếu ${order.code}`)}
                  >
                    <Eye size={18}/>
                  </button>
                </td>

              </tr>

            ))}

          </tbody>

        </table>

        {/* FOOTER */}
        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-slate-500">

          <p>
            Hiển thị {filteredOrders.length} phiếu
          </p>

          <div className="flex items-center gap-2">

            <button className="w-8 h-8 border rounded-md text-slate-500">
              {'<'}
            </button>

            <button className="w-8 h-8 rounded-md bg-emerald-600 text-white">
              1
            </button>

            <button className="w-8 h-8 border rounded-md">
              2
            </button>

            <button className="w-8 h-8 border rounded-md">
              3
            </button>

            <span className="px-2">...</span>

            <button className="w-8 h-8 border rounded-md">
              30
            </button>

            <button className="w-8 h-8 border rounded-md text-slate-500">
              {'>'}
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}