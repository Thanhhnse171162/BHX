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
  Zap
} from 'lucide-react'

export default function StoreWarehouseDashboard() {
  const router = useRouter()

  const summaryCards = [
    {
      title: 'Yêu cầu châm hàng',
      value: '24',
      status: '+4 mới',
      icon: <ArrowRightLeft className="h-5 w-5" />,
      iconWrap: 'bg-blue-100 text-blue-600',
      statusWrap: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Hàng đang về',
      value: '12',
      status: 'Đang vận chuyển',
      icon: <Truck className="h-5 w-5" />,
      iconWrap: 'bg-emerald-100 text-emerald-600',
      statusWrap: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'Chuyển kho',
      value: '15',
      status: '8 đang chờ',
      icon: <ClipboardList className="h-5 w-5" />,
      iconWrap: 'bg-amber-100 text-amber-600',
      statusWrap: 'bg-amber-100 text-amber-700',
    },
    {
      title: 'Cảnh báo tồn thấp',
      value: '07',
      status: 'Khẩn cấp',
      icon: <AlertTriangle className="h-5 w-5" />,
      iconWrap: 'bg-red-100 text-red-600',
      statusWrap: 'bg-red-100 text-red-600',
      cardClass: 'border-red-200',
    },
  ]

  const inboundRows = [
    { po: 'PO-8821', supplier: 'Global Logistics Ltd', eta: '10:30 AM', status: 'Đúng giờ', statusClass: 'bg-emerald-100 text-emerald-700' },
    { po: 'PO-8824', supplier: 'Industrial Supplies Inc', eta: '02:15 PM', status: 'Trễ hẹn', statusClass: 'bg-amber-100 text-amber-700' },
    { po: 'PO-8829', supplier: 'Eco Packaging Co', eta: '04:45 PM', status: 'Đang về', statusClass: 'bg-blue-100 text-blue-700' },
  ]

  const outboundRows = [
    { requestId: 'REQ-0941', store: 'Downtown Outlet', quantity: '124 đơn vị', priority: 'KHẨN CẤP', priorityClass: 'bg-red-100 text-red-700' },
    { requestId: 'REQ-0955', store: 'Northside Hub', quantity: '58 đơn vị', priority: 'THÔNG THƯỜNG', priorityClass: 'bg-slate-200 text-slate-600' },
    { requestId: 'REQ-0958', store: 'West Plaza', quantity: '210 đơn vị', priority: 'CAO', priorityClass: 'bg-emerald-100 text-emerald-700' },
  ]

  const lowStockProducts = [
    { name: 'Dây đồng 50m', sku: 'WR-0021', remain: 12, level: 'NGUY CẤP', levelClass: 'bg-red-100 text-red-600' },
    { name: 'Giá đỡ thép L', sku: 'SB-8832', remain: 45, level: 'CẢNH BÁO', levelClass: 'bg-amber-100 text-amber-700' },
    { name: 'Ống nhựa PVC 32mm', sku: 'PV-4491', remain: 5, level: 'NGUY CẤP', levelClass: 'bg-red-100 text-red-600' },
    { name: 'Bulong M8 (Gói 100)', sku: 'BT-2201', remain: 82, level: 'CẢNH BÁO', levelClass: 'bg-amber-100 text-amber-700' },
    { name: 'Hộp dụng cụ Classic', sku: 'TB-1100', remain: 2, level: 'NGUY CẤP', levelClass: 'bg-red-100 text-red-600' },
  ]

  return (
    <div className="space-y-6 rounded-2xl bg-slate-100 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[38px] leading-tight font-extrabold tracking-tight text-slate-800">Tổng quan kho</h1>
          <p className="mt-1 text-[20px] text-slate-500">Quản lý lịch trình nhập và xuất kho hàng ngày của bạn.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <ArrowDownToLine className="h-4 w-4" />
            Xuất báo cáo
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
            <Plus className="h-4 w-4" />
            Tạo mới
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.title} className={`rounded-2xl border border-slate-200 bg-white px-5 py-4 ${card.cardClass ?? ''}`}>
            <div className="flex items-start justify-between">
              <div className={`inline-flex rounded-lg px-2 py-1 text-xs font-bold ${card.statusWrap}`}>{card.status}</div>
              <div className={`rounded-lg p-2 ${card.iconWrap}`}>{card.icon}</div>
            </div>
            <p className="mt-5 text-[17px] text-slate-500">{card.title}</p>
            <p className="mt-1 text-[44px] leading-none font-extrabold tracking-tight text-slate-800">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.9fr_1fr]">
        <div className="space-y-4">
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 text-[24px] font-bold text-slate-800">
                <span className="rounded-md bg-emerald-100 p-1.5 text-emerald-600">
                  <Truck className="h-4 w-4" />
                </span>
                Hàng nhập hôm nay
              </h2>
              <button
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                onClick={() => router.push('/warehouse-store/receive-goods')}
              >
                Xem tất cả
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Mã PO</th>
                    <th className="px-5 py-3 font-semibold">Nhà cung cấp</th>
                    <th className="px-5 py-3 font-semibold">Dự kiến (ETA)</th>
                    <th className="px-5 py-3 font-semibold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {inboundRows.map((row) => (
                    <tr key={row.po} className="border-t border-slate-100">
                      <td className="px-5 py-3 font-medium text-slate-700">{row.po}</td>
                      <td className="px-5 py-3 text-slate-600">{row.supplier}</td>
                      <td className="px-5 py-3 text-slate-600">{row.eta}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${row.statusClass}`}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 text-[24px] font-bold text-slate-800">
                <span className="rounded-md bg-emerald-100 p-1.5 text-emerald-600">
                  <ArrowRightLeft className="h-4 w-4" />
                </span>
                Đang chờ xuất
              </h2>
              <button
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                onClick={() => router.push('/warehouse-store/transfer-to-shelf')}
              >
                Quản lý xuất kho
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Mã yêu cầu</th>
                    <th className="px-5 py-3 font-semibold">Cửa hàng</th>
                    <th className="px-5 py-3 font-semibold">Số lượng</th>
                    <th className="px-5 py-3 font-semibold">Ưu tiên</th>
                  </tr>
                </thead>
                <tbody>
                  {outboundRows.map((row) => (
                    <tr key={row.requestId} className="border-t border-slate-100">
                      <td className="px-5 py-3 font-medium text-slate-700">{row.requestId}</td>
                      <td className="px-5 py-3 text-slate-600">{row.store}</td>
                      <td className="px-5 py-3 text-slate-600">{row.quantity}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${row.priorityClass}`}>{row.priority}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>

        <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="text-[24px] font-bold text-slate-800">Sản phẩm sắp hết hàng</h2>
          </div>
          <div className="flex-1 space-y-4 p-4">
            {lowStockProducts.map((product) => (
              <div key={product.sku} className="flex items-start gap-3 rounded-xl px-2 py-1 hover:bg-slate-50">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                  <PackageSearch className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold text-slate-800">{product.name}</p>
                  <p className="text-xs text-slate-400">SKU: {product.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-red-500">Còn {product.remain}</p>
                  <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-extrabold ${product.levelClass}`}>{product.level}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 pt-0">
            <button
              onClick={() => router.push('/warehouse-store/low-stock')}
              className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              Bắt đầu nhập tất cả
            </button>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          onClick={() => router.push('/warehouse-store/restock-request')}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-600"
        >
          <Zap className="h-4 w-4" />
          Tạo yêu cầu châm hàng
        </button>
        <button
          onClick={() => router.push('/warehouse-store/inventory')}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-600"
        >
          <Warehouse className="h-4 w-4" />
          Kiểm tra kho hàng
        </button>
        <button
          onClick={() => router.push('/warehouse-store/receive-goods')}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-600"
        >
          <Truck className="h-4 w-4" />
          Theo dõi nhập hàng
        </button>
        <button
          onClick={() => router.push('/warehouse-store/damaged-expired')}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-600"
        >
          <SquareArrowOutUpRight className="h-4 w-4" />
          Xử lý hàng lỗi/hết hạn
        </button>
      </section>
    </div>
  )
}
