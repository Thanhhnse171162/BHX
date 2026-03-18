'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Eye, CheckCircle2, Clock3, Truck, AlertCircle } from 'lucide-react'

type StatusType = 'done' | 'pending' | 'shipped' | 'cancelled'

interface DispatchOrder {
  code: string
  destination: string
  source: string
  createdAt: string
  shippedAt: string
  totalSku: number
  totalQty: number
  status: StatusType
  priority: 'high' | 'medium' | 'low'
}

const DISPATCH_ORDERS: DispatchOrder[] = [
  {
    code: 'DIS-240801-001',
    destination: 'Cửa hàng Quận 1',
    source: 'Kho Quận 12',
    createdAt: '01/08/2024',
    shippedAt: '02/08/2024',
    totalSku: 12,
    totalQty: 1250,
    status: 'done',
    priority: 'high'
  },
  {
    code: 'DIS-240804-015',
    destination: 'Cửa hàng Quận 3',
    source: 'Kho Bình Dương',
    createdAt: '04/08/2024',
    shippedAt: '05/08/2024',
    totalSku: 8,
    totalQty: 450,
    status: 'shipped',
    priority: 'medium'
  },
  {
    code: 'DIS-240805-002',
    destination: 'Cửa hàng Quận 5',
    source: 'Kho Thủ Đức',
    createdAt: '05/08/2024',
    shippedAt: '06/08/2024',
    totalSku: 5,
    totalQty: 200,
    status: 'done',
    priority: 'low'
  },
  {
    code: 'DIS-240806-009',
    destination: 'Cửa hàng Quận 7',
    source: 'Kho Quận 12',
    createdAt: '06/08/2024',
    shippedAt: '07/08/2024',
    totalSku: 15,
    totalQty: 1000,
    status: 'shipped',
    priority: 'high'
  },
  {
    code: 'DIS-240807-003',
    destination: 'Cửa hàng Quận 9',
    source: 'Kho Quận 12',
    createdAt: '07/08/2024',
    shippedAt: '',
    totalSku: 10,
    totalQty: 500,
    status: 'pending',
    priority: 'medium'
  },
  {
    code: 'DIS-240804-005',
    destination: 'Cửa hàng Quận 11',
    source: 'Kho Bình Dương',
    createdAt: '04/08/2024',
    shippedAt: '05/08/2024',
    totalSku: 7,
    totalQty: 350,
    status: 'cancelled',
    priority: 'low'
  }
]

