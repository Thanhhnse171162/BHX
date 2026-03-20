'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Eye, CheckCircle2, Clock3, Truck, AlertCircle, RefreshCw, X } from 'lucide-react'
import { TransferAPIService, type TransferFromAPI } from '@/services/transfer-api.service'
import { WarehouseLookupAPIService } from '@/services/warehouse-lookup-api.service'
import { ProductAPIService } from '@/services/product-api.service'
import { useAuthStore } from '@/store/auth.store'

type StatusType = 'done' | 'pending' | 'shipped' | 'cancelled'

interface DispatchOrder {
  id: string
  code: string
  destination: string
  source: string
  createdAt: string
  shippedAt: string
  totalSku: number
  totalQty: number
  status: StatusType
  priority: 'high' | 'medium' | 'low'
  rawStatus: string
  toLocationId: string
  items: TransferFromAPI['items']
  notes?: string | null
}

interface ReceiveItemForm {
  transferItemId: string
  productId: string
  productName: string
  shippedQuantity: number
  damagedQuantity: number
  notes: string
}

function normalizeId(value?: string | null): string {
  return String(value ?? '').trim().toLowerCase()
}

function formatDate(value?: string | null): string {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString('vi-VN')
}

function mapTransferStatus(status?: string): StatusType {
  const s = String(status ?? '').trim().toUpperCase()
  if (s === 'COMPLETED') return 'done'
  if (s === 'CANCELLED' || s === 'REJECTED') return 'cancelled'
  if (s === 'SHIPPED' || s === 'IN_TRANSIT' || s === 'DELIVERED') return 'shipped'
  return 'pending'
}

