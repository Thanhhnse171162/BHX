'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, SlidersHorizontal, Star, Eye, X, Phone, UserPlus, Bell, ChevronLeft, ChevronRight, MapPin, User, Store, Calendar, Gem } from 'lucide-react'

interface Customer {
  id: string
  customerId: string
  fullName: string
  phone: string
  loyaltyPoints: number
  lastPurchase: string | null
  joinDate: string
  avatar?: string
  initials: string
  avatarColor: string
}

const MOCK_CUSTOMERS: Customer[] = [
  { id: '1',  customerId: 'KH-00021', fullName: 'Phạm Minh Hoàng', phone: '0982 123 456', loyaltyPoints: 1250, lastPurchase: 'Hôm nay, 14:30',  joinDate: '01/01/2024', initials: 'PM', avatarColor: 'bg-teal-600'   },
  { id: '2',  customerId: 'KH-00022', fullName: 'Nguyễn Thu Hà',   phone: '0912 445 667', loyaltyPoints: 420,  lastPurchase: '03/03/2026',       joinDate: '15/03/2024', initials: 'NT', avatarColor: 'bg-gray-400'   },
  { id: '3',  customerId: 'KH-00023', fullName: 'Trần Thị Bích',   phone: '0944 778 899', loyaltyPoints: 890,  lastPurchase: '01/03/2026',       joinDate: '22/06/2023', initials: 'TB', avatarColor: 'bg-teal-700'   },
  { id: '4',  customerId: 'KH-00024', fullName: 'Lê Văn Dũng',     phone: '0901 234 567', loyaltyPoints: 320,  lastPurchase: '26/02/2026',       joinDate: '10/09/2023', initials: 'LV', avatarColor: 'bg-blue-500'   },
  { id: '5',  customerId: 'KH-00025', fullName: 'Hoàng Thị Mai',   phone: '0976 543 210', loyaltyPoints: 1780, lastPurchase: '28/02/2026',       joinDate: '03/02/2023', initials: 'HT', avatarColor: 'bg-pink-500'   },
  { id: '6',  customerId: 'KH-00026', fullName: 'Võ Minh Tuấn',    phone: '0933 111 222', loyaltyPoints: 540,  lastPurchase: '20/02/2026',       joinDate: '14/07/2024', initials: 'VM', avatarColor: 'bg-orange-500' },
  { id: '7',  customerId: 'KH-00027', fullName: 'Đặng Thị Lan',    phone: '0988 777 333', loyaltyPoints: 95,   lastPurchase: '10/02/2026',       joinDate: '01/11/2024', initials: 'ĐL', avatarColor: 'bg-purple-500' },
  { id: '8',  customerId: 'KH-00028', fullName: 'Bùi Quốc Hùng',   phone: '0965 432 100', loyaltyPoints: 2100, lastPurchase: '04/03/2026',       joinDate: '20/04/2022', initials: 'BQ', avatarColor: 'bg-red-500'    },
  { id: '9',  customerId: 'KH-00029', fullName: 'Phan Thị Nga',     phone: '0918 654 321', loyaltyPoints: 670,  lastPurchase: '25/02/2026',       joinDate: '08/08/2023', initials: 'PN', avatarColor: 'bg-yellow-600' },
  { id: '10', customerId: 'KH-00030', fullName: 'Ngô Văn Bảo',     phone: '0945 888 999', loyaltyPoints: 150,  lastPurchase: '15/02/2026',       joinDate: '17/12/2024', initials: 'NV', avatarColor: 'bg-cyan-600'   },
  { id: '11', customerId: 'KH-00031', fullName: 'Trịnh Thị Hương', phone: '0902 345 678', loyaltyPoints: 3200, lastPurchase: '02/03/2026',       joinDate: '05/01/2022', initials: 'TH', avatarColor: 'bg-indigo-500' },
  { id: '12', customerId: 'KH-00032', fullName: 'Lý Văn Khoa',     phone: '0978 123 000', loyaltyPoints: 410,  lastPurchase: '22/02/2026',       joinDate: '30/05/2024', initials: 'LK', avatarColor: 'bg-green-600'  },
  { id: '13', customerId: 'KH-00033', fullName: 'Mai Thị Thu',     phone: '0934 567 890', loyaltyPoints: 760,  lastPurchase: '27/02/2026',       joinDate: '12/10/2023', initials: 'MT', avatarColor: 'bg-rose-500'   },
  { id: '14', customerId: 'KH-00034', fullName: 'Đinh Quốc Anh',   phone: '0911 222 333', loyaltyPoints: 1100, lastPurchase: '05/03/2026',       joinDate: '19/03/2023', initials: 'ĐA', avatarColor: 'bg-teal-500'   },
  { id: '15', customerId: 'KH-00035', fullName: 'Cao Thị Phương',  phone: '0956 789 012', loyaltyPoints: 230,  lastPurchase: null,               joinDate: '25/11/2024', initials: 'CP', avatarColor: 'bg-violet-500' },
]

