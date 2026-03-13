'use client'

import { useMemo, useState } from 'react'
import {
  BadgePercent,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  PackageSearch,
  Search,
  Wallet,
} from 'lucide-react'

type Urgency = 'Khẩn cấp' | 'Sắp áp dụng' | 'Theo dõi'
type DiscountStatus = 'Chờ áp dụng' | 'Đang giảm giá' | 'Đã lên kế hoạch'

interface DiscountItem {
  id: string
  productName: string
  category: string
  stock: number
  unit: string
  expiryDate: string
  daysLeft: number
  originalPrice: number
  discountPercent: number
  finalPrice: number
  urgency: Urgency
  status: DiscountStatus
}

const DISCOUNT_ITEMS: DiscountItem[] = [
  { id: 'DG-001', productName: 'Sữa tươi Organic 1L',        category: 'Sữa & Trứng', stock: 12, unit: 'Hộp', expiryDate: '14/03/2026', daysLeft: 1, originalPrice: 45000, discountPercent: 25, finalPrice: 33750, urgency: 'Khẩn cấp',   status: 'Chờ áp dụng' },
  { id: 'DG-002', productName: 'Sữa chua Hy Lạp',            category: 'Sữa & Trứng', stock: 24, unit: 'Lốc', expiryDate: '15/03/2026', daysLeft: 2, originalPrice: 59900, discountPercent: 20, finalPrice: 47920, urgency: 'Khẩn cấp',   status: 'Đang giảm giá' },
  { id: 'DG-003', productName: 'Bánh mì nguyên cám',         category: 'Bánh & Kẹo', stock: 8,  unit: 'Ổ',   expiryDate: '28/03/2026', daysLeft: 5, originalPrice: 32500, discountPercent: 15, finalPrice: 27625, urgency: 'Sắp áp dụng', status: 'Chờ áp dụng' },
  { id: 'DG-004', productName: 'Rau chân vịt túi',           category: 'Rau củ',      stock: 15, unit: 'Túi', expiryDate: '30/03/2026', daysLeft: 7, originalPrice: 29900, discountPercent: 10, finalPrice: 26910, urgency: 'Sắp áp dụng', status: 'Đã lên kế hoạch' },
  { id: 'DG-005', productName: 'Cá viên đông lạnh',          category: 'Đồ đông lạnh',stock: 20, unit: 'Gói', expiryDate: '31/03/2026', daysLeft: 8, originalPrice: 72000, discountPercent: 12, finalPrice: 63360, urgency: 'Theo dõi',   status: 'Đã lên kế hoạch' },
  { id: 'DG-006', productName: 'Nước cam ép 1L',             category: 'Nước uống',   stock: 18, unit: 'Chai',expiryDate: '19/03/2026', daysLeft: 6, originalPrice: 42000, discountPercent: 18, finalPrice: 34440, urgency: 'Sắp áp dụng', status: 'Đang giảm giá' },
  { id: 'DG-007', productName: 'Xúc xích tiệt trùng',        category: 'Đồ mát',      stock: 30, unit: 'Gói', expiryDate: '01/04/2026', daysLeft: 9, originalPrice: 38000, discountPercent: 8,  finalPrice: 34960, urgency: 'Theo dõi',   status: 'Đã lên kế hoạch' },
  { id: 'DG-008', productName: 'Táo Envy hộp 4 quả',         category: 'Trái cây',    stock: 14, unit: 'Hộp', expiryDate: '18/03/2026', daysLeft: 5, originalPrice: 89000, discountPercent: 15, finalPrice: 75650, urgency: 'Khẩn cấp',   status: 'Chờ áp dụng' },
]

const PAGE_SIZE = 6
const DEFAULT_MAX_DISCOUNT = 30
const NEAR_EXPIRY_MAX_DISCOUNT = 50
const MS_PER_DAY = 24 * 60 * 60 * 1000

function parseVnDate(value: string): Date {
  const [dd, mm, yyyy] = value.split('/').map(Number)
  return new Date(yyyy, (mm || 1) - 1, dd || 1)
}

function daysToExpiry(expiryDate: string): number {
  const target = parseVnDate(expiryDate)
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime()
  return Math.ceil((end - start) / MS_PER_DAY)
}

function maxDiscountByExpiry(expiryDate: string): number {
  return daysToExpiry(expiryDate) <= 2 ? NEAR_EXPIRY_MAX_DISCOUNT : DEFAULT_MAX_DISCOUNT
}

function urgencyByExpiry(expiryDate: string): Urgency {
  const days = daysToExpiry(expiryDate)
  if (days < 7) return 'Khẩn cấp'
  if (days <= 20) return 'Sắp áp dụng'
  return 'Theo dõi'
}

function calcFinalPrice(originalPrice: number, discountPercent: number) {
  const safePercent = Math.min(100, Math.max(0, discountPercent))
  const result = Math.round(originalPrice * (1 - safePercent / 100))
  return Math.max(0, result)
}

