'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, useMemo } from 'react'
import {
  ArrowRightLeft,
  AlertTriangle,
  ClipboardList,
  Plus,
  SquareArrowOutUpRight,
  Truck,
  Warehouse,
  Zap,
} from 'lucide-react'
import { TransferAPIService, TransferFromAPI } from '@/services/transfer-api.service'
import { useAuthStore } from '@/store/auth.store'

interface InboundRow {
  id: string
  source: string
  dest: string
  created: string
  received: string
  sku: number
  qty: number
  status: string
  statusClass: string
}

interface OutboundRow {
  id: string
  source: string
  dest: string
  created: string
  sent: string
  sku: number
  qty: number
  priority: string
  priorityClass: string
  status: string
  statusClass: string
}

function normalizeId(value?: string | null): string {
  return String(value ?? '').trim().toLowerCase()
}

export default function StoreWarehouseDashboard() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [inboundRows, setInboundRows] = useState<InboundRow[]>([])
  const [outboundRows, setOutboundRows] = useState<OutboundRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const workplaceId = useMemo(() => {
    return user?.workplaceId || (user as any)?.workplace_id || (user as any)?.workplace?.id || user?.storeId || ''
  }, [user])

  const workplaceKey = normalizeId(workplaceId)

  // Fetch transfer data from API
  const fetchTransfers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (!workplaceKey) {
        setInboundRows([])
        setOutboundRows([])
        setIsLoading(false)
        return
      }

      const transfers = await TransferAPIService.getTransfers()
      const transfersList = Array.isArray(transfers) ? transfers : []
      
      // Separate inbound and outbound transfers based on workplace location
      const inbound: InboundRow[] = []
      const outbound: OutboundRow[] = []

      transfersList.forEach((transfer: TransferFromAPI) => {
        const fromKey = normalizeId(transfer.fromLocationId)
        const toKey = normalizeId(transfer.toLocationId)
        
        // Inbound: current workplace is destination
        const isInbound = toKey === workplaceKey && transfer.status !== 'COMPLETED' && transfer.status !== 'RECEIVED'
        
        // Outbound: current workplace is source and not yet shipped
        const isOutbound = fromKey === workplaceKey && transfer.status !== 'COMPLETED' && transfer.status !== 'RECEIVED'

        const itemCount = transfer.items?.length ?? 0
        const totalQty = transfer.items?.reduce((sum, item) => {
          const qty = item.shippedQuantity ?? item.receivedQuantity ?? item.requestedQuantity ?? 0
          return sum + qty
        }, 0) ?? 0

        const createdDate = new Date(transfer.transferDate).toLocaleDateString('vi-VN')
        const deliveryDate = transfer.actualDelivery 
          ? new Date(transfer.actualDelivery).toLocaleDateString('vi-VN')
          : transfer.expectedDelivery 
          ? new Date(transfer.expectedDelivery).toLocaleDateString('vi-VN')
          : createdDate

        const statusConfig = getStatusConfig(transfer.status)

        if (isInbound) {
          inbound.push({
            id: transfer.transferNumber || transfer.id,
            source: transfer.fromLocationId,
            dest: transfer.toLocationId,
            created: createdDate,
            received: deliveryDate,
            sku: itemCount,
            qty: totalQty,
            status: transfer.status || 'Chờ xử lý',
            statusClass: statusConfig.class,
          })
        }

        if (isOutbound) {
          outbound.push({
            id: transfer.transferNumber || transfer.id,
            source: transfer.fromLocationId,
            dest: transfer.toLocationId,
            created: createdDate,
            sent: deliveryDate,
            sku: itemCount,
            qty: totalQty,
            priority: 'Trung bình',
            priorityClass: 'bg-blue-100 text-blue-600',
            status: transfer.status || 'Chờ xử lý',
            statusClass: statusConfig.class,
          })
        }
      })

      setInboundRows(inbound.slice(0, 5)) // Limit to 5 rows
      setOutboundRows(outbound.slice(0, 5))
    } catch (err) {
      console.error('Error fetching transfers:', err)
      setError('Không thể tải dữ liệu transfers')
    } finally {
      setIsLoading(false)
    }
  }, [workplaceKey])

  useEffect(() => {
    void fetchTransfers()
  }, [fetchTransfers])

  function getStatusConfig(status: string): { label: string; class: string } {
    const statusMap: Record<string, { label: string; class: string }> = {
      'PENDING': { label: 'Chờ xử lý', class: 'bg-slate-100 text-slate-600' },
      'SHIPPED': { label: 'Đã gửi', class: 'bg-blue-100 text-blue-600' },
      'IN_TRANSIT': { label: 'Đang vận chuyển', class: 'bg-amber-100 text-amber-700' },
      'DELIVERED': { label: 'Đã giao', class: 'bg-emerald-100 text-emerald-700' },
      'RECEIVED': { label: 'Hoàn tất', class: 'bg-emerald-100 text-emerald-700' },
      'COMPLETED': { label: 'Hoàn tát', class: 'bg-emerald-100 text-emerald-700' },
      'CANCELLED': { label: 'Đã hủy', class: 'bg-red-100 text-red-600' },
    }
    return statusMap[status] || { label: status, class: 'bg-slate-100 text-slate-600' }
  }

  const summaryCards = [
    {
      title: 'Yêu cầu châm hàng',
      value: isLoading ? '—' : inboundRows.length.toString(),
      status: inboundRows.length > 0 ? '+5 mới' : 'Không có',
      icon: <ArrowRightLeft className="h-4 w-4" />,
      iconWrap: 'bg-blue-100 text-blue-600',
      statusWrap: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Hàng đang về',
      value: isLoading ? '—' : inboundRows.length.toString(),
      status: 'Đang vận chuyển',
      icon: <Truck className="h-4 w-4" />,
      iconWrap: 'bg-emerald-100 text-emerald-600',
      statusWrap: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'Chuyển kho',
      value: isLoading ? '—' : outboundRows.length.toString(),
      status: outboundRows.length > 0 ? `${outboundRows.length} đang chờ` : 'Không có',
      icon: <ClipboardList className="h-4 w-4" />,
      iconWrap: 'bg-amber-100 text-amber-600',
      statusWrap: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Cảnh báo tồn thấp',
      value: '8',
      status: 'Khẩn cấp',
      icon: <AlertTriangle className="h-4 w-4" />,
      iconWrap: 'bg-red-100 text-red-600',
      statusWrap: 'bg-red-100 text-red-600',
      cardClass: 'border-red-200',
    },
  ]

  return (
    <div className="min-h-screen space-y-5 p-6" style={{ background: '#f1f5f9', color: '#1e293b' }}>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
          {error}
          <button
            onClick={() => void fetchTransfers()}
            className="ml-3 font-semibold underline hover:no-underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Tổng quan kho</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý lịch trình nhập và xuất kho hàng ngày của bạn.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchTransfers()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ borderColor: '#e2e8f0', background: '#ffffff', color: '#475569' }}
          >
            {isLoading ? '⏳' : '🔄'}
            Làm mới
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: '#10b981' }}
          >
            <Plus className="h-4 w-4" />
            Tạo mới
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.title}
            className={`rounded-xl border px-4 py-3 ${card.cardClass ?? ''}`}
            style={{ background: '#ffffff', borderColor: card.cardClass ? undefined : '#e2e8f0' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">{card.title}</p>
                <p className="mt-0.5 text-3xl font-extrabold tracking-tight text-slate-800">{card.value}</p>
              </div>
              <div className={`rounded-lg p-2 ${card.iconWrap}`}>{card.icon}</div>
            </div>
            <div className="mt-2">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${card.statusWrap}`}>
                {card.status}
              </span>
            </div>
          </article>
        ))}
      </section>

      {/* Inbound Table */}
      <section>
        <article className="overflow-hidden rounded-xl border" style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
          <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: '#e2e8f0' }}>
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
              <span className="rounded-md bg-emerald-100 p-1.5 text-emerald-600">
                <ArrowRightLeft className="h-3.5 w-3.5" />
              </span>
              Hàng nhập hôm nay
            </h2>
            <button
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              onClick={() => router.push('/warehouse-store/receive-goods')}
            >
              Xem tất cả phiếu nhập →
            </button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
                <p className="mt-2 text-sm text-slate-500">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : inboundRows.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-slate-500">Không có phiếu nhập nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    {['Mã phiếu', 'Kho nguồn', 'Kho đích', 'Ngày tạo', 'Ngày nhận', 'Tổng SKU', 'Tổng số lượng', 'Trạng thái'].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-semibold whitespace-nowrap" style={{ color: '#94a3b8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inboundRows.map((row) => (
                    <tr key={row.id} className="border-t hover:bg-slate-50 transition-colors" style={{ borderColor: '#f1f5f9' }}>
                      <td className="px-4 py-2.5 font-semibold text-emerald-600 whitespace-nowrap">{row.id}</td>
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{row.source}</td>
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{row.dest}</td>
                      <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{row.created}</td>
                      <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{row.received}</td>
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{row.sku}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-700 whitespace-nowrap">{row.qty}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${row.statusClass}`}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      {/* Outbound Table */}
      <section>
        <article className="overflow-hidden rounded-xl border" style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
          <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: '#e2e8f0' }}>
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
              <span className="rounded-md bg-emerald-100 p-1.5 text-emerald-600">
                <SquareArrowOutUpRight className="h-3.5 w-3.5" />
              </span>
              Đang chờ xuất
            </h2>
            <button
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              onClick={() => router.push('/warehouse-store/dispatch-goods')}
            >
              Xem tất cả phiếu xuất →
            </button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
                <p className="mt-2 text-sm text-slate-500">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : outboundRows.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-slate-500">Không có phiếu xuất nào đang chờ</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    {['Mã phiếu', 'Kho nguồn', 'Cửa hàng đích', 'Ngày tạo', 'Ngày gửi', 'Tổng SKU', 'Tổng số lượng', 'Ưu tiên', 'Trạng thái'].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-semibold whitespace-nowrap" style={{ color: '#94a3b8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {outboundRows.map((row) => (
                    <tr key={row.id} className="border-t hover:bg-slate-50 transition-colors" style={{ borderColor: '#f1f5f9' }}>
                      <td className="px-4 py-2.5 font-semibold text-emerald-600 whitespace-nowrap">{row.id}</td>
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{row.source}</td>
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{row.dest}</td>
                      <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{row.created}</td>
                      <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{row.sent}</td>
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{row.sku}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-700 whitespace-nowrap">{row.qty}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${row.priorityClass}`}>{row.priority}</span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${row.statusClass}`}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'Tạo yêu cầu châm hàng', icon: <Zap className="h-4 w-4" />, path: '/warehouse-store/restock-request' },
          { label: 'Kiểm tra kho hàng', icon: <Warehouse className="h-4 w-4" />, path: '/warehouse-store/inventory' },
          { label: 'Theo dõi nhập hàng', icon: <Truck className="h-4 w-4" />, path: '/warehouse-store/receive-goods' },
          { label: 'Xuất hàng', icon: <SquareArrowOutUpRight className="h-4 w-4" />, path: '/warehouse-store/dispatch-goods' },
          { label: 'Xử lý hàng lỗi/hết hạn', icon: <AlertTriangle className="h-4 w-4" />, path: '/warehouse-store/damaged-expired' },
        ].map(({ label, icon, path }) => (
          <button
            key={label}
            onClick={() => router.push(path)}
            className="flex items-center gap-2 rounded-xl border px-4 py-3 text-left text-xs font-semibold text-slate-600 transition-all hover:border-emerald-400 hover:text-emerald-600"
            style={{ background: '#ffffff', borderColor: '#e2e8f0' }}
          >
            <span className="text-emerald-600">{icon}</span>
            {label}
          </button>
        ))}
      </section>
    </div>
  )
}