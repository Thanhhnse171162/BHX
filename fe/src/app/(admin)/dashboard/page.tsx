'use client'

import { useState } from 'react'

const stores = [
  { rank: 1, name: 'BHX Phan Văn Trị', loc: 'Quận Gò Vấp, HCM', rev: '1.26B' },
  { rank: 2, name: 'BHX Lê Trọng Tấn', loc: 'Quận Bình Tân, HCM', rev: '980M' },
  { rank: 3, name: 'BHX Nguyễn Ánh Thủ', loc: 'Quận 12, HCM', rev: '850M' },
  { rank: 4, name: 'BHX Trần Não', loc: 'Quận 2, HCM', rev: '740M' },
  { rank: 5, name: 'BHX Nguyễn Văn Linh', loc: 'Quận 7, HCM', rev: '690M' },
  { rank: 6, name: 'BHX Lê Văn Việt', loc: 'Quận 9, HCM', rev: '640M' },
]

const products = [
  {
    icon: '🥦', name: 'Rau củ hỗn hợp Đà Lạt', cat: 'Thực phẩm tươi sống', rev: '840.5M', qty: '12,450 kg',
    detail: {
      growth: '+5.2%',
      stores: [
        { s: 'BHX Phan Văn Trị', q: '2,400 kg', r: '162M', ok: true },
        { s: 'BHX Lê Trọng Tấn', q: '2,100 kg', r: '142M', ok: true },
        { s: 'BHX Nguyễn Ánh Thủ', q: '1,950 kg', r: '132M', ok: true },
        { s: 'BHX Trần Não', q: '1,800 kg', r: '121M', ok: false },
        { s: 'BHX Nguyễn Văn Linh', q: '2,200 kg', r: '149M', ok: true },
      ],
    },
  },
  {
    icon: '🥩', name: 'Thịt heo VietGAP', cat: 'Thực phẩm tươi sống', rev: '620.2M', qty: '4,200 kg',
    detail: {
      growth: '+3.8%',
      stores: [
        { s: 'BHX Phan Văn Trị', q: '900 kg', r: '133M', ok: true },
        { s: 'BHX Lê Trọng Tấn', q: '850 kg', r: '125M', ok: true },
        { s: 'BHX Nguyễn Ánh Thủ', q: '780 kg', r: '115M', ok: false },
        { s: 'BHX Trần Não', q: '720 kg', r: '106M', ok: true },
        { s: 'BHX Nguyễn Văn Linh', q: '950 kg', r: '140M', ok: true },
      ],
    },
  },
  {
    icon: '🥛', name: 'Sữa tươi Vinamilk 1L', cat: 'Hàng tiêu dùng', rev: '450.8M', qty: '15,600 hộp',
    detail: {
      growth: '+9.1%',
      stores: [
        { s: 'BHX Phan Văn Trị', q: '3,200 hộp', r: '92M', ok: true },
        { s: 'BHX Lê Trọng Tấn', q: '2,900 hộp', r: '83M', ok: true },
        { s: 'BHX Nguyễn Ánh Thủ', q: '2,800 hộp', r: '81M', ok: true },
        { s: 'BHX Trần Não', q: '3,100 hộp', r: '89M', ok: false },
        { s: 'BHX Nguyễn Văn Linh', q: '3,600 hộp', r: '104M', ok: true },
      ],
    },
  },
  {
    icon: '🍚', name: 'Gạo ST25 5kg', cat: 'Thực phẩm khô', rev: '312.4M', qty: '8,200 túi',
    detail: {
      growth: '+2.3%',
      stores: [
        { s: 'BHX Phan Văn Trị', q: '1,800 túi', r: '68M', ok: true },
        { s: 'BHX Lê Trọng Tấn', q: '1,600 túi', r: '61M', ok: true },
        { s: 'BHX Nguyễn Ánh Thủ', q: '1,700 túi', r: '65M', ok: false },
        { s: 'BHX Trần Não', q: '1,500 túi', r: '57M', ok: true },
        { s: 'BHX Nguyễn Văn Linh', q: '1,600 túi', r: '61M', ok: true },
      ],
    },
  },
]

type TabKey = 'ngay' | 'hom_qua' | 'tuan'

interface MetricCard {
  label: string
  value: string
  unit: string
  trend: string
  desc: string
  fill: number
}

interface StoreRecord {
  rank: number
  name: string
  loc: string
  rev: string
}

interface ProductStore {
  s: string
  q: string
  r: string
  ok: boolean
}