function validatePercentInput(rawValue: string, currentPercent: number, maxDiscount: number): { valid: boolean; error?: string; percent?: number } {
  const trimmed = rawValue.trim()
  if (trimmed === '') {
    if (currentPercent > 0) return { valid: false, error: 'Vui lòng nhập phần trăm giảm giá' }
    return { valid: false, error: 'Phần trăm giảm giá không được để trống' }
  }

  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, error: 'Chỉ được nhập số' }
  }

  const num = Number(trimmed)
  if (Number.isNaN(num) || num < 0 || num > maxDiscount) {
    return { valid: false, error: `Hàng này chỉ được giảm tối đa ${maxDiscount}%` }
  }

  return { valid: true, percent: num }
}

function fmtCurrency(value: number) {
  return `${value.toLocaleString('vi-VN')} ₫`
}

function urgencyBadge(daysLeft: number) {
  if (daysLeft <= 0) return 'bg-red-100 text-red-600'
  if (daysLeft <= 1) return 'bg-red-100 text-red-600'
  if (daysLeft <= 3) return 'bg-orange-100 text-orange-600'
  if (daysLeft <= 7) return 'bg-amber-100 text-amber-700'
  return 'bg-sky-100 text-sky-700'
}

function statusBadge(status: DiscountStatus) {
  if (status === 'Đang giảm giá') return 'bg-emerald-100 text-emerald-700'
  if (status === 'Chờ áp dụng') return 'bg-blue-100 text-blue-700'
  return 'bg-gray-100 text-gray-600'
}

