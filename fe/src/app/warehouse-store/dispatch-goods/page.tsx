'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Eye, CheckCircle2, Clock3, Truck, AlertCircle, X, Loader } from 'lucide-react'
import { TransferAPIService, ReceiveTransferDTO, TransferFromAPI } from '@/services/transfer-api.service'
import { localApiClient } from '@/shared/api/http'

type StatusType = 'done' | 'pending' | 'shipped' | 'cancelled' | 'intransit'

interface DispatchItem {
  id: string
  productId: string
  batchId?: string | null
  requestedQuantity: number
  shippedQuantity?: number | null
  receivedQuantity?: number | null
  damagedQuantity: number
  notes?: string | null
}

interface DispatchOrder {
  id: string
  transferNumber: string
  code: string
  destination: string
  source: string
  createdAt: string
  shippedAt: string
  totalSku: number
  totalQty: number
  status: StatusType
  priority: 'high' | 'medium' | 'low'
  items: DispatchItem[]
}

interface ReceiveItem {
  transferItemId: string
  shippedQuantity: number
  damagedQuantity: number
  notes: string
}

const STATIC_LOCATION_NAMES: Record<string, string> = {
  'a0000001-0001-0001-0001-000000000001': 'Kho HCM',
  'a0000001-0001-0001-0001-000000000002': 'Kho Chi Nhánh Quận 12',
  'a0000001-0001-0001-0001-000000000003': 'Kho Chi Nhánh Bình Dương',
  'a0000001-0001-0001-0001-000000000004': 'Kho Chi Nhánh Long An',
  'b0000001-0001-0001-0001-000000000001': 'Cửa Hàng Thủ Đức',
  'b0000001-0001-0001-0001-000000000002': 'Cửa Hàng Giải Phóng HCM',
  'b0000001-0001-0001-0001-000000000003': 'Cửa Hàng Bình Dương',
  'b0000001-0001-0001-0001-000000000004': 'Cửa Hàng Củ Chi',
  'b0000001-0001-0001-0001-000000000005': 'Cửa Hàng Biên Hòa',
  'b0000001-0001-0001-0001-000000000006': 'Cửa Hàng Quận 7',
}

const mapStatus = (status?: string): StatusType => {
  const normalized = String(status ?? '').toUpperCase()
  if (normalized === 'COMPLETED') return 'done'
  if (normalized === 'CANCELLED') return 'cancelled'
  if (normalized === 'SHIPPED' || normalized === 'IN_TRANSIT') return 'intransit'
  return 'pending'
}

const formatDate = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const mapTransferToDispatchOrder = (transfer: TransferFromAPI): DispatchOrder => {
  const items = (transfer.items ?? []).map(item => ({
    id: item.id,
    productId: item.productId,
    batchId: item.batchId,
    requestedQuantity: Number(item.requestedQuantity ?? 0),
    shippedQuantity: item.shippedQuantity,
    receivedQuantity: item.receivedQuantity,
    damagedQuantity: Number(item.damagedQuantity ?? 0),
    notes: item.notes,
  }))

  const totalQty = items.reduce((sum, item) => {
    const qty = Number(item.shippedQuantity ?? item.requestedQuantity ?? 0)
    return sum + (Number.isFinite(qty) ? qty : 0)
  }, 0)

  return {
    id: transfer.id,
    transferNumber: transfer.transferNumber,
    code: transfer.transferNumber,
    destination: transfer.toLocationId,
    source: transfer.fromLocationId,
    createdAt: formatDate(transfer.transferDate),
    shippedAt: formatDate(transfer.actualDelivery ?? transfer.expectedDelivery),
    totalSku: items.length,
    totalQty,
    status: mapStatus(transfer.status),
    priority: 'medium',
    items,
  }
}