const dataByTab: Record<TabKey, number[]> = {
  ngay: [820, 940, 780, 1100, 1350, 1620, 1890],
  hom_qua: [760, 880, 820, 980, 1200, 1480, 1700],
  tuan: [5200, 6100, 5800, 6700, 7200, 8100, 9600],
}

const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']

const PRIMARY = '#1a6b3a'
const PRIMARY_MID = '#2d9e5f'
const BAR_DEFAULT = '#b6dfc6'

function BarChart({ data }: { data: number[] }) {
  const max = Math.max(...data)
  const chartH = 180
  const barW = 32
  const gap = 14
  const paddingLeft = 40
  const paddingBottom = 28
  const paddingTop = 16
  const totalW = paddingLeft + data.length * (barW + gap) - gap + 10

  const yTicks = [0, 500, 1000, 1500, 2000]

  return (
    <svg width="100%" viewBox={`0 0 ${totalW} ${chartH + paddingBottom + paddingTop}`} style={{ overflow: 'visible' }}>
      {yTicks.map((tick) => {
        const y = paddingTop + chartH - (tick / max) * chartH
        return (
          <g key={tick}>
            <line x1={paddingLeft} y1={y} x2={totalW} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
            <text x={paddingLeft - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
              {tick >= 1000 ? `${tick / 1000}B` : tick === 0 ? '0' : `${tick}M`}
            </text>
          </g>
        )
      })}
      {data.map((val, i) => {
        const barH = (val / max) * chartH
        const x = paddingLeft + i * (barW + gap)
        const y = paddingTop + chartH - barH
        const isLast = i === data.length - 1
        const isMax = val === max
        const fill = isLast ? PRIMARY : isMax ? PRIMARY_MID : BAR_DEFAULT
        const labelColor = isLast || isMax ? PRIMARY : '#6b7280'
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill={fill} rx="4" />
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fill={labelColor} fontWeight="500">
              {val >= 1000 ? `${(val / 1000).toFixed(1)}B` : `${val}M`}
            </text>
            <text
              x={x + barW / 2}
              y={chartH + paddingTop + paddingBottom - 6}
              textAnchor="middle"
              fontSize="10"
              fill={isLast ? PRIMARY : '#9ca3af'}
              fontWeight={isLast ? '500' : '400'}
            >
              {dayLabels[i]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

type Product = typeof products[0]

function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-[500px] max-w-[95vw] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-gray-900">{product.icon} {product.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Doanh thu', val: product.rev },
            { label: 'Số lượng', val: product.qty },
            { label: 'Tăng trưởng', val: product.detail.growth, green: true },
          ].map((m: { label: string; val: string; green?: boolean }) => (
            <div key={m.label} className="bg-gray-50 rounded-lg p-3">
              <div className="text-[11px] text-gray-500 mb-1">{m.label}</div>
              <div className={`text-lg font-medium ${m.green ? 'text-[#1a6b3a]' : 'text-gray-900'}`}>{m.val}</div>
            </div>
          ))}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Cửa hàng', 'Số lượng', 'Doanh thu', 'Trạng thái'].map((h: string) => (
                <th key={h} className="text-[11px] text-gray-400 font-medium uppercase tracking-wide pb-2 text-left last:text-right">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {product.detail.stores.map((row: ProductStore, i: number) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-2 font-medium text-gray-800">{row.s}</td>
                <td className="py-2 text-gray-500">{row.q}</td>
                <td className="py-2 text-gray-800">{row.r}</td>
                <td className="py-2 text-right">
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${row.ok ? 'bg-[#e8f5ed] text-[#1a6b3a]' : 'bg-amber-50 text-amber-700'}`}>
                    {row.ok ? 'Tốt' : 'Cần bổ sung'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TopStoresModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-[480px] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-gray-900">Tất cả cửa hàng – Doanh thu</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Hạng', 'Cửa hàng', 'Khu vực', 'Doanh thu'].map((h: string) => (
                <th key={h} className="text-[11px] text-gray-400 font-medium uppercase tracking-wide pb-2 text-left last:text-right">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stores.map((s: StoreRecord) => (
              <tr key={s.rank} className="border-b border-gray-50 last:border-0">
                <td className="py-2 font-medium text-gray-800">#{s.rank}</td>
                <td className="py-2 font-medium text-gray-800">{s.name}</td>
                <td className="py-2 text-gray-500 text-xs">{s.loc}</td>
                <td className="py-2 font-medium text-gray-800 text-right">{s.rev}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('ngay')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showTopModal, setShowTopModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-medium text-gray-900">Báo cáo doanh thu cửa hàng</h2>
          <p className="text-xs text-gray-500 mt-0.5">Cập nhật lúc 09:30 AM, 24/05/2024</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-500">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            01/05/2024 – 24/05/2024
          </div>
          <div className="flex items-center gap-1.5 bg-[#e8f5ed] border border-[#b6dfc6] rounded-lg px-3 py-1.5 text-xs text-[#1a6b3a]">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
            Tất cả cửa hàng
          </div>
          <button className="flex items-center gap-1.5 bg-[#1a6b3a] hover:bg-[#155c30] text-white rounded-lg px-4 py-1.5 text-xs font-medium transition-colors">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Xuất dữ liệu
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-3.5 mb-5">
        {[
          { label: 'Tổng doanh thu cửa hàng', value: '9.6B', unit: 'đồng', trend: '▲ 12.4%', desc: 'so với tháng trước', fill: 78 },
          { label: 'Số hóa đơn', value: '420k', unit: 'Trung bình 17.5k đơn/ngày', trend: '▲ 8.1%', desc: 'so với tháng trước', fill: 62 },
          { label: 'Tăng trưởng doanh thu', value: '+18%', unit: 'Mục tiêu tháng: 10B đồng', trend: '▲ 3.4%', desc: 'vượt kỳ vọng', fill: 96 },
        ].map((m: MetricCard) => (
          <div key={m.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1.5">{m.label}</div>
            <div className="text-[28px] font-medium text-gray-900 leading-none">{m.value}</div>
            <div className="text-xs text-gray-400 mt-1">{m.unit}</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="text-[#1a6b3a] font-medium">{m.trend}</span>
              <span className="text-gray-400">{m.desc}</span>
            </div>
            <div className="h-1 bg-[#e8f5ed] rounded-full mt-2.5">
              <div className="h-1 bg-[#1a6b3a] rounded-full" style={{ width: `${m.fill}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Top stores */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: '1fr 300px' }}>
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-gray-900">Xu hướng doanh thu</div>
              <div className="text-xs text-gray-400 mt-0.5">Theo ngày trong tuần</div>
            </div>
            <div className="flex gap-1">
              {(['ngay', 'hom_qua', 'tuan'] as TabKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${activeTab === key ? 'bg-[#1a6b3a] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {key === 'ngay' ? 'Hôm nay' : key === 'hom_qua' ? 'Hôm qua' : 'Tuần rồi'}
                </button>
              ))}
            </div>
          </div>
          <BarChart data={dataByTab[activeTab]} />
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-900">Top cửa hàng</div>
            <button onClick={() => setShowTopModal(true)} className="text-xs text-[#1a6b3a] hover:underline">
              Tất cả
            </button>
          </div>
          {stores.slice(0, 4).map((s: StoreRecord) => (
            <div key={s.rank} className="flex items-center gap-2.5 py-2.5 border-b border-gray-50 last:border-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0 ${s.rank === 1 ? 'bg-[#1a6b3a] text-white' : 'bg-[#e8f5ed] text-[#1a6b3a]'}`}>
                {s.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-800 truncate">{s.name}</div>
                <div className="text-[11px] text-gray-400">{s.loc}</div>
              </div>
              <div className="text-xs font-medium text-gray-800 whitespace-nowrap">{s.rev}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Products table */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-medium text-gray-900">Sản phẩm đóng góp cao</div>
            <div className="text-xs text-gray-400 mt-0.5">Tỷ trọng doanh thu theo danh mục sản phẩm</div>
          </div>
          <button className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
            Chi tiết danh mục
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Sản phẩm', 'Danh mục', 'Doanh số', 'Số lượng', 'Hành động'].map((h: string) => (
                <th key={h} className="text-[11px] text-gray-400 font-medium uppercase tracking-wide pb-2.5 text-left last:text-center">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p: typeof products[0], i: number) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#f0f9f4] flex items-center justify-center text-base flex-shrink-0">{p.icon}</div>
                    <span className="font-medium text-gray-800 text-xs">{p.name}</span>
                  </div>
                </td>
                <td className="py-3 text-xs text-gray-400">{p.cat}</td>
                <td className="py-3 text-xs font-medium text-gray-800">{p.rev}</td>
                <td className="py-3 text-xs text-gray-400">{p.qty}</td>
                <td className="py-3 text-center">
                  <button
                    onClick={() => setSelectedProduct(p)}
                    className="inline-flex items-center justify-center p-1.5 rounded-md text-[#1a6b3a] hover:bg-[#e8f5ed] transition-colors"
                    title="Xem chi tiết"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
      {showTopModal && (
        <TopStoresModal onClose={() => setShowTopModal(false)} />
      )}
    </div>
  )
}