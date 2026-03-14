'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Clock3, Search, TriangleAlert, QrCode } from 'lucide-react'

type OrderState = 'waiting' | 'partial' | 'urgent'
type FilterKey = 'all' | 'waiting' | 'partial' | 'urgent'

interface ReceiveHistory {
  id: string
  detail: string
  meta: string
}

interface ReceiveOrder {
  id: string
  supplier: string
  date: string
  totalItems: number
  productName: string
  sku: string
  expectedQty: number
  state: OrderState
  history: ReceiveHistory[]
}

const RECEIVE_ORDERS: ReceiveOrder[] = [
  {
    id: 'PO-88291-TX',
    supplier: 'Global Tech Supplies Inc.',
    date: '24 thg 10, 2023',
    totalItems: 12,
    productName: 'High-Performance Thermal Sensor v4.2',
    sku: 'R-XXXXX',
    expectedQty: 250,
    state: 'partial',
    history: [
      {
        id: 'h-1',
        detail: '150 đơn vị đã được nhận bởi Alex Johnson',
        meta: '24 thg 10, 2023 | 06:45 AM · Lô B-45920',
      },
    ],
  },
  {
    id: 'PO-88302-NY',
    supplier: 'Harbor Logistics Corp',
    date: '25 thg 10, 2023',
    totalItems: 45,
    productName: 'Industrial RFID Access Scanner A3',
    sku: 'R-NY302',
    expectedQty: 320,
    state: 'waiting',
    history: [],
  },
  {
    id: 'PO-88315-SF',
    supplier: 'Precision Parts Ltd.',
    date: '25 thg 10, 2023',
    totalItems: 8,
    productName: 'Modular Relay Connector Set M8',
    sku: 'R-SF315',
    expectedQty: 64,
    state: 'urgent',
    history: [],
  },
  {
    id: 'PO-88320-TX',
    supplier: 'Southern Distributions',
    date: '26 thg 10, 2023',
    totalItems: 24,
    productName: 'Heavy Duty Sensor Casing - Gray',
    sku: 'R-TX320',
    expectedQty: 140,
    state: 'waiting',
    history: [],
  },
]

const FILTER_OPTIONS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Tất cả PO' },
  { key: 'waiting', label: 'Đang chờ' },
  { key: 'partial', label: 'Một phần' },
  { key: 'urgent', label: 'Khẩn cấp' },
]

const STATE_BADGE: Record<OrderState, string> = {
  waiting: 'bg-slate-100 text-slate-600',
  partial: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-600',
}

const STATE_LABEL: Record<OrderState, string> = {
  waiting: 'ĐANG CHỜ',
  partial: 'MỘT PHẦN',
  urgent: 'KHẨN CẤP',
}

const getNowLabel = () => {
  const now = new Date()
  const date = now.toLocaleDateString('vi-VN')
  const time = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  return `${date} | ${time}`
}