const DISPATCH_ORDERS: DispatchOrder[] = [
  {
    id: 'f5ec79f2-f580-4e3a-a347-6e57da1312bd',
    transferNumber: 'TRF-2026-001',
    code: 'DIS-240801-001',
    destination: 'Cửa hàng Quận 1',
    source: 'Kho Quận 12',
    createdAt: '01/08/2024',
    shippedAt: '02/08/2024',
    totalSku: 12,
    totalQty: 1250,
    status: 'intransit',
    priority: 'high',
    items: [
      {
        id: 'd14e14a7-f2f3-453c-9a9f-61fd08e6fd3a',
        productId: 'f0000001-0001-0001-0001-000000000005',
        batchId: 'ba000001-0001-0001-0001-000000000001',
        requestedQuantity: 10,
        shippedQuantity: 10,
        damagedQuantity: 0,
        notes: null
      }
    ]
  },
  {
    id: 'a1b2c3d4-e5f6-4a5b-6c7d-8e9f0a1b2c3d',
    transferNumber: 'TRF-2026-002',
    code: 'DIS-240804-015',
    destination: 'Cửa hàng Quận 3',
    source: 'Kho Bình Dương',
    createdAt: '04/08/2024',
    shippedAt: '05/08/2024',
    totalSku: 8,
    totalQty: 450,
    status: 'intransit',
    priority: 'medium',
    items: [
      {
        id: 'd14e14a7-f2f3-453c-9a9f-61fd08e6fd3b',
        productId: 'f0000001-0001-0001-0001-000000000006',
        batchId: 'ba000001-0001-0001-0001-000000000002',
        requestedQuantity: 8,
        shippedQuantity: 8,
        damagedQuantity: 0,
        notes: null
      }
    ]
  },
  {
    id: 'b2c3d4e5-f6a7-4b6c-7d8e-9f0a1b2c3d4e',
    transferNumber: 'TRF-2026-003',
    code: 'DIS-240805-002',
    destination: 'Cửa hàng Quận 5',
    source: 'Kho Thủ Đức',
    createdAt: '05/08/2024',
    shippedAt: '06/08/2024',
    totalSku: 5,
    totalQty: 200,
    status: 'done',
    priority: 'low',
    items: [
      {
        id: 'd14e14a7-f2f3-453c-9a9f-61fd08e6fd3c',
        productId: 'f0000001-0001-0001-0001-000000000007',
        batchId: 'ba000001-0001-0001-0001-000000000003',
        requestedQuantity: 5,
        shippedQuantity: 5,
        receivedQuantity: 5,
        damagedQuantity: 0,
        notes: null
      }
    ]
  },
]