type DateFilter = 'today' | '7days' | '30days' | 'custom' | null
type PointsFilter = 'lt500' | '500to2000' | 'gt2000' | null

const DATE_FILTER_LABELS: Record<NonNullable<DateFilter>, string> = {
  today: 'Hôm nay',
  '7days': '7 ngày gần nhất',
  '30days': '30 ngày gần nhất',
  custom: 'Khoảng ngày tùy chọn',
}
const POINTS_FILTER_LABELS: Record<NonNullable<PointsFilter>, string> = {
  lt500: '< 500 điểm',
  '500to2000': '500 – 2.000 điểm',
  gt2000: '> 2.000 điểm',
}

// Simulate last-purchase as days-ago (based on mock data text)
function getDaysAgo(lastPurchase: string | null): number | null {
  if (!lastPurchase) return null
  if (lastPurchase.startsWith('Hôm nay')) return 0
  // parse dd/mm/yyyy
  const parts = lastPurchase.split('/')
  if (parts.length !== 3) return null
  const d = new Date(+parts[2], +parts[1] - 1, +parts[0])
  return Math.floor((Date.now() - d.getTime()) / 86400000)
}

const PAGE_SIZE = 13

function CreateAccountModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (phone: string, address: string) => void }) {
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [addressError, setAddressError] = useState('')

  const validatePhone = (v: string) => /^(0[3|5|7|8|9])+([0-9]{8})$/.test(v.replace(/\s/g, ''))

  const handleSubmit = () => {
    let valid = true
    if (!phone.trim()) { setPhoneError('Vui lòng nhập số điện thoại'); valid = false }
    else if (!validatePhone(phone)) { setPhoneError('Số điện thoại không hợp lệ'); valid = false }
    else setPhoneError('')
    if (!address.trim()) { setAddressError('Vui lòng nhập địa chỉ'); valid = false }
    else setAddressError('')
    if (!valid || !confirmed) return
    onSubmit(phone, address)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl">
        {/* Breadcrumb */}
        <div className="px-8 pt-6 pb-2">
          <p className="text-sm">
            <span className="text-teal-600 hover:underline cursor-pointer" onClick={onClose}>Khách hàng</span>
            <span className="text-gray-400 mx-1">/</span>
            <span className="text-gray-500">Thêm mới</span>
          </p>
        </div>

        {/* Form card */}
        <div className="mx-8 mb-5 border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">Thông tin tài khoản mới</h2>
          <p className="text-sm text-gray-500 mb-5">Vui lòng điền chính xác thông tin để hỗ trợ việc chăm sóc khách hàng tốt nhất.</p>

          {/* Phone field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <div className={`flex items-center border rounded-lg px-3 py-2.5 gap-2.5 transition-colors ${
              phoneError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500'
            }`}>
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); if (phoneError) setPhoneError('') }}
                placeholder="Nhập số điện thoại khách hàng"
                className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
              />
            </div>
            {phoneError
              ? <p className="text-xs text-red-500 mt-1">{phoneError}</p>
              : <p className="text-xs text-blue-500 mt-1">Định dạng số điện thoại hợp lệ tại Việt Nam (vd: 090...)</p>
            }
          </div>

          {/* Address field */}
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Địa chỉ khách hàng <span className="text-red-500">*</span>
            </label>
            <div className={`flex items-start border rounded-lg px-3 py-2.5 gap-2.5 transition-colors ${
              addressError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500'
            }`}>
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <textarea
                value={address}
                onChange={e => { setAddress(e.target.value); if (addressError) setAddressError('') }}
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                rows={3}
                className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400 resize-none"
              />
            </div>
            {addressError && <p className="text-xs text-red-500 mt-1">{addressError}</p>}
          </div>
        </div>

        {/* Confirm checkbox */}
        <div className="px-8 mb-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-teal-700 flex-shrink-0 cursor-pointer"
            />
            <span className="text-sm text-gray-600 leading-relaxed">
              Tôi xác nhận đã kiểm tra thông tin khách hàng và cam kết tính trung thực của dữ liệu.
            </span>
          </label>
        </div>

        {/* Staff & Branch info */}
        <div className="px-8 mb-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nhân viên thực hiện</p>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <User className="w-4 h-4 text-gray-400" />
              <span>Nguyễn Văn An</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Chi nhánh</p>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Store className="w-4 h-4 text-gray-400" />
              <span>Cửa hàng Quận 1</span>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="px-8 pb-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            disabled={!confirmed}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Tạo tài khoản
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [filterPoints, setFilterPoints] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilter>(null)
  const [pointsFilter, setPointsFilter] = useState<PointsFilter>(null)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const filterRef = useRef<HTMLDivElement>(null)

  // Close filter panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterPanel(false)
      }
    }
    if (showFilterPanel) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showFilterPanel])

  const applyDateFilter = (c: Customer): boolean => {
    if (!dateFilter) return true
    const days = getDaysAgo(c.lastPurchase)
    if (days === null) return false
    if (dateFilter === 'today') return days === 0
    if (dateFilter === '7days') return days <= 7
    if (dateFilter === '30days') return days <= 30
    if (dateFilter === 'custom' && customFrom && customTo) {
      const [fd, fm, fy] = customFrom.split('-').reverse()
      const [td2, tm, ty] = customTo.split('-').reverse()
      const from = new Date(+fy, +fm - 1, +fd)
      const to = new Date(+ty, +tm - 1, +td2)
      const lastDate = new Date(Date.now() - days * 86400000)
      return lastDate >= from && lastDate <= to
    }
    return true
  }

  const applyPointsFilter = (c: Customer): boolean => {
    if (!pointsFilter) return true
    if (pointsFilter === 'lt500') return c.loyaltyPoints < 500
    if (pointsFilter === '500to2000') return c.loyaltyPoints >= 500 && c.loyaltyPoints <= 2000
    if (pointsFilter === 'gt2000') return c.loyaltyPoints > 2000
    return true
  }

  const activeFilterCount = (dateFilter ? 1 : 0) + (pointsFilter ? 1 : 0)

  const filtered = useMemo(() => {
    let list = [...MOCK_CUSTOMERS]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.fullName.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.customerId.toLowerCase().includes(q)
      )
    }
    list = list.filter(c => applyDateFilter(c) && applyPointsFilter(c))
    if (filterPoints) {
      list.sort((a, b) => b.loyaltyPoints - a.loyaltyPoints)
    } else {
      list.sort((a, b) => a.fullName.localeCompare(b.fullName, 'en', { sensitivity: 'base' }))
    }
    return list
  }, [search, filterPoints, dateFilter, pointsFilter, customFrom, customTo])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearch = (v: string) => {
    setSearch(v)
    setPage(1)
  }

  const handleSelect = (c: Customer) => {
    setSelectedCustomer(prev => prev?.id === c.id ? null : c)
  }

  const handleCreateAccount = (phone: string, address: string) => {
    // TODO: call API to create customer
    setShowCreateModal(false)
  }

  return (
    <div className="relative flex h-full bg-gray-50">
      {showCreateModal && (
        <CreateAccountModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAccount}
        />
      )}
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT,..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white text-sm font-medium rounded-lg hover:bg-teal-800 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Tạo tài khoản
          </button>
          <button className="relative p-2 text-gray-500 hover:text-gray-700">
            <Bell className="w-5 h-5" />
          </button>
        </div>

        {/* Filter row */}
        <div className="bg-white border-b border-gray-100 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Filter button with dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilterPanel(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  showFilterPanel || activeFilterCount > 0
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Bộ lọc
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-teal-700 text-[10px] font-bold leading-none ml-0.5">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {showFilterPanel && (
                <div className="absolute left-0 top-full mt-2 z-40 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4">
                  {/* Date section */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ngày mua cuối</p>
                    </div>
                    <div className="space-y-1">
                      {(['today', '7days', '30days', 'custom'] as const).map(opt => (
                        <button
                          key={opt}
                          onClick={() => { setDateFilter(prev => prev === opt ? null : opt); setPage(1) }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            dateFilter === opt
                              ? 'bg-teal-50 text-teal-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {DATE_FILTER_LABELS[opt]}
                        </button>
                      ))}
                      {dateFilter === 'custom' && (
                        <div className="flex gap-2 px-1 pt-1">
                          <input
                            type="date"
                            value={customFrom}
                            onChange={e => { setCustomFrom(e.target.value); setPage(1) }}
                            className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-teal-500"
                          />
                          <span className="self-center text-gray-400 text-xs">—</span>
                          <input
                            type="date"
                            value={customTo}
                            onChange={e => { setCustomTo(e.target.value); setPage(1) }}
                            className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-teal-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-full h-px bg-gray-100 mb-4" />

                  {/* Points section */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Gem className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Điểm tích lũy</p>
                    </div>
                    <div className="space-y-1">
                      {(['lt500', '500to2000', 'gt2000'] as const).map(opt => (
                        <button
                          key={opt}
                          onClick={() => { setPointsFilter(prev => prev === opt ? null : opt); setPage(1) }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            pointsFilter === opt
                              ? 'bg-teal-50 text-teal-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {POINTS_FILTER_LABELS[opt]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reset */}
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => { setDateFilter(null); setPointsFilter(null); setCustomFrom(''); setCustomTo(''); setPage(1) }}
                      className="w-full py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => { setFilterPoints(v => !v); setPage(1) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${filterPoints ? 'bg-teal-700 text-white border-teal-700' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              <Star className="w-3.5 h-3.5" />
              Điểm thưởng
            </button>

            {/* Active filter chips */}
            {dateFilter && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                {DATE_FILTER_LABELS[dateFilter]}
                <button onClick={() => { setDateFilter(null); setCustomFrom(''); setCustomTo(''); setPage(1) }}><X className="w-3 h-3" /></button>
              </span>
            )}
            {pointsFilter && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                {POINTS_FILTER_LABELS[pointsFilter]}
                <button onClick={() => { setPointsFilter(null); setPage(1) }}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">
            Hiển thị {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filtered.length)} trong {filtered.length}
          </span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wide border-r border-gray-200">Khách hàng</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wide border-r border-gray-200">Số điện thoại</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wide border-r border-gray-200">Điểm tích LKY</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wide border-r border-gray-200">Mua lần cuối</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-gray-400">Không tìm thấy khách hàng</td>
                  </tr>
                ) : (
                  paginated.map((c, i) => {
                    const isSelected = selectedCustomer?.id === c.id
                    return (
                      <tr
                        key={c.id}
                        onClick={() => handleSelect(c)}
                        className={`border-b border-gray-200 last:border-0 cursor-pointer transition-colors ${isSelected ? 'bg-teal-50 border-l-4 border-l-teal-600' : 'hover:bg-gray-50'}`}
                      >
                        <td className={`px-4 py-3 border-r border-gray-200 ${isSelected ? 'pl-3' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${c.avatarColor}`}>
                              {c.initials}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{c.fullName}</p>
                              <p className="text-xs text-gray-400">ID: {c.customerId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 border-r border-gray-200">{c.phone}</td>
                        <td className="px-4 py-3 border-r border-gray-200">
                          <span className="font-semibold text-teal-700">{c.loyaltyPoints.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 border-r border-gray-200">{c.lastPurchase ?? '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={e => { e.stopPropagation(); handleSelect(c) }}
                            className="p-1.5 text-gray-400 hover:text-teal-600 transition-colors rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500">
                Trang {page} / {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${pg === page ? 'bg-teal-700 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel — floating top-right */}
      {selectedCustomer && (
        <div className="absolute top-16 right-4 z-30 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col" style={{ maxHeight: 'calc(100% - 80px)' }}>
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${selectedCustomer.avatarColor}`}>
                {selectedCustomer.initials}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm leading-tight">{selectedCustomer.fullName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{selectedCustomer.phone}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedCustomer(null)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Loyalty points */}
          <div className="px-5 py-4 border-b border-gray-100 text-center">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Điểm tích LKY</p>
            <p className="text-3xl font-bold text-teal-700">{selectedCustomer.loyaltyPoints.toLocaleString()}</p>
          </div>

          {/* Contact info */}
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Thông tin liên hệ</p>
            <div className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2.5">
              <Phone className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Số điện thoại</p>
                <p className="text-sm font-semibold text-gray-800">{selectedCustomer.phone}</p>
              </div>
            </div>
          </div>

          {/* Account info */}
          <div className="px-5 py-4 flex-1 overflow-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tài khoản</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">ID Khách hàng</span>
                <span className="text-sm font-semibold text-gray-800">{selectedCustomer.customerId}</span>
              </div>
              <div className="w-full h-px bg-gray-100" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Ngày tham gia</span>
                <span className="text-sm font-semibold text-gray-800">{selectedCustomer.joinDate}</span>
              </div>
            </div>
          </div>

          {/* Footer button */}
          <div className="p-5 border-t border-gray-100">
            <button className="w-full py-2.5 bg-teal-700 text-white text-sm font-semibold rounded-lg hover:bg-teal-800 transition-colors">
              Tạo điểm mới
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