export default function ReceiveGoodsPage() {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [selectedOrderId, setSelectedOrderId] = useState(RECEIVE_ORDERS[0].id)
  const [receivedQty, setReceivedQty] = useState('0')
  const [expiredDate, setExpiredDate] = useState('')
  const [location, setLocation] = useState('')
  const [conditionNote, setConditionNote] = useState('')
  const [historyMap, setHistoryMap] = useState<Record<string, ReceiveHistory[]>>(() =>
    RECEIVE_ORDERS.reduce<Record<string, ReceiveHistory[]>>((acc, item) => {
      acc[item.id] = item.history
      return acc
    }, {})
  )

  const filteredOrders = useMemo(() => {
    return RECEIVE_ORDERS.filter((order) => {
      const filterMatched = activeFilter === 'all' || order.state === activeFilter
      const text = `${order.id} ${order.supplier} ${order.productName}`.toLowerCase()
      const searchMatched = text.includes(search.trim().toLowerCase())
      return filterMatched && searchMatched
    })
  }, [activeFilter, search])

  const selectedOrder = useMemo(
    () => RECEIVE_ORDERS.find((order) => order.id === selectedOrderId) ?? RECEIVE_ORDERS[0],
    [selectedOrderId]
  )

  useEffect(() => {
    setReceivedQty(String(selectedOrder.expectedQty))
    setExpiredDate('')
    setLocation('')
    setConditionNote('')
  }, [selectedOrder.id, selectedOrder.expectedQty])

  useEffect(() => {
    if (!filteredOrders.some((item) => item.id === selectedOrderId) && filteredOrders.length > 0) {
      setSelectedOrderId(filteredOrders[0].id)
    }
  }, [filteredOrders, selectedOrderId])

  const handleConfirmReceive = () => {
    const amount = Number(receivedQty) || 0
    const newLog: ReceiveHistory = {
      id: `h-${Date.now()}`,
      detail: `${amount} đơn vị đã được nhận bởi Alex Johnson`,
      meta: `${getNowLabel()} · Lô ${selectedOrder.sku}`,
    }

    setHistoryMap((prev) => ({
      ...prev,
      [selectedOrder.id]: [newLog, ...(prev[selectedOrder.id] || [])],
    }))

    alert(`Đã xác nhận nhập ${amount} đơn vị cho ${selectedOrder.id}.`)
  }

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid min-h-[760px] grid-cols-1 xl:grid-cols-[400px_1fr]">
        <aside className="border-b border-slate-200 xl:border-b-0 xl:border-r">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[28px] font-bold leading-tight text-slate-800">Quản lý nhập hàng</h1>
                <p className="mt-1 text-sm text-slate-500">Xử lý PO theo tình trạng giao thực tế</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                Phiên hoạt động
              </span>
            </div>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                type="text"
                placeholder="Tìm ID đơn hàng hoặc nhà cung cấp..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((filter) => {
                const isActive = activeFilter === filter.key
                return (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="h-[560px] overflow-y-auto">
            {filteredOrders.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-slate-500">
                Không có đơn phù hợp với bộ lọc hiện tại.
              </div>
            )}

            {filteredOrders.map((order) => {
              const isSelected = order.id === selectedOrder.id
              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`block w-full border-b border-slate-100 px-5 py-4 text-left transition-colors ${
                    isSelected ? 'border-l-4 border-l-emerald-500 bg-emerald-50/60 pl-4' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-base font-bold text-slate-800">{order.id}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{order.supplier}</p>
                    </div>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${STATE_BADGE[order.state]}`}>
                      {STATE_LABEL[order.state]}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {order.date}
                    </span>
                    <span>{order.totalItems} mặt hàng</span>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="bg-slate-50/90">
          <div className="mx-auto max-w-4xl px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-[36px] font-bold leading-none tracking-tight text-slate-800">Nhận hàng</h2>
                <p className="mt-2 text-sm text-slate-500">Cập nhật kho cho đơn {selectedOrder.id}</p>
              </div>
              <button className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                <QrCode className="h-4 w-4" />
                Quét mã
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Tên sản phẩm</label>
              <input
                value={selectedOrder.productName}
                readOnly
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
              />

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">SL thực nhận</label>
                  <input
                    value={receivedQty}
                    onChange={(event) => setReceivedQty(event.target.value)}
                    type="number"
                    min={0}
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
                  />
                  <p className="mt-2 text-xs text-slate-400">Dự kiến: {selectedOrder.expectedQty} đơn vị</p>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Số lô</label>
                  <input
                    value={selectedOrder.sku}
                    readOnly
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Ngày hết hạn</label>
                  <div className="relative mt-2">
                    <input
                      value={expiredDate}
                      onChange={(event) => setExpiredDate(event.target.value)}
                      type="date"
                      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none"
                    />
                    <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Vị trí kho</label>
                  <select
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="">Chọn vị trí...</option>
                    <option value="Khu A - Kệ lạnh">Khu A - Kệ lạnh</option>
                    <option value="Khu B - Kệ khô">Khu B - Kệ khô</option>
                    <option value="Khu C - Khu nhanh">Khu C - Khu nhanh</option>
                    <option value="Khu D - Cách ly">Khu D - Cách ly</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Ghi chú tình trạng</label>
                <textarea
                  value={conditionNote}
                  onChange={(event) => setConditionNote(event.target.value)}
                  rows={4}
                  placeholder="VD: Bao bì bị móp nhẹ 2 đơn vị, hàng còn niêm phong..."
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex items-center gap-4">
                <button
                  onClick={handleConfirmReceive}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Xác nhận nhập
                </button>
                <button
                  onClick={() => {
                    setReceivedQty(String(selectedOrder.expectedQty))
                    setExpiredDate('')
                    setLocation('')
                    setConditionNote('')
                  }}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                >
                  Hủy
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Lịch sử nhập cho đơn hàng này</h3>
              </div>

              <div className="mt-4 space-y-3">
                {(historyMap[selectedOrder.id] || []).length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                    Chưa có lịch sử nhận hàng cho đơn này.
                  </div>
                )}

                {(historyMap[selectedOrder.id] || []).map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{entry.detail}</p>
                        <p className="mt-1 text-xs text-slate-500">{entry.meta}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <TriangleAlert className="h-4 w-4" />
              Hãy kiểm tra hạn dùng, tình trạng niêm phong và số lô trước khi xác nhận để tránh lệch tồn kho.
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
