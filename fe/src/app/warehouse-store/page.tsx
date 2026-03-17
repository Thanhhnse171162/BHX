'use client'

import { useRouter } from 'next/navigation'
import {
  ArrowDownToLine,
  ArrowRightLeft,
  AlertTriangle,
  ClipboardList,
  Plus,
  SquareArrowOutUpRight,
  Truck,
  Warehouse,
  Boxes,
  PackageSearch,
  Zap,
} from 'lucide-react'

export default function StoreWarehouseDashboard() {
  const router = useRouter()

  const summaryCards = [
    {
      title: 'Yêu cầu châm hàng',
      value: '128',
      status: '+5 mới',
      icon: <ArrowRightLeft className="h-4 w-4" />,
      iconWrap: 'bg-blue-100 text-blue-600',
      statusWrap: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Hàng đang về',
      value: '45',
      status: 'Đang vận chuyển',
      icon: <Truck className="h-4 w-4" />,
      iconWrap: 'bg-emerald-100 text-emerald-600',
      statusWrap: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'Chuyển kho',
      value: '12',
      status: '3 đang chờ',
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

  const inboundRows = [
    { id: 'GR-2024-001', source: 'Kho NCC Vinamilk', dest: 'Kho Tổng HCM', created: '22/05/2024', received: '24/05/2024', sku: 15, qty: 450, status: 'Hoàn tất', statusClass: 'bg-emerald-100 text-emerald-700' },
    { id: 'GR-2024-002', source: 'Kho NCC CP Foods', dest: 'Kho Lạnh Q7', created: '23/05/2024', received: '24/05/2024', sku: 8, qty: 120, status: 'Chờ xử lý', statusClass: 'bg-slate-100 text-slate-600' },
    { id: 'GR-2024-003', source: 'Kho Trung chuyển', dest: 'Kho Tổng HCM', created: '24/05/2024', received: '25/05/2024', sku: 24, qty: 600, status: 'Chờ xử lý', statusClass: 'bg-slate-100 text-slate-600' },
    { id: 'GR-2024-004', source: 'Kho Masan', dest: 'Kho Tổng HCM', created: '23/05/2024', received: '24/05/2024', sku: 12, qty: 200, status: 'Đã hủy', statusClass: 'bg-red-100 text-red-600' },
    { id: 'GR-2024-005', source: 'Kho Nestle', dest: 'Kho Tổng HCM', created: '24/05/2024', received: '26/05/2024', sku: 10, qty: 180, status: 'Chờ xử lý', statusClass: 'bg-slate-100 text-slate-600' },
  ]

  const outboundRows = [
    { id: 'GD-8821', source: 'Kho Tổng HCM', dest: 'BHX Quận 7', created: '24/05/2024', sent: '24/05/2024', sku: 45, qty: 420, priority: 'Cao', priorityClass: 'bg-amber-100 text-amber-700', status: 'Chờ xử lý', statusClass: 'bg-slate-100 text-slate-600' },
    { id: 'GD-8825', source: 'Kho Tổng HCM', dest: 'BHX Bình Chánh', created: '24/05/2024', sent: '25/05/2024', sku: 18, qty: 150, priority: 'Thấp', priorityClass: 'bg-slate-100 text-slate-500', status: 'Chờ xử lý', statusClass: 'bg-slate-100 text-slate-600' },
    { id: 'GD-8826', source: 'Kho Lạnh Q7', dest: 'BHX Quận 4', created: '24/05/2024', sent: '24/05/2024', sku: 12, qty: 85, priority: 'Trung bình', priorityClass: 'bg-blue-100 text-blue-600', status: 'Chờ xử lý', statusClass: 'bg-slate-100 text-slate-600' },
    { id: 'GD-8827', source: 'Kho Tổng HCM', dest: 'BHX Thủ Đức', created: '24/05/2024', sent: '23/05/2024', sku: 30, qty: 310, priority: 'Cao', priorityClass: 'bg-amber-100 text-amber-700', status: 'Chờ xử lý', statusClass: 'bg-slate-100 text-slate-600' },
    { id: 'GD-8828', source: 'Kho Tổng HCM', dest: 'BHX Tân Bình', created: '24/05/2024', sent: '25/05/2024', sku: 22, qty: 205, priority: 'Thấp', priorityClass: 'bg-slate-100 text-slate-500', status: 'Chờ xử lý', statusClass: 'bg-slate-100 text-slate-600' },
  ]

  return (
    <div className="min-h-screen space-y-5 p-6" style={{ background: '#f1f5f9', color: '#1e293b' }}>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Tổng quan kho</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý lịch trình nhập và xuất kho hàng ngày của bạn.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
            style={{ borderColor: '#e2e8f0', background: '#ffffff', color: '#475569' }}
          >
            <ArrowDownToLine className="h-4 w-4 text-emerald-400" />
            Xuất báo cáo
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