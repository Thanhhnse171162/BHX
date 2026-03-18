'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  ChevronDown,
  SlidersHorizontal,
  Plus,
  X,
  AlertTriangle,
  Package,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'
import { RestockAPIService, RestockRequestFromAPI, RestockRequestItem } from '@/services/restock-api.service'
import { TransferAPIService } from '@/services/transfer-api.service'
import { ProductAPIService, ProductFromAPI } from '@/services/product-api.service'
import { UserAPIService } from '@/services/user-api.service'
import { WarehouseLookupAPIService } from '@/services/warehouse-lookup-api.service'
import { ProductBatchAPIService, ProductBatchFromAPI } from '@/services/product-batch-api.service'
import { localApiClient } from '@/shared/api/http'
import type { AdminWarehouse } from '@/shared/types/warehouse.types'
import { useAuthStore } from '@/store/auth.store'

// â”€â”€â”€ Types 

interface ProductRow {
  id: number
  productId: string
  product: string
  unit: string
  currentQty: number
  requestQty: number
  reason: string
}

interface TransferItemRow {
  id: number
  productId: string
  batchId: string
  requestedQuantity: number
  receivedQuantity: number
  notes: string
}

// â”€â”€â”€ Helper components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    URGENT: { label: 'Khẩn cấp', cls: 'text-red-500 font-semibold' },
    HIGH:   { label: 'Cao',   cls: 'text-orange-500 font-semibold' },
    NORMAL: { label: 'Bình thường',   cls: 'text-gray-400 font-medium' },
  }
  const s = map[priority] ?? { label: priority, cls: 'text-gray-500' }
  return <span className={s.cls}>{s.label}</span>
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { dot: string; bg: string; text: string; label: string }> = {
    PENDING:    { dot: 'bg-yellow-400', bg: 'bg-yellow-50 border border-yellow-200', text: 'text-yellow-700', label: 'Chờ xử lý' },
    APPROVED:   { dot: 'bg-green-500',  bg: 'bg-green-50 border border-green-200',   text: 'text-green-700',  label: 'Đã duyệt' },
    PROCESSING: { dot: 'bg-blue-500',   bg: 'bg-blue-50 border border-blue-200',     text: 'text-blue-700',   label: 'Đang xử lý' },
    COMPLETED:  { dot: 'bg-teal-500',   bg: 'bg-teal-50 border border-teal-200',     text: 'text-teal-700',   label: 'Hoàn thành' },
    REJECTED:   { dot: 'bg-red-500',    bg: 'bg-red-50 border border-red-200',       text: 'text-red-700',    label: 'Từ chối' },
  }
  const s = map[status] ?? { dot: 'bg-gray-400', bg: 'bg-gray-50 border border-gray-200', text: 'text-gray-700', label: status }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function SelectField({ label, options, value, onChange, required }: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}{required && ' *'}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 pr-8"
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
      </div>
    </div>
  )
}



let _nextProductRowId = 10
let _nextTransferItemRowId = 100
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeId(value?: string | null): string {
  return String(value ?? '').trim().toLowerCase()
}

function isWarehouseId(id: string): boolean {
  return normalizeId(id).startsWith('a')
}