export default function DispatchGoodsPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()

  const [statusFilter, setStatusFilter] = useState<'all' | StatusType>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [orders, setOrders] = useState<DispatchOrder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [receivingId, setReceivingId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<DispatchOrder | null>(null)
  const [receiveItems, setReceiveItems] = useState<ReceiveItemForm[]>([])
  const [receiveNotes, setReceiveNotes] = useState('')
  const [nameMap, setNameMap] = useState<Record<string, string>>({})
  const [productNameMap, setProductNameMap] = useState<Record<string, string>>({})

  const workplaceId = useMemo(
    () =>
      user?.workplaceId ||
      (user as any)?.workplace_id ||
      (user as any)?.workplace?.id ||
      user?.warehouseId ||
      user?.storeId ||
      '',
    [user],
  )

  const workplaceKey = normalizeId(workplaceId)

  const loadOrders = async () => {
    if (!token || !workplaceKey) {
      setOrders([])
      return
    }
    setIsLoading(true)
    try {
      const list = await TransferAPIService.getTransfers()
      const transfers = Array.isArray(list) ? list : []
      const related = transfers.filter((t) => {
        const fromKey = normalizeId(t.fromLocationId)
        const toKey = normalizeId(t.toLocationId)
        return fromKey === workplaceKey || toKey === workplaceKey
      })

      const mapped: DispatchOrder[] = related.map((t: TransferFromAPI) => {
        const items = Array.isArray(t.items) ? t.items : []
        const totalQty = items.reduce((sum, it) => {
          const shipped = Number(it.shippedQuantity ?? 0)
          const requested = Number(it.requestedQuantity ?? 0)
          return sum + (shipped > 0 ? shipped : requested)
        }, 0)

        return {
          id: t.id,
          code: t.transferNumber || t.id,
          destination: t.toLocationId || '-',
          source: t.fromLocationId || '-',
          createdAt: formatDate(t.transferDate),
          shippedAt: formatDate(t.expectedDelivery),
          totalSku: items.length,
          totalQty,
          status: mapTransferStatus(t.status),
          priority: 'medium',
          rawStatus: String(t.status || '').toUpperCase(),
          toLocationId: t.toLocationId || '',
          items,
          notes: t.notes,
        }
      })

      setOrders(mapped)

      const uniqueIds = Array.from(new Set(
        mapped.flatMap((o) => [o.source, o.destination]).map((x) => normalizeId(x)).filter(Boolean),
      ))

      const unresolved = uniqueIds.filter((id) => !nameMap[id])
      if (unresolved.length > 0) {
        const resolved = await Promise.all(
          unresolved.map(async (id) => {
            try {
              const data = await WarehouseLookupAPIService.getById(id)
              return [id, data?.name || id] as const
            } catch {
              return [id, id] as const
            }
          }),
        )
        setNameMap((prev) => {
          const next = { ...prev }
          for (const [id, label] of resolved) next[id] = label
          return next
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, workplaceKey])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await ProductAPIService.getAllProducts()
        const nextMap: Record<string, string> = {}
        for (const p of rows ?? []) {
          const id = normalizeId((p as any)?.id)
          const name = String((p as any)?.name ?? '').trim()
          if (id && name) nextMap[id] = name
        }
        if (!cancelled) setProductNameMap(nextMap)
      } catch {
        if (!cancelled) setProductNameMap({})
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' ? true : order.status === statusFilter
    const matchesSearch = order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.source.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const canInspectIncoming = (order: DispatchOrder) => {
    const toCurrentWorkplace = normalizeId(order.toLocationId) === workplaceKey
    const statusAllowed = order.rawStatus === 'PENDING' || order.rawStatus === 'DELIVERED' || order.rawStatus === 'IN_TRANSIT' || order.rawStatus === 'SHIPPED'
    return toCurrentWorkplace && statusAllowed
  }

  const getLocationName = (idOrName: string) => {
    const key = normalizeId(idOrName)
    return nameMap[key] || idOrName
  }

  const openReceiveModal = (order: DispatchOrder) => {
    const items = Array.isArray(order.items) ? order.items : []
    const mapped = items.map((item) => {
      const shipped = Number(item.shippedQuantity ?? 0)
      const requested = Number(item.requestedQuantity ?? 0)
      const receiveQty = shipped > 0 ? shipped : requested
      const pid = String(item.productId ?? '')
      const pname = productNameMap[normalizeId(pid)] || pid
      return {
        transferItemId: item.id,
        productId: pid,
        productName: pname,
        shippedQuantity: Math.max(0, receiveQty),
        damagedQuantity: Number(item.damagedQuantity ?? 0),
        notes: String(item.notes ?? ''),
      }
    })

    setSelectedOrder(order)
    setReceiveItems(mapped)
    setReceiveNotes(String(order.notes ?? ''))
  }

  const closeReceiveModal = () => {
    setSelectedOrder(null)
    setReceiveItems([])
    setReceiveNotes('')
  }

  const updateReceiveItem = <K extends keyof ReceiveItemForm>(
    transferItemId: string,
    key: K,
    value: ReceiveItemForm[K],
  ) => {
    setReceiveItems((prev) => prev.map((it) => (it.transferItemId === transferItemId ? { ...it, [key]: value } : it)))
  }

  const handleReceiveOrder = async () => {
    if (!selectedOrder) return
    if (!canInspectIncoming(selectedOrder)) {
      alert('Phiếu này chưa đến bước kho nhận xác nhận.')
      return
    }
    if (receiveItems.length === 0) {
      alert('Phiếu chưa có sản phẩm để xác nhận nhận.')
      return
    }

    const ok = confirm(`Xác nhận nhận hàng cho phiếu ${selectedOrder.code}?`)
    if (!ok) return

    try {
      setReceivingId(selectedOrder.id)
      await TransferAPIService.receiveTransfer(selectedOrder.id, {
        items: receiveItems.map((item) => ({
          transferItemId: item.transferItemId,
          shippedQuantity: Math.max(0, Number(item.shippedQuantity) || 0),
          damagedQuantity: Math.max(0, Number(item.damagedQuantity) || 0),
          notes: item.notes,
        })),
        notes: receiveNotes,
      })
      alert('Xác nhận nhận hàng thành công.')
      closeReceiveModal()
      await loadOrders()
    } catch (err) {
      const msg = (err as any)?.response?.data?.message || (err as any)?.message || 'Xác nhận nhận hàng thất bại.'
      alert(msg)
    } finally {
      setReceivingId(null)
    }
  }

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

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Chi tiết payload nhận hàng</p>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedOrder.code}</h3>
              </div>
              <button
                onClick={closeReceiveModal}
                className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                <X size={16} className="mx-auto" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Kho nguồn</p>
                  <p className="font-medium text-slate-800 mt-1">{getLocationName(selectedOrder.source)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Kho/Cửa hàng đích</p>
                  <p className="font-medium text-slate-800 mt-1">{getLocationName(selectedOrder.destination)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left text-xs font-semibold text-slate-600 uppercase">Sản phẩm</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-600 uppercase">shippedQuantity</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-600 uppercase">damagedQuantity</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-600 uppercase">notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiveItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500">Không có item</td>
                      </tr>
                    ) : (
                      receiveItems.map((item) => (
                        <tr key={item.transferItemId} className="border-t border-slate-100">
                          <td className="p-3 text-xs text-slate-700">
                            <p className="font-semibold">{item.productName || item.productId}</p>
                            <p className="font-mono text-[11px] text-slate-500">{item.productId}</p>
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min={0}
                              value={item.shippedQuantity}
                              onChange={(e) => updateReceiveItem(item.transferItemId, 'shippedQuantity', Math.max(0, Number(e.target.value) || 0))}
                              className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min={0}
                              value={item.damagedQuantity}
                              onChange={(e) => updateReceiveItem(item.transferItemId, 'damagedQuantity', Math.max(0, Number(e.target.value) || 0))}
                              className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              value={item.notes}
                              onChange={(e) => updateReceiveItem(item.transferItemId, 'notes', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                              placeholder="Ghi chú item"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">notes</p>
                <textarea
                  rows={3}
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Ghi chú tổng"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={closeReceiveModal}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-white"
              >
                Đóng
              </button>
              <button
                onClick={handleReceiveOrder}
                disabled={receivingId === selectedOrder.id || !canInspectIncoming(selectedOrder)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {receivingId === selectedOrder.id && <RefreshCw size={14} className="animate-spin" />}
                Xác nhận nhận hàng
              </button>
            </div>
          </div>
        </div>
      )}

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
            className="h-10 px-4 border rounded-lg text-sm text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1.5"
            onClick={loadOrders}
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
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

                <td className="p-4">{getLocationName(order.source)}</td>

                <td className="p-4">{getLocationName(order.destination)}</td>

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
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
                      canInspectIncoming(order)
                        ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                    onClick={() => openReceiveModal(order)}
                    title={canInspectIncoming(order) ? 'Xem chi tiết nhận hàng' : 'Xem chi tiết'}
                  >
                    <Eye size={18} />
                  </button>
                </td>

              </tr>

            ))}

            {!isLoading && filteredOrders.length === 0 && (
              <tr>
                <td className="p-6 text-center text-slate-500" colSpan={10}>
                  Hiển thị 0 phiếu
                </td>
              </tr>
            )}

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
