'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Search,
  PackagePlus,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Eye,
  X,
  PackageCheck,
} from 'lucide-react'
import CreateRestockRequestForm from './create-form'
import { useAuthStore } from '@/store/auth.store'
import { RestockAPIService, RestockRequestFromAPI } from '@/services/restock-api.service'
import { ProductAPIService } from '@/services/product-api.service'
import { UserAPIService } from '@/services/user-api.service'

// ─── Types ────────────────────────────────────────────────────────────────────
type RequestStatus = 'Đã duyệt' | 'Chờ duyệt' | 'Từ chối' | 'Đã hoàn thành'

interface PurchaseRequest {
  id: string
  product: string
  sku: string
  quantity: number
  unit: string
  reason: string
  requestedBy: string
  date: string
  status: RequestStatus
  note?: string
}

function mapStatus(status: string): RequestStatus {
  if (status === 'APPROVED') return 'Đã duyệt'
  if (status === 'REJECTED') return 'Từ chối'
  if (status === 'COMPLETED') return 'Đã hoàn thành'
  return 'Chờ duyệt'
}

function mapToRows(req: RestockRequestFromAPI, productMap: Record<string, string>, userMap: Record<string, string>): PurchaseRequest[] {
  // If no items, create one row with request-level info
  if (!req.items || req.items.length === 0) {
    const userName = userMap[req.requestedBy] || req.requestedBy || '--'
    return [{
      id: req.requestNumber || req.id,
      product: 'Không có sản phẩm',
      sku: '--',
      quantity: 0,
      unit: '',
      reason: '--',
      requestedBy: userName,
      date: req.requestedDate ? new Date(req.requestedDate).toLocaleDateString('vi-VN') : '--/--/----',
      status: mapStatus(req.status),
      note: req.notes || undefined,
    }]
  }

  // Create one row per item, each with the request number but different product details
  return req.items.map((item, idx) => {
    const productName = item.productName || productMap[item.productId] || '--'
    const userName = userMap[req.requestedBy] || req.requestedBy || '--'
    
    return {
      id: req.requestNumber || req.id,
      product: productName,
      sku: item.productId || '--',
      quantity: item.requestedQuantity || 0,
      unit: item.unit || '',
      reason: item.reason || '--',
      requestedBy: userName,
      date: req.requestedDate ? new Date(req.requestedDate).toLocaleDateString('vi-VN') : '--/--/----',
      status: mapStatus(req.status),
      note: idx === 0 && req.notes ? req.notes : undefined,
    }
  })
}

const STATUS_OPTS: RequestStatus[] = ['Đã duyệt', 'Chờ duyệt', 'Từ chối', 'Đã hoàn thành']

const statusConfig: Record<RequestStatus, { icon: React.ReactNode; cls: string }> = {
  'Đã duyệt':       { icon: <CheckCircle size={12} />,  cls: 'bg-green-50 text-green-700' },
  'Chờ duyệt':      { icon: <Clock size={12} />,        cls: 'bg-blue-50 text-blue-700' },
  'Từ chối':        { icon: <XCircle size={12} />,      cls: 'bg-red-50 text-red-600' },
  'Đã hoàn thành':  { icon: <PackageCheck size={12} />, cls: 'bg-purple-50 text-purple-700' },
}

const PAGE_SIZE = 10