export default function WarehouseRequestsPage() {
  const { user, token } = useAuthStore()

  const [requests, setRequests] = useState<RestockRequestFromAPI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')

  const [showModal, setShowModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<RestockRequestFromAPI | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false)

  const [transferFromLocationType, setTransferFromLocationType] = useState('WAREHOUSE')
  const [transferFromLocationId, setTransferFromLocationId] = useState('')
  const [transferToLocationType, setTransferToLocationType] = useState('STORE')
  const [transferToLocationId, setTransferToLocationId] = useState('')
  const [transferExpectedDelivery, setTransferExpectedDelivery] = useState('')
  const [transferShippedBy, setTransferShippedBy] = useState('')
  const [transferRestockRequestId, setTransferRestockRequestId] = useState('')
  const [transferNotes, setTransferNotes] = useState('')
  const [transferItems, setTransferItems] = useState<TransferItemRow[]>([])
  const [transferSourceRequest, setTransferSourceRequest] = useState<RestockRequestFromAPI | null>(null)

  const [products, setProducts] = useState<ProductFromAPI[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [batches, setBatches] = useState<ProductBatchFromAPI[]>([])
  const [isLoadingBatches, setIsLoadingBatches] = useState(false)
  const [warehouses, setWarehouses] = useState<AdminWarehouse[]>([])
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false)
  const [userNameMap, setUserNameMap] = useState<Record<string, string>>({})
  const [warehouseNameMap, setWarehouseNameMap] = useState<Record<string, string>>({})

  //  Create form state 
  const [fromWarehouseId, setFromWarehouseId] = useState('')
  const [fromLocType, setFromLocType] = useState('WAREHOUSE')
  const [toWarehouseId, setToWarehouseId] = useState('')
  const [toLocType, setToLocType] = useState('STORE')
  const [priority, setPriority] = useState('NORMAL')
  const [notes, setNotes] = useState('')
  const [productRows, setProductRows] = useState<ProductRow[]>([
    { id: 1, productId: '', product: '', unit: '', currentQty: 0, requestQty: 0, reason: '' },
  ])

  const normalizedRole = String(user?.role ?? '').toUpperCase().replace(/\s+/g, '_')
  const isWarehouseAdmin = normalizedRole === 'WAREHOUSE_ADMIN' || user?.roleId === 7
  const workplaceId = user?.warehouseId || user?.workplaceId || ''

  // Kho/cửa hàng thuộc quyền kiểm soát của kho tổng (descendants theo parentId)
  const managedLocationIds = useMemo(() => {
    const root = normalizeId(workplaceId)
    if (!root || warehouses.length === 0) return new Set<string>()

    const byParent = new Map<string, string[]>()
    for (const w of warehouses as any[]) {
      const pid = normalizeId(w.parentId ?? w.parent_id)
      const id = normalizeId(w.id)
      if (!id) continue
      if (!byParent.has(pid)) byParent.set(pid, [])
      byParent.get(pid)!.push(id)
    }

    const visited = new Set<string>()
    const queue: string[] = [root]
    while (queue.length) {
      const cur = queue.shift()!
      if (visited.has(cur)) continue
      visited.add(cur)
      const children = byParent.get(cur) ?? []
      for (const c of children) queue.push(c)
    }
    return visited
  }, [workplaceId, warehouses])

  const warehouseSourceOptions = useMemo(() => {
    const allWarehouses = warehouses.filter((w) => isWarehouseId(w.id))
    // Chỉ hiện các kho thuộc quyền kho tổng đang quản lý (descendants theo parentId)
    return allWarehouses.filter((w) => managedLocationIds.has(normalizeId(w.id)))
  }, [warehouses, managedLocationIds])

  const storeOptions = useMemo(() => {
    // store ids thường bắt đầu bằng 'b' trong seed data
    const stores = warehouses.filter((w) => !isWarehouseId(w.id))
    // Chỉ show store/kho con thuộc quyền kiểm soát của kho tổng
    return stores.filter((w) => managedLocationIds.has(normalizeId(w.id)))
  }, [warehouses, managedLocationIds])

  //  Fetch data 
  const fetchRequests = async () => {
    try {
      if (!token) return
      setIsLoading(true)
      setError(null)

      let data: RestockRequestFromAPI[] = []

      // Ưu tiên dùng API theo kho / kho cha để BE filter đúng quyền
      if (workplaceId) {
        // Warehouse Admin (roleId=7) xem toàn bộ yêu cầu của kho con theo kho tổng
        if (isWarehouseAdmin) {
          data = await RestockAPIService.getByParentWarehouse(workplaceId)
        } else {
          // Warehouse staff / Store manager xem yêu cầu gắn với kho/cửa hàng của mình
          data = await RestockAPIService.getByWarehouse(workplaceId)
        }

        // BE endpoint đôi khi chỉ filter theo fromWarehouseId.
        // Đảm bảo kho hiện tại (đặc biệt kho tổng) nhìn thấy các đơn gửi ĐẾN mình theo toWarehouseId.
        try {
          const all = await RestockAPIService.getAll()
          const wid = workplaceId.toLowerCase()
          const incoming = all.filter((r) => (r.toWarehouseId || '').toLowerCase() === wid)
          const merged = [...data, ...incoming]
          const deduped = merged.filter((r, idx, self) => idx === self.findIndex((x) => x.id === r.id))
          data = deduped
        } catch {
          // ignore: fallback to data from scoped endpoint
        }
      } else {
        data = []
      }

      setRequests(data)
      if (data.length > 0) setSelectedRequest(data[0])
    } catch (err) {
      console.error('Error loading restock requests:', err)
      setError('Không thể tải danh sách yêu cầu. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return

    fetchRequests()

    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true)
        const data = await ProductAPIService.getAllProducts()
        setProducts(data)
      } catch (err) {
        console.error('Error loading products for restock form:', err)
      } finally {
        setIsLoadingProducts(false)
      }
    }

    const fetchWarehouses = async () => {
      try {
        setIsLoadingWarehouses(true)
        const response = await localApiClient.get('/warehouses?status=ACTIVE&is_deleted=0')
        const json = response.data
        const data: AdminWarehouse[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
        setWarehouses(data)
      } catch (err) {
        console.error('Error loading warehouses for restock form:', err)
      } finally {
        setIsLoadingWarehouses(false)
      }
    }

    fetchProducts()
    fetchWarehouses()
  }, [token, workplaceId, isWarehouseAdmin])

  useEffect(() => {
    if (!token || requests.length === 0) return

    const unresolvedIds = Array.from(
      new Set(
        requests.flatMap(r => [r.requestedBy, r.approvedBy].filter((id): id is string => Boolean(id)))
      )
    ).filter(id => id !== user?.id && !userNameMap[id])

    if (unresolvedIds.length === 0) return

    let cancelled = false

    const fetchUserNames = async () => {
      const entries = await Promise.all(
        unresolvedIds.map(async (id) => {
          try {
            const info = await UserAPIService.getIamDetailsById(id)
            const displayName = info?.fullName || info?.full_name || info?.name || info?.email || ''
            return [id, displayName] as const
          } catch {
            return [id, ''] as const
          }
        })
      )

      if (cancelled) return

      setUserNameMap(prev => {
        const next = { ...prev }
        for (const [id, name] of entries) {
          if (name) next[id] = name
        }
        return next
      })
    }

    fetchUserNames()

    return () => {
      cancelled = true
    }
  }, [token, requests, user?.id, userNameMap])

  useEffect(() => {
    if (!token || requests.length === 0) return

    const unresolvedWarehouseIds = Array.from(
      new Set(requests.flatMap(r => [r.fromWarehouseId, r.toWarehouseId].filter(Boolean)))
    ).filter(id => !warehouseNameMap[id])

    if (unresolvedWarehouseIds.length === 0) return

    let cancelled = false

    const fetchWarehouseNames = async () => {
      const entries = await Promise.all(
        unresolvedWarehouseIds.map(async (id) => {
          try {
            const info = await WarehouseLookupAPIService.getById(id)
            return [id, info?.name || ''] as const
          } catch {
            return [id, ''] as const
          }
        })
      )

      if (cancelled) return

      setWarehouseNameMap(prev => {
        const next = { ...prev }
        for (const [id, name] of entries) {
          if (name) next[id] = name
        }
        return next
      })
    }

    fetchWarehouseNames()

    return () => {
      cancelled = true
    }
  }, [token, requests, warehouseNameMap])

  //  Filters 
  const filtered = useMemo(() => {
    return requests.filter(r => {
      const matchSearch =
        r.requestNumber.toLowerCase().includes(search.toLowerCase()) ||
        (r.notes ?? '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter
      const matchPriority = priorityFilter === 'ALL' || r.priority === priorityFilter
      return matchSearch && matchStatus && matchPriority
    })
  }, [requests, search, statusFilter, priorityFilter])

  // Dropdown shows only APPROVED and PROCESSING requests (can be transferred)
  const transferRequestOptions = useMemo(
    () => requests
      .filter(r => r.status === 'APPROVED' || r.status === 'PROCESSING')
      .map(r => ({ id: r.id, requestNumber: r.requestNumber, status: r.status })),
    [requests]
  )

  //  Product row helpers 
  const addProductRow = () => {
    _nextProductRowId++
    setProductRows(rows => [
      ...rows,
      { id: _nextProductRowId, productId: '', product: '', unit: '', currentQty: 0, requestQty: 0, reason: '' },
    ])
  }

  const removeProductRow = (id: number) => {
    setProductRows(rows => rows.filter(r => r.id !== id))
  }

  const updateRow = <K extends keyof ProductRow>(id: number, field: K, value: ProductRow[K]) => {
    setProductRows(rows =>
      rows.map(r => {
        if (r.id !== id) return r
        if (field === 'productId') {
          const found = products.find(p => p.id === String(value))
          return {
            ...r,
            productId: String(value),
            product: found?.name ?? '',
            unit: found?.unit ?? '',
            // TODO: khi có API tồn kho theo kho nguồn, map currentQty từ đó
            currentQty: r.currentQty,
          }
        }
        return { ...r, [field]: value }
      })
    )
  }

  //  Reset & close modal 
  const closeModal = () => {
    setShowModal(false)
    setFromWarehouseId(user?.warehouseId ?? '')
    setFromLocType('WAREHOUSE')
    setToWarehouseId('')
    setToLocType('STORE')
    setPriority('NORMAL')
    setNotes('')
    setProductRows([{ id: 1, productId: '', product: '', unit: '', currentQty: 0, requestQty: 0, reason: '' }])
  }

  //  Submit create 
  const handleSubmit = async () => {
    if (!fromWarehouseId || !toWarehouseId) {
      alert('Vui lòng chọn kho nguồn và kho đích.')
      return
    }
    const validItems = productRows.filter(r => r.productId && r.requestQty > 0)
    if (validItems.length === 0) {
      alert('Vui lòng thêm ít nhất 1 sản phẩm với số lượng yêu cầu.')
      return
    }
    try {
      setIsSubmitting(true)
      await RestockAPIService.create({
        fromWarehouseId,
        fromLocationType: fromLocType,
        toWarehouseId,
        toLocationType: toLocType,
        priority,
        notes,
        items: validItems.map(r => ({
          productId: r.productId,
          requestedQuantity: r.requestQty,
          reason: r.reason,
        })),
      })
      alert('Tạo yêu cầu thành công!')
      closeModal()
      fetchRequests()
    } catch (err) {
      console.error(err)
      alert('Không thể tạo yêu cầu. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  //  Approve / Reject
  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const action = status === 'APPROVED' ? 'duyệt' : 'từ chối'
    if (!confirm(`Bạn có chắc muốn ${action} yêu cầu này?`)) return
    try {
      await RestockAPIService.updateStatus(id, status, status === 'REJECTED' ? 'Rejected by approver' : undefined)
      await fetchRequests()
    } catch (err) {
      console.error(err)
      alert(`Không thể ${action} yêu cầu. Vui lòng thử lại.`)
    }
  }

  // â”€â”€ Format date 
  const fmtDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getWarehouseLabel = (id: string) => {
    if (!id) return '—'
    if (warehouseNameMap[id]) return warehouseNameMap[id]
    const found = warehouses.find(w => w.id === id)
    if (found) return found.name
    return id.slice(-8)
  }

  const getUserLabel = (id: string | null) => {
    if (!id) return '—'
    if (id === user?.id) return user.name
    if (userNameMap[id]) return userNameMap[id]
    // Rút gọn GUID để dễ đọc hơn
    return `${id.slice(0, 8)}...${id.slice(-4)}`
  }

  const toDateTimeLocalValue = (date: Date) => {
    const offset = date.getTimezoneOffset()
    const local = new Date(date.getTime() - offset * 60_000)
    return local.toISOString().slice(0, 16)
  }

  const openTransferModal = () => {
    setTransferFromLocationType('WAREHOUSE')
    setTransferFromLocationId('')
    setTransferToLocationType('STORE')
    setTransferToLocationId('')
    setTransferExpectedDelivery('')
    setTransferShippedBy('')
    setTransferRestockRequestId('')
    setTransferNotes('')
    setTransferItems([])
    setTransferSourceRequest(null)
    setShowTransferModal(true)
  }

  const closeTransferModal = () => {
    setShowTransferModal(false)
    setTransferItems([])
    setTransferSourceRequest(null)
  }

  const applyRequestToTransferForm = (req: RestockRequestFromAPI) => {
    setTransferSourceRequest(req)
    setTransferFromLocationType(req.fromLocationType || 'WAREHOUSE')
    setTransferFromLocationId(req.fromWarehouseId || '')
    setTransferToLocationType(req.toLocationType || 'STORE')
    setTransferToLocationId(req.toWarehouseId || '')
    setTransferExpectedDelivery(toDateTimeLocalValue(new Date(Date.now() + 24 * 60 * 60 * 1000)))
    setTransferShippedBy(user?.id || '')
    setTransferNotes(req.notes || '')

    const sourceItems = req.items || []
    setTransferItems(
      sourceItems.map((item, idx) => ({
        id: idx + 1,
        productId: item.productId,
        batchId: '',
        requestedQuantity: item.approvedQuantity ?? item.requestedQuantity ?? 0,
        receivedQuantity: 0,
        notes: item.reason || '',
      }))
    )
    _nextTransferItemRowId = Math.max(_nextTransferItemRowId, sourceItems.length + 100)
  }

  useEffect(() => {
    if (!showTransferModal) return

    const key = transferRestockRequestId.trim().toLowerCase()
    if (!key) {
      setTransferSourceRequest(null)
      // Không reset các field chọn kho/cửa hàng về '' vì sẽ làm select hiển thị sai (VD: show cửa hàng khi đang chọn WAREHOUSE)
      // Chỉ clear dữ liệu gắn với request nguồn
      setTransferItems([])
      return
    }

    const matched = requests.find(
      r => r.id.toLowerCase() === key || r.requestNumber.toLowerCase() === key
    )

    if (matched) {
      applyRequestToTransferForm(matched)
    } else {
      setTransferSourceRequest(null)
    }
  }, [transferRestockRequestId, showTransferModal, requests])

  // Load batches when warehouse changes
  useEffect(() => {
    if (!showTransferModal || !transferFromLocationId || !token) {
      setBatches([])
      return
    }

    const loadBatches = async () => {
      setIsLoadingBatches(true)
      try {
        const data = await ProductBatchAPIService.getByWarehouse(transferFromLocationId)
        setBatches(data)
      } catch (error) {
        console.error('Error loading batches:', error)
        setBatches([])
      } finally {
        setIsLoadingBatches(false)
      }
    }

    loadBatches()
  }, [transferFromLocationId, showTransferModal, token])

  const addTransferItemRow = () => {
    _nextTransferItemRowId++
    setTransferItems(rows => [
      ...rows,
      {
        id: _nextTransferItemRowId,
        productId: '',
        batchId: '',
        requestedQuantity: 0,
        receivedQuantity: 0,
        notes: '',
      },
    ])
  }

  const removeTransferItemRow = (id: number) => {
    setTransferItems(rows => rows.filter(row => row.id !== id))
  }

  const updateTransferItemRow = <K extends keyof TransferItemRow>(
    id: number,
    field: K,
    value: TransferItemRow[K]
  ) => {
    setTransferItems(rows => rows.map(row => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const handleCreateTransfer = async () => {
    if (!transferFromLocationType || !transferFromLocationId || !transferToLocationType || !transferToLocationId) {
      alert('Vui lòng nhập đầy đủ điểm đi và điểm đến.')
      return
    }
    if (!transferExpectedDelivery || !transferRestockRequestId) {
      alert('Vui lòng nhập đầy đủ expectedDelivery và restockRequestId.')
      return
    }
    if (transferItems.length === 0) {
      alert('Vui lòng thêm ít nhất 1 sản phẩm vận chuyển.')
      return
    }

    const invalidItem = transferItems.find(
      item =>
        !item.productId ||
        !item.batchId ||
        item.requestedQuantity < 0 ||
        item.receivedQuantity < 0
    )

    if (invalidItem) {
      alert('Mỗi dòng sản phẩm cần có productId, batchId, requestedQuantity và receivedQuantity hợp lệ.')
      return
    }


    try {
      setIsSubmittingTransfer(true)
      const normalizedShippedBy = UUID_REGEX.test(transferShippedBy.trim())
        ? transferShippedBy.trim()
        : undefined

      const transfer = await TransferAPIService.create({
        fromLocationType: transferFromLocationType,
        fromLocationId: transferFromLocationId,
        toLocationType: transferToLocationType,
        toLocationId: transferToLocationId,
        expectedDelivery: new Date(transferExpectedDelivery).toISOString(),
        ...(normalizedShippedBy ? { shippedBy: normalizedShippedBy } : {}),
        restockRequestId: transferRestockRequestId,
        notes: transferNotes,
        items: transferItems.map(item => ({
          productId: item.productId,
          batchId: item.batchId,
          requestedQuantity: item.requestedQuantity,
          receivedQuantity: item.receivedQuantity,
          notes: item.notes,
        })),
      })

      alert(`Tạo đơn vận chuyển thành công: ${transfer.transferNumber || transfer.id}`)
      closeTransferModal()
      await fetchRequests()
    } catch (err) {
      console.error('Transfer creation error:', err)
      const errorMsg = (err as any)?.response?.data?.message || (err as any)?.message || 'Không thể tạo đơn vận chuyển. Vui lòng kiểm tra dữ liệu và thử lại.'
      alert(errorMsg)
    } finally {
      setIsSubmittingTransfer(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center">
                  <Package size={12} className="text-white" />
                </span>
                <h2 className="text-base font-bold text-gray-900">Tạo Đơn Vận Chuyển</h2>
              </div>
              <button onClick={closeTransferModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
                Đơn sẽ tạo theo yêu cầu: <span className="font-semibold">{transferSourceRequest?.requestNumber || 'Chưa chọn'}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <SelectField
                  label="TỪ LOẠI KHO"
                  required
                  value={transferFromLocationType}
                  onChange={setTransferFromLocationType}
                  options={[
                    { value: 'WAREHOUSE', label: 'WAREHOUSE' },
                    { value: 'STORE', label: 'STORE' },
                  ]}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">TỪ KHO *</label>
                  <div className="relative">
                    <select
                      value={transferFromLocationId}
                      onChange={(e) => setTransferFromLocationId(e.target.value)}
                      className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                    >
                      <option value="">
                        {transferFromLocationType === 'WAREHOUSE' ? 'Chọn kho nguồn' : 'Chọn cửa hàng nguồn'}
                      </option>
                      {(transferFromLocationType === 'WAREHOUSE' ? warehouseSourceOptions : storeOptions).map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>
                <SelectField
                  label="ĐẾN LOẠI KHO"
                  required
                  value={transferToLocationType}
                  onChange={setTransferToLocationType}
                  options={[
                    { value: 'STORE', label: 'STORE' },
                    { value: 'WAREHOUSE', label: 'WAREHOUSE' },
                  ]}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ĐẾN KHO *</label>
                  <div className="relative">
                    <select
                      value={transferToLocationId}
                      onChange={(e) => setTransferToLocationId(e.target.value)}
                      className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                    >
                      <option value="">
                        {transferToLocationType === 'WAREHOUSE' ? 'Chọn kho đích' : 'Chọn cửa hàng đích'}
                      </option>
                      {(transferToLocationType === 'WAREHOUSE' ? warehouseSourceOptions : storeOptions).map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">DỰ KIẾN GIAO HÀNG *</label>
                  <input
                    type="datetime-local"
                    value={transferExpectedDelivery}
                    onChange={e => setTransferExpectedDelivery(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SHIPPED BY *</label>
                  <input
                    value={transferShippedBy}
                    onChange={e => setTransferShippedBy(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập UUID người giao hàng"
                  />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2 lg:col-span-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">CHỌN YÊU CẦU</label>
                  <div className="relative">
                    <select
                      value={transferSourceRequest?.id || ''}
                      onChange={e => setTransferRestockRequestId(e.target.value)}
                      className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                    >
                      <option value="">Chọn theo mã yêu cầu</option>
                      {transferRequestOptions.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.requestNumber}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>

                <div className="flex flex-col gap-1 md:col-span-2 lg:col-span-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ID YÊU CẦU *</label>
                  <input
                    value={transferRestockRequestId}
                    onChange={e => setTransferRestockRequestId(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập UUID hoặc mã yêu cầu (VD: RST-2026-001)"
                  />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2 lg:col-span-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">GHI CHÚ</label>
                  <textarea
                    value={transferNotes}
                    onChange={e => setTransferNotes(e.target.value)}
                    rows={2}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ghi chú đơn vận chuyển"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-800 text-sm">Sản phẩm</span>
                  <button
                    onClick={addTransferItemRow}
                    className="flex items-center gap-1 text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors"
                  >
                    <Plus size={15} />
                    Thêm sản phẩm
                  </button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">MÃ SẢN PHẨM</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">MÃ LÔ HÀNG</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">SỐ LƯỢNG YÊU CẦU</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">SỐ LƯỢNG NHẬN</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">GHI CHÚ</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {transferItems.map((item, idx) => (
                        <tr key={item.id} className={idx !== transferItems.length - 1 ? 'border-b border-gray-100' : ''}>
                          <td className="px-4 py-3">
                            <select
                              value={item.productId}
                              onChange={e => updateTransferItemRow(item.id, 'productId', e.target.value)}
                              className="appearance-none border border-gray-200 rounded-md bg-white text-sm text-gray-800 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            >
                              <option value="">{isLoadingProducts ? 'Đang tải sản phẩm...' : 'Chọn productId'}</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={item.batchId}
                              onChange={e => updateTransferItemRow(item.id, 'batchId', e.target.value)}
                              className="appearance-none border border-gray-200 rounded-md bg-white text-sm text-gray-800 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            >
                              <option value="">{isLoadingBatches ? 'Đang tải lô hàng...' : 'Chọn lô hàng'}</option>
                              {batches.map(b => (
                                <option key={b.id} value={b.id}>{b.batchNumber} (Số lượng: {b.quantity})</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={0}
                              value={item.requestedQuantity}
                              onChange={e => updateTransferItemRow(item.id, 'requestedQuantity', parseInt(e.target.value) || 0)}
                              className="border border-gray-200 rounded-md px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={0}
                              value={item.receivedQuantity}
                              onChange={e => updateTransferItemRow(item.id, 'receivedQuantity', parseInt(e.target.value) || 0)}
                              className="border border-gray-200 rounded-md px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              value={item.notes}
                              onChange={e => updateTransferItemRow(item.id, 'notes', e.target.value)}
                              className="border border-gray-200 rounded-md px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Ghi chú item"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <button
                              onClick={() => removeTransferItemRow(item.id)}
                              className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <span className="text-sm text-gray-500">{transferItems.length} item trong đơn</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={closeTransferModal}
                  className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateTransfer}
                  disabled={isSubmittingTransfer}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60"
                >
                  {isSubmittingTransfer && <Loader2 size={14} className="animate-spin" />}
                  Tạo đơn vận chuyển
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*  Create Modal  */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
                  <Package size={12} className="text-white" />
                </span>
                <h2 className="text-base font-bold text-gray-900">Tạo Yêu Cầu Nhập Hàng Mới</h2>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-3 gap-4">
                <SelectField
                  label="KHO"
                  required
                  value={fromWarehouseId}
                  onChange={setFromWarehouseId}
                  options={[
                    { value: '', label: isLoadingWarehouses ? 'Đang tải kho...' : 'Chọn Kho' },
                    ...warehouses.map(w => ({
                      value: w.id,
                      label: w.name,
                    })),
                  ]}
                />
                <SelectField
                  label="Tới kho"
                  required
                  value={toWarehouseId}
                  onChange={setToWarehouseId}
                  options={[
                    { value: '', label: isLoadingWarehouses ? 'Đang tải kho...' : 'Chọn kho' },
                    ...warehouses.map(w => ({
                      value: w.id,
                      label: w.name,
                    })),
                  ]}
                />
                <SelectField
                  label="MỨC ĐỘ ƯU TIÊN"
                  value={priority}
                  onChange={setPriority}
                  options={[
                    { value: 'NORMAL', label: 'Bình thường' },
                    { value: 'HIGH', label: 'Cao' },
                    { value: 'URGENT', label: 'Khẩn cấp' },
                  ]}
                />
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-3 gap-4">
                <SelectField
                  label="ĐỊA ĐIỂM"
                  value={fromLocType}
                  onChange={setFromLocType}
                  options={[
                    { value: 'WAREHOUSE', label: 'Kho' },
                    { value: 'STORE', label: 'Cửa Hàng' },
                  ]}
                />
                <SelectField
                  label="TỚI ĐỊA ĐIỂM"
                  value={toLocType}
                  onChange={setToLocType}
                  options={[
                    { value: 'STORE', label: 'Cửa Hàng' },
                    { value: 'WAREHOUSE', label: 'Kho' },
                  ]}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">GHI CHÚ</label>
                  <textarea
                    rows={3}
                    placeholder="Lý do nhập hàng, hướng dẫn cụ thể..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Products table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package size={15} className="text-gray-500" />
                    <span className="font-semibold text-gray-800 text-sm">Sản Phẩm Yêu Cầu</span>
                  </div>
                  <button
                    onClick={addProductRow}
                    className="flex items-center gap-1 text-green-600 text-sm font-medium hover:text-green-700 transition-colors"
                  >
                    <Plus size={15} />
                    Thêm Sản Phẩm
                  </button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">SẢN PHẨM</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">ĐVT</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">SL HIỆN TẠI</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">SL YÊU CẦU</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">LÝ DO</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {productRows.map((row, idx) => (
                        <tr key={row.id} className={idx !== productRows.length - 1 ? 'border-b border-gray-100' : ''}>
                          <td className="px-4 py-3">
                            <div className="relative">
                              <select
                                value={row.productId}
                                onChange={e => updateRow(row.id, 'productId', e.target.value)}
                                className="appearance-none border border-gray-200 rounded-md bg-white text-sm text-gray-800 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 pr-6 w-full"
                              >
                                <option value="">{isLoadingProducts ? 'Đang tải sản phẩm...' : 'Chọn sản phẩm'}</option>
                                {products.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-sm">{row.unit || '—'}</td>
                          <td className="px-4 py-3 text-gray-600 text-sm">{row.currentQty}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={1}
                              value={row.requestQty || ''}
                              onChange={e => updateRow(row.id, 'requestQty', parseInt(e.target.value) || 0)}
                              className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center text-green-600 font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={row.reason}
                              onChange={e => updateRow(row.id, 'reason', e.target.value)}
                              placeholder="Thêm lý do..."
                              className="w-full border-0 bg-transparent text-sm text-gray-500 italic focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <button
                              onClick={() => removeProductRow(row.id)}
                              className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-4 py-3 border-t border-gray-100">
                    <button
                      onClick={addProductRow}
                      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-green-600 transition-colors"
                    >
                      <Plus size={14} className="text-green-500" />
                      Thêm hàng mới
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <span className="text-sm text-gray-500">
                Sản phẩm yêu cầu:{' '}
                <span className="font-medium text-gray-700">
                  {productRows.filter(r => r.productId).length} sản phẩm tổng cộng
                </span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={closeModal}
                  className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  Gửi Yêu Cầu Nhập Hàng →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*  Header  */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yêu Cầu Nhập Hàng</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Quản lý yêu cầu chuyển kho và cấp phát hàng trên toàn mạng lưới phân phối.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRequests}
            className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title="Làm mới"
          >
            <RefreshCw size={15} className="text-gray-500" />
          </button>
          <button
            onClick={openTransferModal}
            disabled={!selectedRequest}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Tạo Đơn Vận Chuyển
          </button>
        </div>
      </div>

      {/*  Filters  */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm theo số yêu cầu (ví dụ: RST-2024-001)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">TRẠNG THÁI</span>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none border border-gray-200 rounded-lg pl-3 pr-7 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="ALL">Tất Cả Trạng Thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="PROCESSING">Đang xử lý</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="REJECTED">Từ chối</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mức độ ưu tiên</span>
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="appearance-none border border-gray-200 rounded-lg pl-3 pr-7 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="ALL">Tất cả mức độ</option>
              <option value="NORMAL">Bình thường</option>
              <option value="HIGH">Cao</option>
              <option value="URGENT">Khẩn cấp</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>
        </div>

        <button className="ml-auto p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <SlidersHorizontal size={16} className="text-gray-500" />
        </button>
      </div>

      {/*  Loading / Error  */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-green-500" />
          <p className="text-gray-500 text-sm">Đang tải dữ liệu...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between">
          <p className="text-sm">{error}</p>
          <button onClick={fetchRequests} className="text-sm underline hover:no-underline">Thử lại</button>
        </div>
      )}

      {/*  Table  */}
      {!isLoading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['SỐ YÊU CẦU', 'TỪ KHO', 'TỚI KHO', 'MỨC ĐỘ', 'TRẠNG THÁI', 'NGÀY'].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                    Không có yêu cầu nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                filtered.map(req => (
                  <tr
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${selectedRequest?.id === req.id ? 'bg-green-50' : ''}`}
                  >
                    <td className="px-5 py-3.5 font-semibold text-gray-900">{req.requestNumber}</td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">{getWarehouseLabel(req.fromWarehouseId)}</td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">{getWarehouseLabel(req.toWarehouseId)}</td>
                    <td className="px-5 py-3.5">
                      <PriorityBadge priority={req.priority} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">{fmtDate(req.requestedDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination bar */}
          <div className="px-5 py-3 flex items-center justify-between border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Hiển thị {filtered.length} trên {requests.length} kết quả
            </span>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors">
                Trước
              </button>
              <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors">
                Sau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom panels  */}
      {selectedRequest && !isLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Detail panel */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Chi Tiết Yêu Cầu</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedRequest.requestNumber} â€¢ {fmtDate(selectedRequest.requestedDate)}
                </p>
              </div>
              <StatusBadge status={selectedRequest.status} />
            </div>
            <div className="p-5 space-y-4">
              {/* Main info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">KHO</p>
                  <p className="text-sm font-medium text-gray-800">{getWarehouseLabel(selectedRequest.fromWarehouseId)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">TỚI KHO</p>
                  <p className="text-sm font-medium text-gray-800">{getWarehouseLabel(selectedRequest.toWarehouseId)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">LOẠI</p>
                  <p className="text-sm font-medium text-gray-800">{selectedRequest.fromLocationType} → {selectedRequest.toLocationType}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">MỨC ĐỘ ƯU TIÊN</p>
                  <div className="flex items-center gap-1">
                    {selectedRequest.priority === 'URGENT' && <AlertTriangle size={14} className="text-red-500" />}
                    <PriorityBadge priority={selectedRequest.priority} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">NGƯỜI YÊU CẦU</p>
                  <p className="text-sm font-medium text-gray-800 break-all">{getUserLabel(selectedRequest.requestedBy)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">NGƯỜI DUYỆT</p>
                  <p className="text-sm font-medium text-gray-800">{getUserLabel(selectedRequest.approvedBy)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">NGÀY DUYỆT</p>
                  <p className="text-sm text-gray-600">{fmtDate(selectedRequest.approvedDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">ID VẬN CHUYỂN</p>
                  <p className="text-sm text-gray-600 break-all">{selectedRequest.transferId ?? '—'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">GHI CHÚ</p>
                <p className="text-sm text-gray-500 italic">{selectedRequest.notes ?? '—'}</p>
              </div>

              {/* Action buttons */}
              {(selectedRequest.status === 'PENDING') && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'REJECTED')}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                  >
                    <XCircle size={14} />
                    Từ chối
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'APPROVED')}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                  >
                    <CheckCircle size={14} />
                    Duyệt
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Items panel */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Sản Phẩm Yêu Cầu</h3>
              <span className="text-xs text-gray-500">{selectedRequest.items.length} sản phẩm</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['SẢN PHẨM', 'ĐVT', 'HIỆN TẠI', 'YÊU CẦU', 'ĐÃ DUYỆT', 'LÝ DO'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedRequest.items.map((item: RestockRequestItem, idx: number) => (
                    <tr key={item.id} className={idx !== selectedRequest.items.length - 1 ? 'border-b border-gray-100' : ''}>
                      <td className="px-4 py-3 font-medium text-gray-800">{item.productName}</td>
                      <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                      <td className="px-4 py-3 text-gray-600">{item.currentQuantity}</td>
                      <td className="px-4 py-3 font-semibold text-green-600">{item.requestedQuantity}</td>
                      <td className="px-4 py-3">
                        {item.approvedQuantity !== null ? (
                          <span className="font-semibold text-teal-600">{item.approvedQuantity}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 italic text-xs">{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