export default function StoreManagerDiscountsPage() {
  const [items, setItems] = useState<DiscountItem[]>(() =>
    DISCOUNT_ITEMS.map((item) => ({
      ...item,
      finalPrice: calcFinalPrice(item.originalPrice, item.discountPercent),
    })),
  )
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'Tất cả' | Urgency>('Tất cả')
  const [page, setPage] = useState(1)
  const [draftDiscount, setDraftDiscount] = useState<Record<string, string>>(() =>
    Object.fromEntries(DISCOUNT_ITEMS.map((item) => [item.id, String(item.discountPercent)])),
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const filtered = useMemo(() => {
    let nextItems = items
    if (filter !== 'Tất cả') {
      nextItems = nextItems.filter((item) => urgencyByExpiry(item.expiryDate) === filter)
    }
    if (search.trim()) {
      const query = search.toLowerCase()
      nextItems = nextItems.filter((item) =>
        item.productName.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query),
      )
    }
    return nextItems
  }, [items, filter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const summary = useMemo(() => {
    const expiring = items.filter((item) => daysToExpiry(item.expiryDate) <= 7)
    const urgent = items.filter((item) => urgencyByExpiry(item.expiryDate) === 'Khẩn cấp')
    const unitsAtRisk = items.reduce((sum, item) => sum + item.stock, 0)
    const inventoryValue = items.reduce((sum, item) => sum + item.originalPrice * item.stock, 0)
    return {
      expiringCount: expiring.length,
      urgentCount: urgent.length,
      unitsAtRisk,
      inventoryValue,
    }
  }, [items])

  const handleDiscountInput = (id: string, value: string) => {
    if (!/^\d*$/.test(value)) {
      setFieldErrors((prev) => ({ ...prev, [id]: 'Chỉ được nhập số' }))
      return
    }

    setDraftDiscount((prev) => ({ ...prev, [id]: value }))

    if (!value) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      return
    }

    const target = items.find((item) => item.id === id)
    if (!target) return
    const maxDiscount = maxDiscountByExpiry(target.expiryDate)
    const numeric = Number(value)
    setFieldErrors((prev) => {
      const next = { ...prev }
      if (numeric > maxDiscount) next[id] = `Hàng này chỉ được giảm tối đa ${maxDiscount}%`
      else delete next[id]
      return next
    })
  }

  const handleApplyDiscount = (id: string) => {
    const target = items.find((item) => item.id === id)
    if (!target) return

    const raw = draftDiscount[id] ?? ''
    const maxDiscount = maxDiscountByExpiry(target.expiryDate)
    const validation = validatePercentInput(raw, target.discountPercent, maxDiscount)
    if (!validation.valid || validation.percent === undefined) {
      setFieldErrors((prev) => ({ ...prev, [id]: validation.error || `Hàng này chỉ được giảm tối đa ${maxDiscount}%` }))
      return
    }

    const percent = validation.percent
    const nextFinalPrice = calcFinalPrice(target.originalPrice, percent)

    setItems((prev) => prev.map((item) => {
      if (item.id !== id) return item
      return {
        ...item,
        discountPercent: percent,
        finalPrice: nextFinalPrice,
        status: percent === 0 ? 'Đã lên kế hoạch' : 'Đang giảm giá',
      }
    }))

    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BadgePercent size={22} className="text-blue-600" />
          Giảm giá hàng cận hạn
        </h1>
        <p className="text-[13px] text-slate-500 mt-1">Theo dõi sản phẩm gần hết hạn và áp dụng mức giảm giá phù hợp để tối ưu tồn kho.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: 'Sản phẩm cận hạn',
            value: summary.expiringCount,
            helper: 'Trong 7 ngày tới',
            icon: CalendarClock,
            accent: 'text-blue-600',
            chip: 'bg-blue-50 text-blue-600',
          },
          {
            label: 'Mức độ khẩn cấp',
            value: summary.urgentCount,
            helper: 'Cần xử lý ngay',
            icon: CircleAlert,
            accent: 'text-red-500',
            chip: 'bg-red-50 text-red-500',
          },
          {
            label: 'Số lượng rủi ro',
            value: `${summary.unitsAtRisk} SP`,
            helper: 'Tổng hàng cần theo dõi',
            icon: PackageSearch,
            accent: 'text-amber-600',
            chip: 'bg-amber-50 text-amber-600',
          },
          {
            label: 'Giá trị tồn kho',
            value: fmtCurrency(summary.inventoryValue),
            helper: 'Giá trị hàng đang theo dõi',
            icon: Wallet,
            accent: 'text-emerald-600',
            chip: 'bg-emerald-50 text-emerald-600',
          },
        ].map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">{card.label}</p>
                  <p className={`text-3xl font-bold mt-2 ${card.accent}`}>{card.value}</p>
                  <p className="text-[12px] text-slate-400 mt-1">{card.helper}</p>
                </div>
                <span className={`w-10 h-10 rounded-xl inline-flex items-center justify-center ${card.chip}`}>
                  <Icon size={18} />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-[22px] font-bold text-slate-800">Sản phẩm đề xuất giảm giá</h2>
              <p className="text-[13px] text-slate-400 mt-1">Danh sách ưu tiên theo hạn sử dụng và mức tồn kho hiện tại.</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[12px] font-semibold text-blue-600">
              {summary.urgentCount} mục khẩn cấp
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="relative flex-1 max-w-xl">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Tìm sản phẩm, danh mục hoặc mã chương trình..."
                className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-[13px] text-slate-700 outline-none focus:bg-white focus:border-blue-400 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {(['Tất cả', 'Khẩn cấp', 'Sắp áp dụng', 'Theo dõi'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFilter(option)
                    setPage(1)
                  }}
                  className={`px-3.5 h-10 rounded-xl text-[12px] font-semibold transition-colors ${
                    filter === option
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Sản phẩm', 'Danh mục', 'Tồn kho', 'HSD', 'Còn lại', 'Giá gốc', 'Giảm (%)', 'Giá sau giảm', 'Trạng thái', 'Hành động'].map((heading) => (
                  <th key={heading} className="text-left px-5 py-4 text-[11px] uppercase tracking-wide font-semibold text-slate-400 whitespace-nowrap">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((item, index) => {
                const computedDaysLeft = daysToExpiry(item.expiryDate)
                const maxDiscount = maxDiscountByExpiry(item.expiryDate)
                const draftValue = draftDiscount[item.id] ?? ''
                const draftNumber = draftValue === '' ? null : Number(draftValue)
                const draftValid = draftNumber != null && !Number.isNaN(draftNumber) && draftNumber >= 0 && draftNumber <= maxDiscount
                const previewPercent = draftNumber == null || !draftValid ? item.discountPercent : draftNumber
                const previewPrice = calcFinalPrice(item.originalPrice, previewPercent)
                const hasChanged = previewPercent !== item.discountPercent

                return (
                <tr key={item.id} className={`border-t border-slate-100 ${index % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'} hover:bg-blue-50/30 transition-colors`}>
                  <td className="px-5 py-4 min-w-[220px]">
                    <div>
                      <p className="font-semibold text-slate-800">{item.productName}</p>
                      <p className="text-[11px] text-slate-400 mt-1">Mã: {item.id}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{item.category}</td>
                  <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{item.stock} {item.unit}</td>
                  <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{item.expiryDate}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${urgencyBadge(computedDaysLeft)}`}>
                      {computedDaysLeft} ngày
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-500 whitespace-nowrap">{fmtCurrency(item.originalPrice)}</td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <div className="relative w-[88px]">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={maxDiscount}
                          value={draftValue}
                          onChange={(event) => handleDiscountInput(item.id, event.target.value)}
                          className={`w-full h-9 rounded-lg border bg-slate-50 pr-6 pl-2.5 text-[12px] font-semibold text-slate-700 outline-none transition-colors ${
                            fieldErrors[item.id] ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-blue-400'
                          }`}
                          aria-label={`Giảm giá của ${item.productName}`}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400">%</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Mức giảm tối đa: {maxDiscount}%</p>
                      {fieldErrors[item.id] && <p className="text-[11px] text-red-500 leading-tight">{fieldErrors[item.id]}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <p className="font-bold text-slate-800">{fmtCurrency(previewPrice)}</p>
                    {hasChanged && <p className="text-[11px] text-blue-600 mt-0.5">Preview cập nhật</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleApplyDiscount(item.id)}
                      className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold transition-colors whitespace-nowrap"
                    >
                      Áp dụng
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-[12px] text-slate-500">
            Hiển thị {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} sản phẩm
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
                className={`w-9 h-9 rounded-xl text-[12px] font-semibold transition-colors ${
                  pageNumber === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}