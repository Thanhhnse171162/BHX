'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CirclePlus,
  Download,
  Eye,
  Filter,
  ClipboardList,
  Truck,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
  Package,
  Trash2,
  Loader2,
  ChevronDown,
  Warehouse,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { RestockAPIService, RestockRequestFromAPI, CreateRestockRequestDTO } from '@/services/restock-api.service'
import { ProductAPIService } from '@/services/product-api.service'
import { ProductBatchAPIService, type ProductBatchFromAPI } from '@/services/product-batch-api.service'
import { InventoryAPIService } from '@/services/inventory-api.service'
import { UserAPIService } from '@/services/user-api.service'
import { TransferAPIService, TransferFromAPI } from '@/services/transfer-api.service'
import { createInventoryCheck, getInventoryChecks, type CreateInventoryCheckDto, type InventoryCheckListDto } from '@/services/inventory-check-api'
import { ToastContainer, type ToastItem } from '@/shared/ui/Toast'

type RequestPriority = 'CAO' | 'TRUNG BÌNH' | 'THẤP'
type RequestStatus = 'Chờ duyệt' | 'Đang xử lý' | 'Đã giao' | 'Đã duyệt' | 'Từ chối'
type RequestType = 'store' | 'warehouse' | 'incoming-transfer' | 'inventory-check'

interface RequestItem {
  id: string
  uniqueId: string
  source: string
  sourceCode: string
  productSummary: string
  priority: RequestPriority
  status: RequestStatus
  createdAt: string
  actionLabel: string
  type: RequestType
}

interface WarehouseOption {
  id: string
  name: string
  parentId?: string | null
  parent_id?: string | null
}

interface ProductOption {
  id: string
  sku: string
  name: string
  unit: string
}

interface FormItem {
  productId: string
  productName: string
  productSku: string
  productUnit: string
  requestedQuantity: string
  currentQuantity: number
  reason: string
}

const ITEM_REASONS = ['Hết hàng', 'Sắp hết', 'Điều phối', 'Khác']

function normalizeId(value?: string | null): string {
  return String(value ?? '').trim().toLowerCase()
}

function toValidRequestedQuantity(value: string): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return Math.floor(parsed)
}

const PAGE_SIZE = 4

type IncomingTransferUIStatusKey =
  | 'CHO_DUYET'
  | 'DANG_VAN_CHUYEN'
  | 'HOAN_THANH'
  | 'DA_HUY'
  | 'TU_CHOI'
  | 'KHAC'

function normalizeApiStatus(value?: string | null) {
  return String(value ?? '').trim().toUpperCase()
}

function formatDateVI(value?: string | null) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('vi-VN')
}

function sumExpectedQty(t: TransferFromAPI) {
  const items = Array.isArray(t.items) ? t.items : []
  return items.reduce((sum, it) => {
    const shipped = Number(it.shippedQuantity ?? 0)
    const requested = Number(it.requestedQuantity ?? 0)
    return sum + (shipped > 0 ? shipped : requested)
  }, 0)
}

function sumReceivedQty(t: TransferFromAPI) {
  const items = Array.isArray(t.items) ? t.items : []
  return items.reduce((sum, it) => sum + Number(it.receivedQuantity ?? 0), 0)
}

function getIncomingTransferUIStatus(apiStatus: string): {
  key: IncomingTransferUIStatusKey
  label: string
  cls: string
} {
  const s = normalizeApiStatus(apiStatus)

  if (s === 'PENDING') {
    return {
      key: 'CHO_DUYET',
      label: 'Chờ duyệt',
      cls: 'bg-amber-50 text-amber-700 border-amber-200',
    }
  }

  if (s === 'IN_TRANSIT' || s === 'SHIPPED') {
    return {
      key: 'DANG_VAN_CHUYEN',
      label: 'Đang vận chuyển',
      cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    }
  }

  if (s === 'DELIVERED') {
    return {
      key: 'CHO_DUYET',
      label: 'Chờ duyệt',
      cls: 'bg-amber-50 text-amber-700 border-amber-200',
    }
  }

  if (s === 'COMPLETED') {
    return {
      key: 'HOAN_THANH',
      label: 'Hoàn thành',
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    }
  }

  if (s === 'CANCELLED') {
    return {
      key: 'DA_HUY',
      label: 'Đã hủy',
      cls: 'bg-gray-50 text-gray-600 border-gray-200',
    }
  }

  if (s === 'REJECTED') {
    return {
      key: 'TU_CHOI',
      label: 'Từ chối',
      cls: 'bg-red-50 text-red-700 border-red-200',
    }
  }

  return {
    key: 'KHAC',
    label: s || '—',
    cls: 'bg-slate-50 text-slate-600 border-slate-200',
  }
}

export default function WarehouseManagerRequestsPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [activeTab, setActiveTab] = useState<RequestType>('store')
  const [page, setPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newRequest, setNewRequest] = useState({
    toWarehouseId: '',
    notes: '',
    priority: 'TRUNG BÌNH' as RequestPriority,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [locations, setLocations] = useState<WarehouseOption[]>([])
  const [productsForItems, setProductsForItems] = useState<ProductOption[]>([])
  const [items, setItems] = useState<FormItem[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [batchesById, setBatchesById] = useState<Record<string, ProductBatchFromAPI>>({})
  const [batchesLoading, setBatchesLoading] = useState(false)
  const [availableQtyByProductId, setAvailableQtyByProductId] = useState<Record<string, number>>({})

  // Dùng chung logic với loadRequests() để tránh lệch id "kho" theo dữ liệu user.
  const currentWarehouseId = String(user?.warehouseId ?? user?.storeId ?? user?.workplaceId ?? '').trim()
  const normalizedCurrentWarehouseId = currentWarehouseId.toLowerCase()
  const [incomingTransfers, setIncomingTransfers] = useState<TransferFromAPI[]>([])
  const [incomingLoading, setIncomingLoading] = useState(false)
  const [incomingError, setIncomingError] = useState<string | null>(null)
  const [incomingDebug, setIncomingDebug] = useState<{ total: number; toThisWarehouse: number; visible: number } | null>(null)
  const [incomingSearch, setIncomingSearch] = useState('')
  const [incomingStatusFilter, setIncomingStatusFilter] = useState<'ALL' | IncomingTransferUIStatusKey>('ALL')
  const [incomingFromDate, setIncomingFromDate] = useState('')
  const [incomingToDate, setIncomingToDate] = useState('')
  const [incomingPage, setIncomingPage] = useState(1)
  const [selectedIncoming, setSelectedIncoming] = useState<TransferFromAPI | null>(null)
  const [incomingDetailLoadingId, setIncomingDetailLoadingId] = useState<string | null>(null)

  // Action states for approve/reject
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const pushToast = useCallback((toast: Omit<ToastItem, 'id' | 'onClose'>) => {
    setToasts((prev) => [{ ...toast, onClose: () => {}, id: `${Date.now()}-${Math.random()}` }, ...prev].slice(0, 3))
  }, [])
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Inventory Check Modal State
  const [isInventoryCheckModalOpen, setIsInventoryCheckModalOpen] = useState(false)
  const [newInventoryCheck, setNewInventoryCheck] = useState({
    locationType: 'WAREHOUSE' as 'STORE' | 'WAREHOUSE',
    locationId: '',
    checkType: 'PARTIAL' as 'PARTIAL' | 'FULL',
    notes: '',
  })
  const [isSubmittingInventoryCheck, setIsSubmittingInventoryCheck] = useState(false)
  const [submitInventoryCheckError, setSubmitInventoryCheckError] = useState<string | null>(null)

  // Inventory Check List State
  const [inventoryChecks, setInventoryChecks] = useState<InventoryCheckListDto[]>([])
  const [inventoryCheckLoading, setInventoryCheckLoading] = useState(false)
  const [inventoryCheckError, setInventoryCheckError] = useState<string | null>(null)
  const [inventoryCheckPage, setInventoryCheckPage] = useState(1)
  const [inventoryCheckSearch, setInventoryCheckSearch] = useState('')

  const loadRequests = useCallback(async () => {
    try {
      const warehouseId = user?.warehouseId ?? user?.storeId ?? user?.workplaceId ?? ''
      if (!warehouseId) {
        setRequests([])
        return
      }

      let productMap: Record<string, string> = {}
      try {
        const products = await ProductAPIService.getAllProducts()
        for (const p of products) {
          productMap[p.id] = p.name
        }
      } catch {}

      let userMap: Record<string, string> = {}
      const managerWorkplaceId = String(user?.workplaceId ?? '').trim()
      const managerWorkplaceKey = String(managerWorkplaceId ?? '').trim().toLowerCase()
      
      try {
        const users = await UserAPIService.getAll()
        // Filter để chỉ hiển thị staff mà manager hiện tại quản lý
        const managedStaff = users.filter((u) => {
          const roleName = String(u.role?.name || '').trim().toLowerCase()
          const userWorkplaceId = String(u.workplaceId ?? u.workplace_id ?? u.workplace?.id ?? '').trim().toLowerCase()
          const isActive = String(u.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
          
          // Chỉ lấy staff của kho này và đang ACTIVE
          return roleName === 'warehouse staff' && userWorkplaceId === managerWorkplaceKey && isActive
        })
        
        for (const u of managedStaff) {
          const userName = u.full_name || u.fullName || u.name || u.email || u.id
          userMap[u.id] = userName
        }
      } catch {}

      // Tab "Yêu cầu từ Cửa hàng" - GET /api/restock-requests/by-parent-warehouse/{parentWarehouseId}
      let storeRequests: RestockRequestFromAPI[] = []
      try {
        storeRequests = await RestockAPIService.getByParentWarehouse(warehouseId)
        console.log('📦 warehouse-manager: Store requests (by-parent-warehouse) loaded:', storeRequests.length)
      } catch {
        console.log('📦 warehouse-manager: Failed to load store requests')
        storeRequests = []
      }

      // Tab "Đơn yêu cầu" - GET /api/restock-requests/by-warehouse/{warehouseId}
      let warehouseRequests: RestockRequestFromAPI[] = []
      try {
        warehouseRequests = await RestockAPIService.getByWarehouse(warehouseId)
        console.log('📦 warehouse-manager: Warehouse requests (by-warehouse) loaded:', warehouseRequests.length)
      } catch {
        console.log('📦 warehouse-manager: Failed to load warehouse requests')
        warehouseRequests = []
      }

      const storeItems: RequestItem[] = storeRequests
        .filter((req) => String(req.fromWarehouseId ?? '').trim().toLowerCase() === String(warehouseId ?? '').trim().toLowerCase())
        .map((req) => {
          const productNames = req.items?.map((item) => item.productName || productMap[item.productId] || '--').join(', ') || '--'
          const userName = userMap[req.requestedBy] || req.requestedBy || '--'
          const createdAtDate = req.requestedDate ? new Date(req.requestedDate).toLocaleDateString('vi-VN') : '--/--/----'

          return {
            uniqueId: req.id,
            id: req.requestNumber || req.id,
            source: userName,
            sourceCode: req.toWarehouseId || '--',
            productSummary: productNames,
            priority: req.priority === 'URGENT' ? 'CAO' : req.priority === 'HIGH' ? 'TRUNG BÌNH' : 'THẤP',
            status: mapStatus(req.status),
            createdAt: createdAtDate,
            actionLabel: req.status === 'APPROVED' ? 'Đã duyệt' : 'Duyệt',
            type: 'store',
          }
        })

      const warehouseItems: RequestItem[] = warehouseRequests
        .filter((req) => String(req.fromWarehouseId ?? '').trim().toLowerCase() === String(warehouseId ?? '').trim().toLowerCase())
        .map((req) => {
          const productNames = req.items?.map((item) => item.productName || productMap[item.productId] || '--').join(', ') || '--'
          const userName = userMap[req.requestedBy] || req.requestedBy || '--'
          const createdAtDate = req.requestedDate ? new Date(req.requestedDate).toLocaleDateString('vi-VN') : '--/--/----'

          return {
            uniqueId: `wh-${req.id}`,
            id: req.requestNumber || req.id,
            source: userName,
            sourceCode: req.toWarehouseId || '--',
            productSummary: productNames,
            priority: req.priority === 'URGENT' ? 'CAO' : req.priority === 'HIGH' ? 'TRUNG BÌNH' : 'THẤP',
            status: mapStatus(req.status),
            createdAt: createdAtDate,
            actionLabel: req.status === 'APPROVED' ? 'Đã duyệt' : 'Duyệt',
            type: 'warehouse',
          }
        })

      setRequests([...storeItems, ...warehouseItems])
      setPage(1)
    } catch {
      setRequests([])
    }
  }, [user?.warehouseId, user?.storeId, user?.workplaceId])

  const loadIncomingTransfers = useCallback(async () => {
    if (!normalizedCurrentWarehouseId) {
      setIncomingTransfers([])
      setIncomingDebug(null)
      return
    }

    setIncomingLoading(true)
    setIncomingError(null)
    try {
      const data = await TransferAPIService.getTransfers()
      const all = Array.isArray(data) ? data : []

      const toThisWarehouse = all.filter(
        (t) => String(t.toLocationId ?? '').trim().toLowerCase() === normalizedCurrentWarehouseId,
      )

      // Manager chỉ xem đơn vận chuyển đến kho của mình (không cần xác nhận).
      // Vì vậy hiển thị theo cơ sở "đến kho" và để bộ lọc bên dưới phân loại theo trạng thái.
      const filtered = toThisWarehouse

      setIncomingTransfers(filtered)
      setIncomingDebug({ total: all.length, toThisWarehouse: toThisWarehouse.length, visible: filtered.length })
      setIncomingPage(1)
    } catch (err: unknown) {
      setIncomingError(err instanceof Error ? err.message : 'Không thể tải danh sách đơn vận chuyển đến.')
      setIncomingTransfers([])
      setIncomingDebug(null)
    } finally {
      setIncomingLoading(false)
    }
  }, [normalizedCurrentWarehouseId])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  useEffect(() => {
    loadIncomingTransfers()
  }, [loadIncomingTransfers])

  useEffect(() => {
    setLoadingLocations(true)
    fetch('/api/warehouses', {
      headers: { Authorization: `Bearer ${useAuthStore.getState().token ?? ''}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
        setLocations(
          raw.map((w: any) => ({
            id: w.id,
            name: w.name ?? w.code ?? w.id,
            parentId: w.parentId ?? w.parent_id ?? null,
            parent_id: w.parent_id ?? w.parentId ?? null,
          })),
        )
      })
      .catch(() => setLocations([]))
      .finally(() => setLoadingLocations(false))
  }, [])

  useEffect(() => {
    setLoadingProducts(true)
    fetch('/api/products', {
      headers: { Authorization: `Bearer ${useAuthStore.getState().token ?? ''}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
        setProductsForItems(
          raw.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            unit: p.unit ?? 'cái',
          })),
        )
      })
      .catch(() => setProductsForItems([]))
      .finally(() => setLoadingProducts(false))
  }, [])

  useEffect(() => {
    // Map batchId -> batchNumber để hiển thị tên lô thay vì id.
    if (!currentWarehouseId) {
      setBatchesById({})
      return
    }
    setBatchesLoading(true)
    ProductBatchAPIService.getByWarehouse(currentWarehouseId)
      .then((batches) => {
        const map: Record<string, ProductBatchFromAPI> = {}
        for (const b of batches) map[String(b.id)] = b
        setBatchesById(map)
      })
      .catch(() => setBatchesById({}))
      .finally(() => setBatchesLoading(false))
  }, [currentWarehouseId])

  const fromWarehouseIdForForm = user?.warehouseId ?? user?.workplaceId ?? ''
  const normalizedFromId = normalizeId(fromWarehouseIdForForm)

  const currentWarehouseRecord = locations.find(
    (loc) => normalizeId(loc.id) === normalizedFromId,
  )

  const managedChildren = locations.filter(
    (loc) => normalizeId(loc.parentId ?? loc.parent_id) === normalizedFromId,
  )
  const parentWarehouse =
    currentWarehouseRecord &&
    locations.find(
      (loc) => normalizeId(loc.id) === normalizeId(currentWarehouseRecord.parentId ?? currentWarehouseRecord.parent_id),
    )

  // Display parent warehouse as source, not current warehouse
  const fromWarehouseDisplayName =
    parentWarehouse?.name ??
    currentWarehouseRecord?.name ??
    fromWarehouseIdForForm

  // "Số lượng hiện tại" trong form cần phản ánh tồn của kho/cửa hàng đích hiện tại
  // (kho mà manager đang quản lý), không phải kho tổng.
  const destinationWarehouseIdForStock =
    currentWarehouseRecord?.id ?? fromWarehouseIdForForm

  useEffect(() => {
    if (!isCreateOpen || !destinationWarehouseIdForStock) {
      setAvailableQtyByProductId({})
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const rows = await InventoryAPIService.getInventoryByWarehouse(destinationWarehouseIdForStock)
        if (cancelled) return
        const nextMap: Record<string, number> = {}
        for (const row of rows ?? []) {
          const productKey = normalizeId(row.productId)
          if (!productKey) continue
          const available = Number(row.availableQuantity ?? row.quantity ?? 0)
          nextMap[productKey] = Math.max(0, available)
        }
        setAvailableQtyByProductId(nextMap)
      } catch {
        if (!cancelled) setAvailableQtyByProductId({})
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isCreateOpen, destinationWarehouseIdForStock])

  useEffect(() => {
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        currentQuantity: availableQtyByProductId[normalizeId(it.productId)] ?? 0,
      })),
    )
  }, [availableQtyByProductId])

  function mapStatus(status: string): RequestStatus {
    if (status === 'APPROVED') return 'Đã duyệt'
    if (status === 'COMPLETED') return 'Đã giao'
    if (status === 'PROCESSING') return 'Đang xử lý'
    if (status === 'REJECTED') return 'Từ chối'
    return 'Chờ duyệt'
  }

  const onChangeTab = (tab: RequestType) => {
    setActiveTab(tab)
    if (tab !== 'warehouse') {
      setIsCreateOpen(false)
    }
    setPage(1)
    setIncomingPage(1)
  }

  const filtered = useMemo(
    () =>
      requests.filter(
        (item) => item.type === activeTab && (activeTab === 'warehouse' || item.status !== 'Đã giao')
      ),
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

  const incomingTransferRequestLabel = useCallback((t: TransferFromAPI) => {
    const id = String(t.restockRequestId ?? '').trim()
    if (!id) return { code: '—', sub: '' }
    const matched = requests.find((r) => String((r as any)?.uniqueId ?? '').toLowerCase() === id.toLowerCase())
    const code = matched?.id ? `#${matched.id}` : `#${id.slice(0, 8)}…`
    const sub = matched?.source ? matched.source : ''
    return { code, sub }
  }, [requests])

  const incomingDerived = useMemo(() => {
    const q = incomingSearch.trim().toLowerCase()
    const from = incomingFromDate ? new Date(incomingFromDate) : null
    const to = incomingToDate ? new Date(incomingToDate) : null

    const rows = incomingTransfers
      .filter((t) => {
        if (!q) return true
        const code = String(t.transferNumber ?? '').toLowerCase()
        const req = String(t.restockRequestId ?? '').toLowerCase()
        return code.includes(q) || req.includes(q)
      })
      .filter((t) => {
        if (incomingStatusFilter === 'ALL') return true
        const ui = getIncomingTransferUIStatus(t.status)
        return ui.key === incomingStatusFilter
      })
      .filter((t) => {
        if (!from && !to) return true
        const d = new Date(t.transferDate)
        if (Number.isNaN(d.getTime())) return true
        if (from && d < from) return false
        if (to) {
          const end = new Date(to)
          end.setHours(23, 59, 59, 999)
          if (d > end) return false
        }
        return true
      })

    const totalPages = Math.max(1, Math.ceil(rows.length / 10))
    const safePage = Math.min(incomingPage, totalPages)
    const paged = rows.slice((safePage - 1) * 10, safePage * 10)

    return { rows, paged, totalPages, page: safePage }
  }, [incomingTransfers, incomingSearch, incomingStatusFilter, incomingFromDate, incomingToDate, incomingPage])

  const getLocationName = useCallback((id?: string | null) => {
    const key = String(id ?? '').trim().toLowerCase()
    if (!key) return '—'
    const loc = locations.find((l) => normalizeId(l.id) === key)
    return loc?.name ?? String(id).slice(-8)
  }, [locations])

  const handleViewIncoming = useCallback(
    async (t: TransferFromAPI) => {
      setIncomingDetailLoadingId(t.id)
      try {
        // Lấy chi tiết theo BE endpoint GET /api/Transfer/transfer/{id}
        const detail = await TransferAPIService.getById(t.id)
        setSelectedIncoming(detail)
      } catch (err: unknown) {
        pushToast({
          type: 'error',
          message: err instanceof Error ? err.message : 'Không thể tải chi tiết đơn vận chuyển.',
        })
      } finally {
        setIncomingDetailLoadingId(null)
      }
    },
    [pushToast],
  )

  const handleApproveRequest = useCallback(
    async (requestId: string) => {
      setActionLoadingId(requestId)
      setActionType('approve')
      try {
        await RestockAPIService.approve(requestId)
        pushToast({
          type: 'success',
          message: 'Duyệt yêu cầu thành công!',
        })
        await loadRequests()
      } catch (err: unknown) {
        pushToast({
          type: 'error',
          message: err instanceof Error ? err.message : 'Duyệt yêu cầu thất bại.',
        })
      } finally {
        setActionLoadingId(null)
        setActionType(null)
      }
    },
    [pushToast, loadRequests],
  )

  const handleRejectRequest = useCallback(
    async (requestId: string) => {
      const reason = String(window.prompt('Nhập lý do từ chối:') ?? '').trim()
      if (!reason) {
        pushToast({
          type: 'error',
          message: 'Vui lòng nhập lý do từ chối.',
        })
        return
      }

      setActionLoadingId(requestId)
      setActionType('reject')
      try {
        await RestockAPIService.reject(requestId, reason)
        pushToast({
          type: 'success',
          message: 'Từ chối yêu cầu thành công!',
        })
        await loadRequests()
      } catch (err: unknown) {
        pushToast({
          type: 'error',
          message: err instanceof Error ? err.message : 'Từ chối yêu cầu thất bại.',
        })
      } finally {
        setActionLoadingId(null)
        setActionType(null)
      }
    },
    [pushToast, loadRequests],
  )

  const handleCreateInventoryCheck = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setSubmitInventoryCheckError(null)

      if (!newInventoryCheck.locationId) {
        setSubmitInventoryCheckError('Vui lòng chọn kho/cửa hàng')
        return
      }

      const dto: CreateInventoryCheckDto = {
        locationType: newInventoryCheck.locationType,
        locationId: newInventoryCheck.locationId,
        checkType: newInventoryCheck.checkType,
        notes: newInventoryCheck.notes.trim() || undefined,
      }

      try {
        setIsSubmittingInventoryCheck(true)
        await createInventoryCheck(dto)

        pushToast({
          type: 'success',
          message: 'Tạo phiếu kiểm kê thành công!',
        })
        setIsInventoryCheckModalOpen(false)
        setNewInventoryCheck({
          locationType: 'STORE',
          locationId: '',
          checkType: 'PARTIAL',
          notes: '',
        })
      } catch (error: any) {
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          'Tạo phiếu kiểm kê thất bại. Vui lòng thử lại.'
        setSubmitInventoryCheckError(msg)
      } finally {
        setIsSubmittingInventoryCheck(false)
      }
    },
    [newInventoryCheck, pushToast],
  )

  const loadInventoryChecks = useCallback(async () => {
    if (!normalizedCurrentWarehouseId) {
      setInventoryChecks([])
      return
    }
    
    setInventoryCheckLoading(true)
    setInventoryCheckError(null)
    try {
      const data = await getInventoryChecks()
      const allChecks = Array.isArray(data) ? data : []
      
      // Chỉ hiển thị phiếu kiểm kê của kho hiện tại
      const filteredChecks = allChecks.filter(
        (check) => String(check.locationId ?? '').trim().toLowerCase() === normalizedCurrentWarehouseId
      )
      
      setInventoryChecks(filteredChecks)
      setInventoryCheckPage(1)
    } catch (err: unknown) {
      setInventoryCheckError(err instanceof Error ? err.message : 'Không thể tải danh sách phiếu kiểm kê.')
      setInventoryChecks([])
    } finally {
      setInventoryCheckLoading(false)
    }
  }, [normalizedCurrentWarehouseId])

  useEffect(() => {
    if (activeTab === 'inventory-check') {
      loadInventoryChecks()
    }
  }, [activeTab, loadInventoryChecks])

  const addItemByProductId = (productId: string) => {
    if (!productId) return
    if (items.some((i) => i.productId === productId)) return
    const p = productsForItems.find((x) => x.id === productId)
    if (!p) return
    setItems((prev) => [
      ...prev,
      {
        productId: p.id,
        productName: p.name,
        productSku: p.sku,
        productUnit: p.unit,
        requestedQuantity: '',
        currentQuantity: availableQtyByProductId[normalizeId(p.id)] ?? 0,
        reason: '',
      },
    ])
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateItem = <K extends keyof FormItem>(index: number, key: K, value: FormItem[K]) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [key]: value } : it)))
  }

  const createRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)

    // Source should be parent warehouse, not current warehouse
    const fromWarehouseId = parentWarehouse?.id ?? ''
    if (!fromWarehouseId) {
      setSubmitError('Kho cha không tồn tại. Vui lòng kiểm tra cấu hình kho của bạn.')
      return
    }

    if (items.length === 0) {
      setSubmitError('Vui lòng thêm ít nhất 1 sản phẩm vào danh sách items.')
      return
    }

    for (const it of items) {
      const qty = toValidRequestedQuantity(it.requestedQuantity)
      if (qty <= 0) {
        setSubmitError(`Số lượng yêu cầu của "${it.productName}" phải lớn hơn 0.`)
        return
      }
    }

    const priorityMap: Record<RequestPriority, 'NORMAL' | 'HIGH' | 'URGENT'> = {
      'THẤP': 'NORMAL',
      'TRUNG BÌNH': 'HIGH',
      'CAO': 'URGENT',
    }

    const dto: CreateRestockRequestDTO = {
      fromWarehouseId,
      fromLocationType: 'WAREHOUSE',
      toWarehouseId: currentWarehouseRecord?.id ?? '',
      toLocationType: 'WAREHOUSE',
      priority: priorityMap[newRequest.priority],
      notes: newRequest.notes.trim() || undefined,
      items: items.map((it) => ({
        productId: it.productId,
        requestedQuantity: toValidRequestedQuantity(it.requestedQuantity),
        currentQuantity: it.currentQuantity,
        reason: it.reason.trim() || undefined,
      })),
    }

    try {
      setIsSubmitting(true)
      await RestockAPIService.create(dto)

      await loadRequests()
      setPage(1)
      setIsCreateOpen(false)
      setNewRequest({
        toWarehouseId: '',
        notes: '',
        priority: 'TRUNG BÌNH',
      })
      setItems([])
      if (destinationWarehouseIdForStock) {
        try {
          const rows = await InventoryAPIService.getInventoryByWarehouse(destinationWarehouseIdForStock)
          const nextMap: Record<string, number> = {}
          for (const row of rows ?? []) {
            const productKey = normalizeId(row.productId)
            if (!productKey) continue
            const available = Number(row.availableQuantity ?? row.quantity ?? 0)
            nextMap[productKey] = Math.max(0, available)
          }
          setAvailableQtyByProductId(nextMap)
        } catch {}
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Tạo yêu cầu thất bại. Vui lòng thử lại.'
      setSubmitError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[#1d4b2c]">Quản lý Yêu cầu</h1>
          <p className="text-gray-500 mt-1">Theo dõi và xử lý các luồng hàng hóa luân chuyển</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'warehouse' && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#f97316] text-white font-semibold hover:bg-[#ea580c] transition-colors"
            >
              <CirclePlus className="w-4 h-4" />
              Tạo yêu cầu mới
            </button>
          )}
          {activeTab === 'inventory-check' && (
            <button
              onClick={() => setIsInventoryCheckModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#059669] text-white font-semibold hover:bg-[#047857] transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Tạo phiếu kiểm kê
            </button>
          )}
        </div>
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
          <button
            onClick={() => onChangeTab('incoming-transfer')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'incoming-transfer'
                ? 'text-[#ea580c] border-[#ea580c]'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Kiểm tra giao hàng
            </span>
          </button>
          <button
            onClick={() => onChangeTab('inventory-check')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'inventory-check'
                ? 'text-[#ea580c] border-[#ea580c]'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Kiểm tra Inventory
            </span>
          </button>
        </div>
      </div>

      {activeTab !== 'inventory-check' && (
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
      )}

      {(activeTab === 'store' || activeTab === 'warehouse') && (
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
                        <p className="font-semibold text-gray-800">{getLocationName(row.sourceCode)}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-700">{row.productSummary}</td>
                      <td className="px-5 py-4">{renderPriority(row.priority)}</td>
                      <td className="px-5 py-4">{renderStatus(row.status)}</td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{row.createdAt}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {row.status === 'Chờ duyệt' && activeTab === 'store' ? (
                            <>
                              <button
                                onClick={() => handleApproveRequest(row.uniqueId)}
                                disabled={actionLoadingId === row.uniqueId}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-fit"
                              >
                                {actionLoadingId === row.uniqueId && actionType === 'approve' ? '...' : 'Duyệt'}
                              </button>
                              <button
                                onClick={() => handleRejectRequest(row.uniqueId)}
                                disabled={actionLoadingId === row.uniqueId}
                                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-fit"
                              >
                                {actionLoadingId === row.uniqueId && actionType === 'reject' ? '...' : 'Từ chối'}
                              </button>
                            </>
                          ) : (
                            <span className={actionButtonClass(row.actionLabel)}>{row.actionLabel}</span>
                          )}
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
      )}

      {activeTab === 'incoming-transfer' && (
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Danh sách đơn vận chuyển đến</h2>
              <p className="text-sm text-gray-500 mt-1">
                Chỉ hiển thị các đơn chuyển đến kho của bạn sau khi Warehouse Staff đã kiểm hàng.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadIncomingTransfers}
                className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors inline-flex items-center gap-2 disabled:opacity-60"
                disabled={incomingLoading}
              >
                {incomingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                Làm mới
              </button>
              <button className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors inline-flex items-center gap-2">
                <Download className="w-4 h-4" />
                Xuất Excel
              </button>
            </div>
          </div>

          <div className="px-5 py-4 border-b border-gray-100 bg-white">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={incomingSearch}
                  onChange={(e) => {
                    setIncomingSearch(e.target.value)
                    setIncomingPage(1)
                  }}
                  placeholder="Tìm mã vận chuyển hoặc mã yêu cầu..."
                  className="pl-9 pr-3 h-10 w-[320px] rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>

              <div className="relative">
                <select
                  value={incomingStatusFilter}
                  onChange={(e) => {
                    setIncomingStatusFilter(e.target.value as 'ALL' | IncomingTransferUIStatusKey)
                    setIncomingPage(1)
                  }}
                  className="h-10 px-3 pr-8 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 appearance-none"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="CHO_DUYET">Chờ duyệt</option>
                  <option value="DANG_VAN_CHUYEN">Đang vận chuyển</option>
                  <option value="HOAN_THANH">Hoàn thành</option>
                  <option value="DA_HUY">Đã hủy</option>
                  <option value="TU_CHOI">Từ chối</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={incomingFromDate}
                  onChange={(e) => {
                    setIncomingFromDate(e.target.value)
                    setIncomingPage(1)
                  }}
                  className="h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
                <span className="text-sm text-gray-400">—</span>
                <input
                  type="date"
                  value={incomingToDate}
                  onChange={(e) => {
                    setIncomingToDate(e.target.value)
                    setIncomingPage(1)
                  }}
                  className="h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>
            </div>

            {!currentWarehouseId && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Tài khoản chưa được gán kho hiện tại, không thể lọc đơn vận chuyển đến.
              </div>
            )}

            {incomingError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {incomingError}
              </div>
            )}

            {incomingDebug && (
              <div className="mt-3 text-xs text-gray-500">
                Debug: đã tải <span className="font-semibold text-gray-700">{incomingDebug.total}</span> đơn · đến kho hiện tại (
                <span className="font-mono text-gray-700">{currentWarehouseId || '—'}</span>):{' '}
                <span className="font-semibold text-gray-700">{incomingDebug.toThisWarehouse}</span> · hiển thị:{' '}
                <span className="font-semibold text-gray-700">{incomingDebug.visible}</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left">Mã vận chuyển</th>
                  <th className="px-5 py-3 text-left">Mã yêu cầu / Nguồn</th>
                  <th className="px-5 py-3 text-left">Từ kho</th>
                  <th className="px-5 py-3 text-left">Tổng SL</th>
                  <th className="px-5 py-3 text-left">SL thực nhận</th>
                  <th className="px-5 py-3 text-left">Ngày tạo</th>
                  <th className="px-5 py-3 text-left">Ngày nhận</th>
                  <th className="px-5 py-3 text-left">Trạng thái</th>
                  <th className="px-5 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {incomingLoading ? (
                  <tr>
                    <td className="px-5 py-12 text-center text-gray-500" colSpan={9}>
                      <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                      Đang tải danh sách...
                    </td>
                  </tr>
                ) : incomingDerived.paged.length === 0 ? (
                  <tr>
                    <td className="px-5 py-12 text-center text-gray-500" colSpan={9}>
                      Không có đơn vận chuyển đến phù hợp
                    </td>
                  </tr>
                ) : (
                  incomingDerived.paged.map((t) => {
                    const ui = getIncomingTransferUIStatus(t.status)
                    const totalExpected = sumExpectedQty(t)
                    const totalReceived = sumReceivedQty(t)
                    const req = incomingTransferRequestLabel(t)
                    const receivedAt = t.actualDelivery || (totalReceived > 0 ? t.expectedDelivery : null)

                    return (
                      <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-bold text-[#0f766e]">#{t.transferNumber || t.id}</p>
                          <p className="text-xs text-gray-500">{t.id.slice(0, 8)}…</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-800">{req.code}</p>
                          <p className="text-xs text-gray-500">{req.sub || `ID: ${(t.restockRequestId || '').slice(0, 8)}…`}</p>
                        </td>
                        <td className="px-5 py-4 text-gray-700">{getLocationName(t.fromLocationId)}</td>
                        <td className="px-5 py-4 text-gray-700 font-semibold">{totalExpected.toLocaleString()}</td>
                        <td className="px-5 py-4 text-gray-700 font-semibold">{totalReceived.toLocaleString()}</td>
                        <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{formatDateVI(t.transferDate)}</td>
                        <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{formatDateVI(receivedAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${ui.cls}`}>
                              {ui.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleViewIncoming(t)}
                            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Xem chi tiết"
                          >
                            {incomingDetailLoadingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Hiển thị {incomingDerived.rows.length === 0 ? 0 : (incomingDerived.page - 1) * 10 + 1}-
              {Math.min(incomingDerived.page * 10, incomingDerived.rows.length)} trên {incomingDerived.rows.length} đơn
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIncomingPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-md border border-gray-200 text-gray-500 disabled:opacity-40"
                disabled={incomingDerived.page === 1}
              >
                {'<'}
              </button>
              {Array.from({ length: incomingDerived.totalPages }, (_, i) => i + 1).slice(0, 7).map((num) => (
                <button
                  key={num}
                  onClick={() => setIncomingPage(num)}
                  className={`w-8 h-8 rounded-md text-sm font-semibold ${
                    incomingDerived.page === num ? 'bg-[#f97316] text-white' : 'border border-gray-200 text-gray-600'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setIncomingPage((p) => Math.min(incomingDerived.totalPages, p + 1))}
                className="w-8 h-8 rounded-md border border-gray-200 text-gray-500 disabled:opacity-40"
                disabled={incomingDerived.page === incomingDerived.totalPages}
              >
                {'>'}
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'inventory-check' && (
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Danh sách phiếu kiểm kê</h2>
              <p className="text-sm text-gray-500 mt-1">Quản lý các phiếu kiểm kê kho và cửa hàng</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadInventoryChecks}
                className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors inline-flex items-center gap-2 disabled:opacity-60"
                disabled={inventoryCheckLoading}
              >
                {inventoryCheckLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                Làm mới
              </button>
              <button className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors inline-flex items-center gap-2">
                <Download className="w-4 h-4" />
                Xuất Excel
              </button>
            </div>
          </div>

          {inventoryCheckError && (
            <div className="px-5 py-4 bg-red-50 border-b border-red-200">
              <div className="text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {inventoryCheckError}
              </div>
            </div>
          )}

          <div className="px-5 py-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={inventoryCheckSearch}
                  onChange={(e) => {
                    setInventoryCheckSearch(e.target.value)
                    setInventoryCheckPage(1)
                  }}
                  placeholder="Tìm mã kiểm kê hoặc vị trí..."
                  className="pl-9 pr-3 h-10 w-full rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left">Mã Kiểm Kê</th>
                  <th className="px-5 py-3 text-left">Vị Trí</th>
                  <th className="px-5 py-3 text-left">Loại Kiểm Kê</th>
                  <th className="px-5 py-3 text-left">Trạng Thái</th>
                  <th className="px-5 py-3 text-left">Chênh lệch</th>
                  <th className="px-5 py-3 text-left">Ngày tạo</th>
                  <th className="px-5 py-3 text-left">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {inventoryCheckLoading ? (
                  <tr>
                    <td className="px-5 py-12 text-center text-gray-500" colSpan={7}>
                      <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                      Đang tải danh sách...
                    </td>
                  </tr>
                ) : inventoryChecks.length === 0 ? (
                  <tr>
                    <td className="px-5 py-12 text-center text-gray-500" colSpan={7}>
                      Chưa có phiếu kiểm kê nào
                    </td>
                  </tr>
                ) : (
                  inventoryChecks
                    .filter((check) =>
                      inventoryCheckSearch.toLowerCase() === '' ||
                      (check.checkNumber && check.checkNumber.toLowerCase().includes(inventoryCheckSearch.toLowerCase())) ||
                      (check.locationId && check.locationId.toLowerCase().includes(inventoryCheckSearch.toLowerCase()))
                    )
                    .slice((inventoryCheckPage - 1) * 10, inventoryCheckPage * 10)
                    .map((check) => (
                      <tr key={check.id} className="border-t border-gray-100 hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-bold text-[#059669]">#{check.checkNumber || check.id}</p>
                          <p className="text-xs text-gray-500">{check.id.slice(0, 8)}…</p>
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          <p className="font-semibold">{getLocationName(check.locationId)}</p>
                          <p className="text-xs text-gray-500">{check.locationType}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            check.checkType === 'FULL'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {check.checkType === 'FULL' ? 'Toàn bộ' : 'Cục bộ'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            check.status === 'COMPLETED' || check.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : check.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {check.status === 'COMPLETED' || check.status === 'APPROVED' ? 'Hoàn thành' : check.status === 'PENDING' ? 'Chờ xử lý' : check.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-700 font-semibold">{check.totalDiscrepancies || 0}</td>
                        <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{formatDateVI(check.createdAt)}</td>
                        <td className="px-5 py-4">
                          <button className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Xem chi tiết">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {inventoryChecks.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Hiển thị {inventoryChecks.length === 0 ? 0 : (inventoryCheckPage - 1) * 10 + 1}-
                {Math.min(inventoryCheckPage * 10, inventoryChecks.length)} trên {inventoryChecks.length} phiếu
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setInventoryCheckPage((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-md border border-gray-200 text-gray-500 disabled:opacity-40"
                  disabled={inventoryCheckPage === 1}
                >
                  {'<'}
                </button>
                {Array.from({ length: Math.ceil(inventoryChecks.length / 10) }, (_, i) => i + 1)
                  .slice(0, 7)
                  .map((num) => (
                    <button
                      key={num}
                      onClick={() => setInventoryCheckPage(num)}
                      className={`w-8 h-8 rounded-md text-sm font-semibold ${
                        inventoryCheckPage === num ? 'bg-[#059669] text-white' : 'border border-gray-200 text-gray-600'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                <button
                  onClick={() => setInventoryCheckPage((p) => Math.min(Math.ceil(inventoryChecks.length / 10), p + 1))}
                  className="w-8 h-8 rounded-md border border-gray-200 text-gray-500 disabled:opacity-40"
                  disabled={inventoryCheckPage === Math.ceil(inventoryChecks.length / 10)}
                >
                  {'>'}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

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
            <form onSubmit={createRequest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm text-gray-600">
                  Từ Kho
                  <div className="relative mt-1">
                    <Warehouse className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={fromWarehouseDisplayName}
                      readOnly
                      placeholder="Tự động theo kho đăng nhập"
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm"
                    />
                  </div>
                </label>
                <label className="text-sm text-gray-600">
                  Tới Kho
                  <div className="relative mt-1">
                    <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <input
                      value={currentWarehouseRecord?.name ?? ''}
                      readOnly
                      placeholder="Tự động là kho hiện tại"
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm"
                    />
                  </div>
                </label>
                <input type="hidden" value="WAREHOUSE" />
                <input type="hidden" value="WAREHOUSE" />
                <label className="text-sm text-gray-600">
                  Ưu Tiên
                  <select
                    value={newRequest.priority}
                    onChange={(e) =>
                      setNewRequest((prev) => ({ ...prev, priority: e.target.value as RequestPriority }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-200 text-sm"
                  >
                    <option value="THẤP">NORMAL</option>
                    <option value="TRUNG BÌNH">HIGH</option>
                    <option value="CAO">URGENT</option>
                  </select>
                </label>
                <label className="text-sm text-gray-600">
                  Ghi chú
                  <textarea
                    value={newRequest.notes}
                    onChange={(e) => setNewRequest((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    placeholder="Ghi chú thêm cho đơn yêu cầu..."
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-200 resize-y text-sm"
                  />
                </label>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-500" />
                  Items (sản phẩm yêu cầu) <span className="text-red-500">*</span>
                </p>
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    onChange={(e) => {
                      addItemByProductId(e.target.value)
                      e.target.value = ''
                    }}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 text-sm"
                  >
                    <option value="">+ Thêm sản phẩm vào items...</option>
                    {productsForItems.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                  {loadingProducts && (
                    <Loader2 className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                  )}
                </div>

                {items.length === 0 ? (
                  <div className="mt-3 border-2 border-dashed border-gray-200 rounded-xl py-6 text-center text-gray-400 text-sm">
                    Chưa có sản phẩm nào. Hãy chọn ở danh sách phía trên để thêm.
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {items.map((item, idx) => (
                      <div
                        key={item.productId}
                        className="border border-gray-200 rounded-xl p-3 bg-gray-50/60 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{item.productName}</p>
                            <p className="text-xs text-gray-500">
                              {item.productSku} · {item.productUnit}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[11px] text-gray-600 mb-1">
                              Số lượng yêu cầu *
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={item.requestedQuantity}
                              onChange={(e) => {
                                const nextValue = e.target.value
                                if (/^\d*$/.test(nextValue)) {
                                  updateItem(idx, 'requestedQuantity', nextValue)
                                }
                              }}
                              onBlur={() => {
                                if (item.requestedQuantity === '' || Number(item.requestedQuantity) < 1) {
                                  updateItem(idx, 'requestedQuantity', '1')
                                }
                              }}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-600 mb-1">
                              Số lượng hiện tại
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={item.currentQuantity}
                              readOnly
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-600 mb-1">Lý do</label>
                            <div className="relative">
                              <select
                                value={item.reason}
                                onChange={(e) => updateItem(idx, 'reason', e.target.value)}
                                className="w-full px-2 pr-6 py-1.5 text-xs border border-gray-300 rounded-lg"
                              >
                                <option value="">-- chọn --</option>
                                {ITEM_REASONS.map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {submitError && (
                <p className="text-sm text-red-600">{submitError}</p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#f97316] text-white font-semibold hover:bg-[#ea580c] disabled:opacity-60"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu yêu cầu'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedIncoming && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/25 p-4 pt-16">
          <section className="w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500">Chi tiết đơn vận chuyển</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {selectedIncoming.transferNumber || selectedIncoming.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedIncoming(null)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Mã yêu cầu</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {incomingTransferRequestLabel(selectedIncoming).code}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    {selectedIncoming.restockRequestId ? selectedIncoming.restockRequestId.slice(0, 12) + '…' : '—'}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Kho gửi</p>
                  <p className="mt-1 font-semibold text-gray-900">{getLocationName(selectedIncoming.fromLocationId)}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Kho nhận</p>
                  <p className="mt-1 font-semibold text-gray-900">{getLocationName(selectedIncoming.toLocationId)}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Trạng thái</p>
                  <div className="mt-2">
                    {(() => {
                      const ui = getIncomingTransferUIStatus(selectedIncoming.status)
                      return (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${ui.cls}`}>
                          {ui.label}
                        </span>
                      )
                    })()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Ngày tạo</p>
                  <p className="mt-1 text-gray-900 font-semibold">{formatDateVI(selectedIncoming.transferDate)}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Ngày nhận</p>
                  <p className="mt-1 text-gray-900 font-semibold">{formatDateVI(selectedIncoming.actualDelivery)}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Ghi chú</p>
                  <p className="mt-1 text-gray-700 text-sm">{selectedIncoming.notes || '—'}</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <p className="font-bold text-gray-900">Danh sách sản phẩm</p>
                  <div className="text-sm text-gray-500">
                    Tổng SL: <span className="font-semibold text-gray-900">{sumExpectedQty(selectedIncoming).toLocaleString()}</span> ·
                    Thực nhận: <span className="font-semibold text-gray-900">{sumReceivedQty(selectedIncoming).toLocaleString()}</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white text-gray-500 uppercase text-xs tracking-wider">
                      <tr>
                        <th className="px-5 py-3 text-left">Sản phẩm</th>
                        <th className="px-5 py-3 text-left">Batch</th>
                        <th className="px-5 py-3 text-left">SL dự kiến</th>
                        <th className="px-5 py-3 text-left">SL thực nhận</th>
                        <th className="px-5 py-3 text-left">Chênh lệch</th>
                        <th className="px-5 py-3 text-left">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedIncoming.items ?? []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-10 text-center text-gray-500">Không có sản phẩm</td>
                        </tr>
                      ) : (
                        (selectedIncoming.items ?? []).map((it) => {
                          const expected = Number(it.shippedQuantity ?? 0) > 0 ? Number(it.shippedQuantity) : Number(it.requestedQuantity ?? 0)
                          const actual = Number(it.receivedQuantity ?? 0)
                          const diff = actual - expected
                          const product = productsForItems.find((p) => p.id === it.productId)
                          const batch = it.batchId ? batchesById[String(it.batchId)] : undefined
                          return (
                            <tr key={it.id} className="border-t border-gray-100">
                              <td className="px-5 py-3.5">
                                <p className="font-semibold text-gray-900">
                                  {product?.name ?? it.productId ?? '—'}
                                </p>
                                <p className="text-xs text-gray-500">SKU: {product?.sku ?? it.productId ?? '—'}</p>
                              </td>
                              <td className="px-5 py-3.5 text-gray-700 font-mono text-xs">
                                {batchesLoading ? '...' : batch?.batchNumber ?? it.batchId ?? '—'}
                              </td>
                              <td className="px-5 py-3.5 text-gray-700 font-semibold">{expected.toLocaleString()}</td>
                              <td className="px-5 py-3.5 text-gray-700 font-semibold">{actual.toLocaleString()}</td>
                              <td className="px-5 py-3.5">
                                <span className={`text-xs font-semibold ${diff === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                  {diff === 0 ? '0' : diff > 0 ? `+${diff}` : `${diff}`}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-gray-500 text-sm">{it.notes || '—'}</td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Manager chỉ xem chi tiết, không xác nhận nhận hàng. */}
            </div>
          </section>
        </div>
      )}

      {isInventoryCheckModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/25 p-4 pt-20">
          <section className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Tạo Phiếu Kiểm Kê</h3>
              <button
                onClick={() => setIsInventoryCheckModalOpen(false)}
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateInventoryCheck} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm text-gray-600">
                  Loại vị trí
                  <input
                    type="text"
                    value="Kho (WAREHOUSE)"
                    disabled
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-600"
                  />
                </label>
                <label className="text-sm text-gray-600">
                  Chọn vị trí <span className="text-red-500">*</span>
                  <div className="relative mt-1">
                    <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={newInventoryCheck.locationId}
                      onChange={(e) =>
                        setNewInventoryCheck((prev) => ({ ...prev, locationId: e.target.value }))
                      }
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 text-sm"
                    >
                      <option value="">-- Chọn kho --</option>
                      {locations
                        .filter((loc) => normalizeId(loc.id) === normalizedCurrentWarehouseId)
                        .map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </label>
                <label className="text-sm text-gray-600">
                  Loại kiểm kê
                  <div className="relative mt-1">
                    <select
                      value={newInventoryCheck.checkType}
                      onChange={(e) =>
                        setNewInventoryCheck((prev) => ({ ...prev, checkType: e.target.value as 'PARTIAL' | 'FULL' }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 text-sm"
                    >
                      <option value="PARTIAL">Kiểm kê cục bộ (PARTIAL)</option>
                      <option value="FULL">Kiểm kê toàn bộ (FULL)</option>
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </label>
                <label className="text-sm text-gray-600">
                  Ghi chú
                  <textarea
                    value={newInventoryCheck.notes}
                    onChange={(e) =>
                      setNewInventoryCheck((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    rows={2}
                    placeholder="Ghi chú thêm cho phiếu kiểm kê..."
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-y text-sm"
                  />
                </label>
              </div>

              {submitInventoryCheckError && (
                <p className="text-sm text-red-600">{submitInventoryCheckError}</p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInventoryCheckModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInventoryCheck}
                  className="px-4 py-2 rounded-lg bg-[#059669] text-white font-semibold hover:bg-[#047857] disabled:opacity-60"
                >
                  {isSubmittingInventoryCheck ? 'Đang tạo...' : 'Tạo phiếu kiểm kê'}
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

  if (status === 'Từ chối') {
    return <span className="text-red-600 font-semibold">• Từ chối</span>
  }

  return <span className="text-purple-600 font-semibold">• Đã duyệt</span>
}

function actionButtonClass(label: string) {
  if (label === 'Duyệt') {
    return 'px-3 py-1.5 rounded-lg bg-[#f97316] text-white text-xs font-semibold hover:bg-[#ea580c] transition-colors'
  }

  return 'px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-semibold'
}