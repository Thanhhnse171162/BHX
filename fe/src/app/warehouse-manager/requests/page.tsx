'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import {
  CirclePlus,
  Download,
  Eye,
  Filter,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { RestockAPIService, RestockRequestFromAPI } from '@/services/restock-api.service'
import { ProductAPIService } from '@/services/product-api.service'
import { UserAPIService } from '@/services/user-api.service'

type RequestPriority = 'CAO' | 'TRUNG BÌNH' | 'THẤP'
type RequestStatus = 'Chờ duyệt' | 'Đang xử lý' | 'Đã giao' | 'Đã duyệt'
type RequestType = 'store' | 'warehouse'

interface RequestItem {
  id: string
  uniqueId: string  // For React key (must be unique)
  source: string
  sourceCode: string
  productSummary: string
  priority: RequestPriority
  status: RequestStatus
  createdAt: string
  actionLabel: string
  type: RequestType
}

const PAGE_SIZE = 4

export default function WarehouseManagerRequestsPage() {
  const user = useAuthStore((s) => s.user)
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [activeTab, setActiveTab] = useState<RequestType>('store')
  const [page, setPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newRequest, setNewRequest] = useState({
    source: '',
    sourceCode: '',
    productSummary: '',
    priority: 'TRUNG BÌNH' as RequestPriority,
  })

  // Load requests from API
  const loadRequests = useCallback(async () => {
    try {
      // Get warehouse ID - try multiple sources
      const warehouseId = user?.warehouseId ?? user?.storeId ?? user?.workplaceId ?? ''
      if (!warehouseId) {
        setRequests([])
        return
      }

      // Load product and user maps
      let productMap: Record<string, string> = {}
      try {
        const products = await ProductAPIService.getAllProducts()
        for (const p of products) {
          productMap[p.id] = p.name
        }
      } catch {
        // Continue without product mapping
      }

      let userMap: Record<string, string> = {}
      try {
        const users = await UserAPIService.getAll()
        for (const u of users) {
          const userName = u.full_name || u.fullName || u.name || u.email || u.id
          userMap[u.id] = userName
        }
      } catch {
        // Continue without user mapping
      }

      // Load all restock requests
      let allRequests: RestockRequestFromAPI[] = []
      try {
        allRequests = await RestockAPIService.getAll()
        console.log('📦 warehouse-manager: All requests loaded:', allRequests.length)
      } catch {
        console.log('📦 warehouse-manager: Failed to load all requests')
        allRequests = []
      }

      // Filter requests where fromWarehouseId = current warehouseId 
      // (because old data was created with: fromWarehouseId = Warehouse parent, toWarehouseId = Store)
      console.log('📦 warehouse-manager: Filtering by fromWarehouseId =', warehouseId.toLowerCase())
      const filtered = allRequests.filter(
        (r) => {
          const fromVal = (r.fromWarehouseId || '').toLowerCase()
          const toVal = (r.toWarehouseId || '').toLowerCase()
          const wid = warehouseId.toLowerCase()
          const matchFrom = fromVal === wid
          const matchTo = toVal === wid
          console.log(`  - request ${r.id}:`, {fromWarehouseId: r.fromWarehouseId, toWarehouseId: r.toWarehouseId, matchFrom, matchTo})
          return matchFrom || matchTo  // Try both
        }
      )
      console.log('📦 warehouse-manager: Filtered requests:', filtered.length)

      // Convert to RequestItem format
      const converted: RequestItem[] = filtered.map((req) => {
        const productNames = req.items?.map((item) => item.productName || productMap[item.productId] || '--').join(', ') || '--'
        const userName = userMap[req.requestedBy] || req.requestedBy || '--'
        const createdAtDate = req.requestedDate ? new Date(req.requestedDate).toLocaleDateString('vi-VN') : '--/--/----'

        return {
          uniqueId: req.id,  // Use backend ID for unique key
          id: req.requestNumber || req.id,  // Display ID
          source: userName,
          sourceCode: req.toWarehouseId || '--',  // Show store ID (destination)
          productSummary: productNames,
          priority: req.priority === 'URGENT' ? 'CAO' : req.priority === 'HIGH' ? 'TRUNG BÌNH' : 'THẤP',
          status: mapStatus(req.status),
          createdAt: createdAtDate,
          actionLabel: req.status === 'APPROVED' ? 'Đã duyệt' : 'Duyệt',
          type: 'store',
        }
      })

      setRequests(converted)
      setPage(1)
    } catch {
      setRequests([])
    }
  }, [user?.warehouseId, user?.storeId, user?.workplaceId])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  function mapStatus(status: string): RequestStatus {
    if (status === 'APPROVED') return 'Đã duyệt'
    if (status === 'COMPLETED') return 'Đã giao'
    if (status === 'PROCESSING') return 'Đang xử lý'
    return 'Chờ duyệt'
  }

  const onChangeTab = (tab: RequestType) => {
    setActiveTab(tab)
    if (tab !== 'warehouse') {
      setIsCreateOpen(false)
    }
    setPage(1)
  }

  const filtered = useMemo(
    () => requests.filter((item) => item.type === activeTab && item.status !== 'Đã giao'),
    [activeTab, requests],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  )

  const waitingCount = filtered.filter((r) => r.status === 'Chờ duyệt').length
  const urgentCount = filtered.filter((r) => r.priority === 'CAO').length
  const approvedToday = filtered.filter((r) => r.status === 'Đã duyệt').length

  const createRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!newRequest.source.trim() || !newRequest.sourceCode.trim() || !newRequest.productSummary.trim()) {
      return
    }

    const maxId = requests.reduce((max, item) => {
      const numeric = Number.parseInt(item.id.replace('RQ-', ''), 10)
      return Number.isNaN(numeric) ? max : Math.max(max, numeric)
    }, 0)

    const newItem: RequestItem = {
      uniqueId: `${Date.now()}`,  // Unique ID for React key
      id: `RQ-${maxId + 1}`,
      source: newRequest.source.trim(),
      sourceCode: newRequest.sourceCode.trim(),
      productSummary: newRequest.productSummary.trim(),
      priority: newRequest.priority,
      status: 'Chờ duyệt',
      createdAt: new Date().toLocaleDateString('vi-VN'),
      actionLabel: 'Duyệt',
      type: 'warehouse',
    }

    setRequests((prev) => [newItem, ...prev])
    setPage(1)
    setIsCreateOpen(false)
    setNewRequest({
      source: '',
      sourceCode: '',
      productSummary: '',
      priority: 'TRUNG BÌNH',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[#1d4b2c]">Quản lý Yêu cầu</h1>
          <p className="text-gray-500 mt-1">Theo dõi và xử lý các luồng hàng hóa luân chuyển</p>
        </div>
        {activeTab === 'warehouse' && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#f97316] text-white font-semibold hover:bg-[#ea580c] transition-colors"
          >
            <CirclePlus className="w-4 h-4" />
            Tạo yêu cầu mới
          </button>
        )}
      </div>

      <div className="border-b border-gray-200">
        <div className="flex items-center gap-8">
          <button
            onClick={() => onChangeTab('store')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'store'
                ? 'text-[#ea580c] border-[#ea580c]'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Yêu cầu từ Cửa hàng
            </span>
          </button>
          <button
            onClick={() => onChangeTab('warehouse')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'warehouse'
                ? 'text-[#ea580c] border-[#ea580c]'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Đơn yêu cầu 
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<ClipboardList className="w-5 h-5 text-[#f97316]" />}
          title="Tổng yêu cầu chờ"
          value={waitingCount}
          delta="+5%"
          deltaClass="text-emerald-600"
          iconBg="bg-orange-100"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
          title="Ưu tiên cao"
          value={urgentCount}
          delta="-2%"
          deltaClass="text-red-500"
          iconBg="bg-red-100"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          title="Đã duyệt hôm nay"
          value={approvedToday}
          delta="+10%"
          deltaClass="text-emerald-600"
          iconBg="bg-emerald-100"
        />
      </div>

      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">Danh sách yêu cầu gần đây</h2>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors inline-flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Bộ lọc
            </button>
            <button className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors inline-flex items-center gap-2">
              <Download className="w-4 h-4" />
              Xuất Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left">Mã yêu cầu</th>
                <th className="px-5 py-3 text-left">Cửa hàng / Nguồn</th>
                <th className="px-5 py-3 text-left">Sản phẩm</th>
                <th className="px-5 py-3 text-left">Độ ưu tiên</th>
                <th className="px-5 py-3 text-left">Trạng thái</th>
                <th className="px-5 py-3 text-left">Ngày tạo</th>
                <th className="px-5 py-3 text-left">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td className="px-5 py-8 text-center text-gray-500" colSpan={7}>
                    Chưa có yêu cầu nào trong mục này
                  </td>
                </tr>
              ) : (
                paged.map((row) => (
                  <tr key={row.uniqueId} className="border-t border-gray-100 hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-4 font-bold text-[#ea580c]">#{row.id}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-800">{row.source}</p>
                      <p className="text-xs text-gray-500">ID: {row.sourceCode}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{row.productSummary}</td>
                    <td className="px-5 py-4">{renderPriority(row.priority)}</td>
                    <td className="px-5 py-4">{renderStatus(row.status)}</td>
                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{row.createdAt}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button className={actionButtonClass(row.actionLabel)}>{row.actionLabel}</button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Hiển thị {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} trên {filtered.length} yêu cầu
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="w-8 h-8 rounded-md border border-gray-200 text-gray-500 disabled:opacity-40"
              disabled={page === 1}
            >
              {'<'}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`w-8 h-8 rounded-md text-sm font-semibold ${
                  page === num ? 'bg-[#f97316] text-white' : 'border border-gray-200 text-gray-600'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="w-8 h-8 rounded-md border border-gray-200 text-gray-500 disabled:opacity-40"
              disabled={page === totalPages}
            >
              {'>'}
            </button>
          </div>
        </div>
      </section>

      {activeTab === 'warehouse' && isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/25 p-4 pt-20">
          <section className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Đơn yêu cầu</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={createRequest} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm text-gray-600">
                Nguồn yêu cầu
                <input
                  value={newRequest.source}
                  onChange={(e) => setNewRequest((prev) => ({ ...prev, source: e.target.value }))}
                  placeholder="Ví dụ: Kho Tổng Miền Nam"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  required
                />
              </label>
              <label className="text-sm text-gray-600">
                Mã nguồn
                <input
                  value={newRequest.sourceCode}
                  onChange={(e) => setNewRequest((prev) => ({ ...prev, sourceCode: e.target.value }))}
                  placeholder="Ví dụ: WH-010"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  required
                />
              </label>
              <label className="text-sm text-gray-600 md:col-span-2">
                Sản phẩm / nội dung yêu cầu
                <textarea
                  value={newRequest.productSummary}
                  onChange={(e) => setNewRequest((prev) => ({ ...prev, productSummary: e.target.value }))}
                  placeholder="Ví dụ: Điều phối rau củ (10 mặt hàng)"
                  rows={4}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-200 resize-y"
                  required
                />
              </label>
              <label className="text-sm text-gray-600">
                Độ ưu tiên
                <select
                  value={newRequest.priority}
                  onChange={(e) =>
                    setNewRequest((prev) => ({ ...prev, priority: e.target.value as RequestPriority }))
                  }
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
                >
                  <option value="CAO">CAO</option>
                  <option value="TRUNG BÌNH">TRUNG BÌNH</option>
                  <option value="THẤP">THẤP</option>
                </select>
              </label>
              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#f97316] text-white font-semibold hover:bg-[#ea580c]"
                >
                  Lưu yêu cầu
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  title,
  value,
  delta,
  deltaClass,
  iconBg,
}: {
  icon: React.ReactNode
  title: string
  value: number
  delta: string
  deltaClass: string
  iconBg: string
}) {
  return (
    <article className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>{icon}</div>
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-4xl font-bold text-gray-900 leading-none">{value}</p>
            <span className={`text-sm font-semibold ${deltaClass}`}>{delta}</span>
          </div>
        </div>
      </div>
    </article>
  )
}

function renderPriority(priority: RequestPriority) {
  if (priority === 'CAO') {
    return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">CAO</span>
  }

  if (priority === 'THẤP') {
    return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">THẤP</span>
  }

  return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-600">TRUNG BÌNH</span>
}

function renderStatus(status: RequestStatus) {
  if (status === 'Chờ duyệt') {
    return <span className="text-[#f97316] font-semibold">• Chờ duyệt</span>
  }

  if (status === 'Đang xử lý') {
    return <span className="text-blue-600 font-semibold">• Đang xử lý</span>
  }

  if (status === 'Đã giao') {
    return <span className="text-emerald-600 font-semibold">• Đã giao</span>
  }

  return <span className="text-purple-600 font-semibold">• Đã duyệt</span>
}

function actionButtonClass(label: string) {
  if (label === 'Duyệt') {
    return 'px-3 py-1.5 rounded-lg bg-[#f97316] text-white text-xs font-semibold hover:bg-[#ea580c] transition-colors'
  }

  return 'px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-semibold'
}