export default function DispatchGoodsPage() {
  const router = useRouter()

  const [statusFilter, setStatusFilter] = useState<'all' | StatusType>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dispatchOrders, setDispatchOrders] = useState<DispatchOrder[]>(DISPATCH_ORDERS)
  const [selectedOrder, setSelectedOrder] = useState<DispatchOrder | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notesText, setNotesText] = useState<string>('')
  const [locationNameMap, setLocationNameMap] = useState<Record<string, string>>(STATIC_LOCATION_NAMES)

  const normalizeId = (v?: string | null) => String(v ?? '').trim().toLowerCase()

  const getLocationLabel = (id?: string | null) => {
    const raw = String(id ?? '').trim()
    if (!raw) return '-'
    const key = normalizeId(raw)
    return locationNameMap[key] || STATIC_LOCATION_NAMES[key] || raw
  }

  const fetchDispatchOrders = async () => {
    setIsFetching(true)
    try {
      const transfers = await TransferAPIService.getTransfers()
      setDispatchOrders((transfers ?? []).map(mapTransferToDispatchOrder))
    } catch {
      setDispatchOrders(DISPATCH_ORDERS)
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchDispatchOrders()
  }, [])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const res = await localApiClient.get('/warehouses?status=ACTIVE&is_deleted=0')
        const payload = res.data
        const list =
          Array.isArray(payload?.data) ? payload.data :
          Array.isArray(payload) ? payload :
          []

        const dynamicMap: Record<string, string> = {}
        for (const location of list) {
          const id = normalizeId((location as any)?.id)
          const name = String((location as any)?.name ?? '').trim()
          if (id && name) dynamicMap[id] = name
        }

        if (!cancelled) {
          setLocationNameMap({
            ...STATIC_LOCATION_NAMES,
            ...dynamicMap,
          })
        }
      } catch {
        if (!cancelled) setLocationNameMap(STATIC_LOCATION_NAMES)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const handleViewDetails = (order: DispatchOrder) => {
    setSelectedOrder(order)
    setShowDetailModal(true)
    setError(null)
    
    // Initialize receive items with default values
    const items: ReceiveItem[] = order.items.map((item) => ({
      transferItemId: item.id,
      shippedQuantity: item.shippedQuantity || item.requestedQuantity || 0,
      damagedQuantity: 0,
      notes: ''
    }))
    setReceiveItems(items)
  }

  const handleCloseModal = () => {
    setShowDetailModal(false)
    setSelectedOrder(null)
    setReceiveItems([])
    setNotesText('')
    setError(null)
  }

  const handleReceiveItemChange = (index: number, field: keyof ReceiveItem, value: any) => {
    const newItems = [...receiveItems]
    newItems[index][field] = value
    setReceiveItems(newItems)
  }

  const handleConfirmReceipt = async () => {
    if (!selectedOrder) return

    setIsLoading(true)
    setError(null)

    try {
      const receiveData: ReceiveTransferDTO = {
        items: receiveItems,
        notes: notesText
      }

      await TransferAPIService.receiveTransfer(selectedOrder.id, receiveData)

      // Update the order status in local state to 'done'
      setDispatchOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === selectedOrder.id
            ? { ...order, status: 'done' as StatusType }
            : order
        )
      )

      // Close modal and reset
      handleCloseModal()
      alert('Xác nhận nhận hàng thành công!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi xác nhận nhận hàng'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickConfirmReceipt = async (order: DispatchOrder) => {
    if (!(order.status === 'shipped' || order.status === 'intransit')) return

    setIsLoading(true)
    setError(null)
    try {
      const receiveData: ReceiveTransferDTO = {
        items: (order.items ?? []).map(item => ({
          transferItemId: item.id,
          shippedQuantity: Number(item.shippedQuantity ?? item.requestedQuantity ?? 0),
          damagedQuantity: Number(item.damagedQuantity ?? 0),
          notes: item.notes ?? '',
        })),
        notes: '',
      }

      await TransferAPIService.receiveTransfer(order.id, receiveData)
      await fetchDispatchOrders()
      alert('Xác nhận nhận hàng thành công!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi xác nhận nhận hàng'
      setError(errorMessage)
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredOrders = dispatchOrders.filter(order => {
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
      case 'intransit':
        return (
          <span className="px-3 py-1 text-xs rounded-full bg-sky-100 text-sky-700 font-medium flex items-center gap-1 w-fit">
            <Truck size={14} />
            Đang vận chuyển
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
          onClick={() => router.push('/warehouse-store/dispatch-goods/create')}
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

          <button
            className="h-10 px-4 border rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            onClick={fetchDispatchOrders}
            disabled={isFetching}
          >
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
              statusFilter === 'intransit'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => setStatusFilter('intransit')}
          >
            Đang vận chuyển
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
                key={order.id}
                className="border-t hover:bg-slate-50 transition-colors"
              >
                <td className="p-4 font-semibold text-emerald-600">
                  {order.code}
                </td>

                <td className="p-4">{getLocationLabel(order.source)}</td>

                <td className="p-4">{getLocationLabel(order.destination)}</td>

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
                  {(order.status === 'shipped' || order.status === 'intransit') && (
                    <button
                      className="mr-2 px-2.5 py-1 text-xs rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-60"
                      onClick={() => handleQuickConfirmReceipt(order)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader size={12} className="animate-spin" />
                          Đang nhận...
                        </span>
                      ) : 'Xác nhận nhận'}
                    </button>
                  )}
                  <button
                    className="text-slate-500 hover:text-emerald-600 transition-colors"
                    onClick={() => handleViewDetails(order)}
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

      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Chi tiết phiếu xuất</h2>
                <p className="text-sm text-slate-500">{selectedOrder.code}</p>
              </div>
              <button
                type="button"
                className="p-2 rounded-md hover:bg-slate-100 text-slate-500"
                onClick={handleCloseModal}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-slate-500">Kho nguồn</p>
                  <p className="font-medium text-slate-800">{getLocationLabel(selectedOrder.source)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-slate-500">Cửa hàng đích</p>
                  <p className="font-medium text-slate-800">{getLocationLabel(selectedOrder.destination)}</p>
                </div>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-3 text-left font-medium">Transfer Item</th>
                      <th className="p-3 text-left font-medium">SL giao</th>
                      <th className="p-3 text-left font-medium">SL hỏng</th>
                      <th className="p-3 text-left font-medium">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiveItems.map((item, index) => (
                      <tr key={item.transferItemId} className="border-t">
                        <td className="p-3 text-slate-700">{item.transferItemId.slice(0, 8)}...</td>
                        <td className="p-3">
                          <input
                            type="number"
                            min={0}
                            value={item.shippedQuantity}
                            onChange={(e) => handleReceiveItemChange(index, 'shippedQuantity', Number(e.target.value || 0))}
                            className="h-9 w-24 border rounded-md px-2"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min={0}
                            value={item.damagedQuantity}
                            onChange={(e) => handleReceiveItemChange(index, 'damagedQuantity', Number(e.target.value || 0))}
                            className="h-9 w-24 border rounded-md px-2"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            value={item.notes}
                            onChange={(e) => handleReceiveItemChange(index, 'notes', e.target.value)}
                            className="h-9 w-full border rounded-md px-2"
                            placeholder="Ghi chú..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Ghi chú chung</label>
                <textarea
                  className="mt-1 w-full min-h-[90px] border rounded-lg p-3 text-sm"
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Nhập ghi chú nhận hàng..."
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                onClick={handleCloseModal}
              >
                Đóng
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-60"
                onClick={handleConfirmReceipt}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader size={14} className="animate-spin" />
                    Đang xử lý...
                  </span>
                ) : 'Xác nhận nhận hàng'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