// ─── Detail modal ─────────────────────────────────────────────────────────────
function DetailModal({ req, onClose }: { req: PurchaseRequest; onClose: () => void }) {
  const sc = statusConfig[req.status]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-[15px] font-bold text-gray-900">Chi tiết yêu cầu</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3 text-[13px]">
          <Row label="Mã yêu cầu"   value={<span className="font-mono font-semibold text-gray-800">{req.id}</span>} />
          <Row label="Sản phẩm"     value={req.product} />
          <Row label="SKU"          value={<span className="font-mono text-gray-600">{req.sku}</span>} />
          <Row label="Số lượng"     value={`${req.quantity} ${req.unit}`} />
          <Row label="Lý do"        value={req.reason} />
          <Row label="Người yêu cầu" value={req.requestedBy} />
          <Row label="Ngày tạo"     value={req.date} />
          {req.note && <Row label="Ghi chú" value={<span className="text-gray-500 italic">{req.note}</span>} />}
          <Row
            label="Trạng thái"
            value={
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.cls}`}>
                {sc.icon} {req.status}
              </span>
            }
          />
        </div>
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[13px] transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium text-right max-w-[60%]">{value}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PurchaseRequestsPage() {
  const user = useAuthStore((s) => s.user)
  const [requests, setRequests]       = useState<PurchaseRequest[]>([])
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatus]     = useState<string>('Tất cả')
  const [page, setPage]               = useState(1)
  const [selected, setSelected]       = useState<PurchaseRequest | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [loadError, setLoadError]     = useState<string | null>(null)

  const todayStr = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError(null)

      // Load products to map productId → name
      const productMap: Record<string, string> = {}
      try {
        const products = await ProductAPIService.getAllProducts()
        for (const p of products) {
          productMap[p.id] = p.name
        }
      } catch {
        // If products can't be loaded, continue without mapping
      }

      // Load users to map userId → userName (try both local and IAM)
      const userMap: Record<string, string> = {}
      
      // Try local users first
      try {
        const users = await UserAPIService.getAll()
        for (const u of users) {
          const userName = u.full_name || u.fullName || u.name || u.email || u.id
          userMap[u.id] = userName
        }
      } catch {
        // If users can't be loaded, continue without mapping
      }

      // Always try IAM users to fill in missing entries
      try {
        const iamUsers = await UserAPIService.getIamUsersList()
        for (const u of iamUsers) {
          // Only add if not already in map
          if (!userMap[u.id]) {
            const userName = u.full_name || u.fullName || u.name || u.email || u.id
            userMap[u.id] = userName
          }
        }
      } catch {
        // If IAM users can't be loaded, continue
      }

      const warehouseId = user?.workplaceId ?? user?.storeId ?? user?.warehouseId ?? ''
      if (!warehouseId) {
        setRequests([])
        setLoadError('Không xác định được warehouseId của tài khoản để tải dữ liệu.')
        return
      }

      // Match BE behavior exactly: GET /api/restock-requests/by-warehouse/{warehouseId}
      const byWarehouse = await RestockAPIService.getByWarehouse(warehouseId)

      // Safety merge: some environments return fewer items from one endpoint.
      // If getAll is allowed, merge same-warehouse rows and de-duplicate by id.
      let merged = byWarehouse
      try {
        const all = await RestockAPIService.getAll()
        const wid = warehouseId.toLowerCase()
        const sameWarehouse = all.filter((r) => {
          const toVal = (r.toWarehouseId || '').toLowerCase()
          const fromVal = (r.fromWarehouseId || '').toLowerCase()
          return toVal === wid || fromVal === wid
        })
        const byId = new Map<string, RestockRequestFromAPI>()
        for (const r of byWarehouse) byId.set(r.id, r)
        for (const r of sameWarehouse) byId.set(r.id, r)
        merged = Array.from(byId.values())
      } catch {
        // Ignore if getAll is forbidden for current role.
      }

      setRequests(merged.flatMap((req) => mapToRows(req, productMap, userMap)))
      setPage(1)
    } catch (error: any) {
      setRequests([])
      setLoadError(error?.response?.data?.message || 'Không tải được danh sách yêu cầu nhập hàng')
    } finally {
      setLoading(false)
    }
  }, [user?.warehouseId, user?.workplaceId, user?.storeId])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const filtered = useMemo(() => {
    let list = requests
    if (statusFilter !== 'Tất cả') list = list.filter((r) => r.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) => r.id.toLowerCase().includes(q) || r.product.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q),
      )
    }
    return list
  }, [requests, search, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const stats = useMemo(() => ({
    total:     requests.length,
    approved:  requests.filter((r) => r.status === 'Đã duyệt').length,
    pending:   requests.filter((r) => r.status === 'Chờ duyệt').length,
    rejected:  requests.filter((r) => r.status === 'Từ chối').length,
    completed: requests.filter((r) => r.status === 'Đã hoàn thành').length,
  }), [requests])

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <PackagePlus size={20} className="text-emerald-600" />
            Yêu cầu nhập hàng
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Theo dõi và quản lý các yêu cầu bổ sung hàng hóa</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 text-[13px] font-medium text-white bg-emerald-600 px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={15} />
          Tạo yêu cầu mới
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Tổng yêu cầu',   value: stats.total,     cls: 'text-gray-800' },
          { label: 'Đã duyệt',       value: stats.approved,  cls: 'text-green-700' },
          { label: 'Chờ duyệt',      value: stats.pending,   cls: 'text-blue-600' },
          { label: 'Từ chối',        value: stats.rejected,  cls: 'text-red-500' },
          { label: 'Đã hoàn thành',  value: stats.completed, cls: 'text-purple-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm mã yêu cầu, sản phẩm, SKU..."
            className="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all"
          />
        </div>
        {/* Status filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['Tất cả', ...STATUS_OPTS].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto text-[12px] text-gray-500">
          <Calendar size={13} />
          <span>Hôm nay: {todayStr}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loadError && (
          <div className="px-4 py-3 text-[12px] text-red-600 bg-red-50 border-b border-red-100">
            {loadError}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Mã YC', 'Sản phẩm', 'Số lượng', 'Lý do', 'Người YC', 'Ngày tạo', 'Trạng thái', ''].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 text-[13px]">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 text-[13px]">
                    Không tìm thấy yêu cầu nào
                  </td>
                </tr>
              ) : (
                paged.map((req, idx) => {
                  const sc = statusConfig[req.status]
                  return (
                    <tr
                      key={req.id}
                      className={`border-t border-gray-50 hover:bg-emerald-50/20 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/20' : ''}`}
                    >
                      <td className="py-3 px-4 font-mono text-[12px] font-semibold text-gray-600">{req.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800">{req.product}</div>
                        <div className="text-[11px] text-gray-400">{req.sku}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-700">{req.quantity} <span className="font-normal text-gray-400 text-[11px]">{req.unit}</span></td>
                      <td className="py-3 px-4 text-gray-500">{req.reason}</td>
                      <td className="py-3 px-4 text-gray-600">{req.requestedBy}</td>
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{req.date}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.cls}`}>
                          {sc.icon} {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelected(req)}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={15} />
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-[12px] text-gray-500">
            Hiển thị {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} yêu cầu
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-colors ${
                  p === page ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {selected && <DetailModal req={selected} onClose={() => setSelected(null)} />}

      {showCreateForm && (
        <CreateRestockRequestForm
          onClose={() => setShowCreateForm(false)}
          onCreated={() => {
            setShowCreateForm(false)
            loadRequests()
          }}
        />
      )}
    </div>
  )
}