export default function DispatchGoodsPage() {
  const router = useRouter()

  const [statusFilter, setStatusFilter] = useState<'all' | StatusType>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const handleConfirmDispatch = () => {
    alert('Đã xác nhận xuất hàng')
  }

  const filteredOrders = DISPATCH_ORDERS.filter(order => {
    const matchesStatus = statusFilter === 'all' ? true : order.status === statusFilter
    const matchesSearch = order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.destination.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const statusBadge = (status: StatusType) => {
    switch (status) {
      case 'done':
        return (
          <span className="px-3 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium flex items-center gap-1 w-fit">
            <CheckCircle2 size={14} />
            Hoàn tất
          </span>
        )
      case 'pending':
        return (
          <span className="px-3 py-1 text-xs rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1 w-fit">
            <Clock3 size={14} />
            Chờ xử lý
          </span>
        )
      case 'shipped':
        return (
          <span className="px-3 py-1 text-xs rounded-full bg-sky-100 text-sky-700 font-medium flex items-center gap-1 w-fit">
            <Truck size={14} />
            Đã gửi
          </span>
        )
      case 'cancelled':
        return (
          <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-600 font-medium flex items-center gap-1 w-fit">
            <AlertCircle size={14} />
            Đã hủy
          </span>
        )
      default:
        return null
    }
  }

  const priorityBadge = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium">
            Cao
          </span>
        )
      case 'medium':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">
            Trung bình
          </span>
        )
      case 'low':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700 font-medium">
            Thấp
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
            Danh sách phiếu xuất hàng
          </h1>
          <p className="text-sm text-slate-500">
            Theo dõi và quản lý các chứng từ xuất kho
          </p>
        </div>

        <button
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm"
          onClick={() => router.push('/warehouse-staff/dispatch-goods/create')}
        >
          <Plus size={18}/>
          Tạo phiếu xuất mới
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-xl border p-4 mb-6">

        <div className="flex flex-wrap gap-3 items-center">

          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-400"/>
            <input
              placeholder="Tìm kiếm mã phiếu, cửa hàng..."
              className="pl-9 h-10 border rounded-lg text-sm px-3 w-[220px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select className="h-10 border rounded-lg px-3 text-sm">
            <option>Kho nguồn</option>
            <option>Kho Quận 12</option>
            <option>Kho Bình Dương</option>
            <option>Kho Thủ Đức</option>
          </select>

          <select className="h-10 border rounded-lg px-3 text-sm">
            <option>Cửa hàng đích</option>
            <option>Cửa hàng Quận 1</option>
            <option>Cửa hàng Quận 3</option>
            <option>Cửa hàng Quận 5</option>
          </select>

          <input
            type="date"
            className="h-10 border rounded-lg px-3 text-sm"
          />

          <button className="h-10 px-4 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            Làm mới
          </button>

        </div>

        {/* STATUS TABS */}
        <div className="flex gap-2 mt-4 flex-wrap">

          <button
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => setStatusFilter('all')}
          >
            Tất cả
          </button>

          <button
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => setStatusFilter('pending')}
          >
            Chờ xử lý
          </button>

          <button
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'shipped'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => setStatusFilter('shipped')}
          >
            Đã gửi
          </button>

          <button
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'done'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => setStatusFilter('done')}
          >
            Hoàn tất
          </button>

          <button
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'cancelled'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => setStatusFilter('cancelled')}
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
              <th className="p-4 font-medium">Cửa hàng đích</th>
              <th className="p-4 font-medium">Ngày tạo</th>
              <th className="p-4 font-medium">Ngày gửi</th>
              <th className="p-4 font-medium">Tổng SKU</th>
              <th className="p-4 font-medium">Số lượng</th>
              <th className="p-4 font-medium">Ưu tiên</th>
              <th className="p-4 font-medium">Trạng thái</th>
              <th className="p-4 font-medium text-center">Hành động</th>
            </tr>
          </thead>

          <tbody>

            {filteredOrders.map(order => (

              <tr
                key={order.code}
                className="border-t hover:bg-slate-50 transition-colors"
              >
                <td className="p-4 font-semibold text-emerald-600">
                  {order.code}
                </td>

                <td className="p-4">{order.source}</td>

                <td className="p-4">{order.destination}</td>

                <td className="p-4">{order.createdAt}</td>

                <td className="p-4">{order.shippedAt || '-'}</td>

                <td className="p-4">{order.totalSku}</td>

                <td className="p-4 font-medium">
                  {order.totalQty.toLocaleString()}
                </td>

                <td className="p-4">
                  {priorityBadge(order.priority)}
                </td>

                <td className="p-4">
                  {statusBadge(order.status)}
                </td>

                <td className="p-4 text-center">
                  <button
                    className="text-slate-500 hover:text-emerald-600 transition-colors"
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

            <button className="w-8 h-8 border rounded-md text-slate-500 hover:bg-slate-50">
              {'<'}
            </button>

            <button className="w-8 h-8 rounded-md bg-emerald-600 text-white">
              1
            </button>

            <button className="w-8 h-8 border rounded-md hover:bg-slate-50">
              2
            </button>

            <button className="w-8 h-8 border rounded-md hover:bg-slate-50">
              3
            </button>

            <span className="px-2">...</span>

            <button className="w-8 h-8 border rounded-md hover:bg-slate-50">
              30
            </button>

            <button className="w-8 h-8 border rounded-md text-slate-500 hover:bg-slate-50">
              {'>'}
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}
