
"use client";
import { useState, useMemo, useEffect } from "react";
import {
  ClipboardCheck, Download, CheckCircle, AlertTriangle,
  Search, X, Calendar, FileText, TrendingDown, Package, Eye,
  Filter, ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import {
  getInventoryChecks,
  InventoryCheckListDto,
  createInventoryCheck,
  submitInventoryCheck,
  CreateInventoryCheckDto,
  SubmitInventoryCheckDto,
} from '@/services/inventory-check-api';
import { InventoryAPIService, InventoryItem } from '@/services/inventory-api.service';
import { ProductAPIService, ProductFromAPI } from '@/services/product-api.service';
import { UserAPIService } from '@/services/user-api.service';
import { useAuthStore } from '@/store/auth.store';

// ─── Types ────────────────────────────────────────────────────────────────────

// Remove unused CheckSession and InventoryCheckItem interfaces (use DTOs)

const ITEMS_PER_PAGE = 6

type InventoryCheckModalItem = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  systemQty: number;
  unit: string;
}

function normalizeLocationType(locationType?: string | null): 'WAREHOUSE' | 'STORE' | null {
  if (!locationType) return null
  const upper = locationType.toUpperCase()
  if (upper === 'WAREHOUSE' || upper === 'STORE') return upper
  return null
}

function mapInventoryToModalItems(
  inventoryData: InventoryItem[],
  productMap: Map<string, ProductFromAPI>
): InventoryCheckModalItem[] {
  return inventoryData.map((item) => {
    const product = productMap.get(item.productId)

    return {
      id: item.id,
      productId: item.productId,
      productName: item.product?.name || item.productName || item.name || product?.name || 'Unknown Product',
      sku: item.product?.sku || item.sku || product?.sku || 'N/A',
      category: item.product?.categoryName || item.categoryName || product?.categoryName || 'Uncategorized',
      systemQty: item.quantity,
      unit: item.product?.unit || item.unit || product?.unit || '',
    }
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0 font-bold text-white text-xs select-none">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function StatusBadge({ status }: { status: 'in-progress' | 'completed' }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 whitespace-nowrap">
        <CheckCircle className="w-3 h-3 flex-shrink-0" />Hoàn thành
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
      Đang tiến hành
    </span>
  )
}

function ProgressBar({ value, max, done }: { value: number; max: number; done: boolean }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="space-y-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-400 tabular-nums whitespace-nowrap">{value}/{max}</span>
        <span className="text-xs font-semibold text-gray-600 tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${done ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function DiscrepancyBadge({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold whitespace-nowrap">
        <CheckCircle className="w-3 h-3 flex-shrink-0" />0
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-100 text-orange-700 text-xs font-semibold whitespace-nowrap">
      <AlertTriangle className="w-3 h-3 flex-shrink-0" />{count}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const { user, hydrated } = useAuthStore()

  // pagination
  const [currentPage, setCurrentPage] = useState(1)

  // check modal
  const [showCheckModal, setShowCheckModal] = useState(false)
  const [modalSearch,    setModalSearch]    = useState('')
  const [modalCategory,  setModalCategory]  = useState('all')
  const [checkItems,     setCheckItems]     = useState<Map<string, number>>(new Map())

  // confirm modal
  const [showConfirm, setShowConfirm] = useState(false)

  // API data state
  const [allSessions, setAllSessions] = useState<InventoryCheckListDto[]>([])
  // Removed loadingSessions and errorSessions (not used in UI)

  // For inventory items in the modal (current user's workplace)
  const [inventoryItems, setInventoryItems] = useState<InventoryCheckModalItem[]>([])
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeCheckId, setActiveCheckId] = useState<string | null>(null)

  // Details view
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedCheckForDetails, setSelectedCheckForDetails] = useState<InventoryCheckListDto | null>(null)

  // User name cache
  const [userNameCache, setUserNameCache] = useState<Map<string, string>>(new Map())

  // Fetch inventory check sessions on mount - filter by current user's location
  useEffect(() => {
    if (!hydrated || !user?.workplaceId) {
      setAllSessions([]);
      return;
    }

    const currentLocationId = String(user.workplaceId).trim().toLowerCase();
    
    getInventoryChecks()
      .then((data) => {
        // Filter to only show checks for current warehouse/store
        const filtered = data.filter((check) => {
          const checkLocationId = String(check.locationId ?? '').trim().toLowerCase();
          return checkLocationId === currentLocationId;
        });
        setAllSessions(filtered);
      })
      .catch(() => {
        // Optionally handle error
        setAllSessions([]);
      });
  }, [hydrated, user?.workplaceId]);

  // Fetch user names for checked_by field
  useEffect(() => {
    const userIds = Array.from(new Set(allSessions.map(s => s.checkedBy).filter(Boolean)))
    const missingIds = userIds.filter(id => !userNameCache.has(id))

    if (missingIds.length === 0) return

    missingIds.forEach(userId => {
      UserAPIService.getById(userId)
        .then(user => {
          if (user) {
            const userName = user.fullName || user.full_name || user.name || 'Unknown'
            setUserNameCache(prev => new Map(prev).set(userId, userName))
          }
        })
        .catch(() => {
          setUserNameCache(prev => new Map(prev).set(userId, 'Unknown'))
        })
    })
  }, [allSessions, userNameCache])

  // Helper to get user name from cache
  const getUserName = (userId: string | undefined): string => {
    if (!userId) return '?'
    return userNameCache.get(userId) || userId.substring(0, 8)
  }

  // ── pagination ──
  const totalPages    = Math.ceil(allSessions.length / ITEMS_PER_PAGE)
  const pagedSessions = allSessions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  // ── summary stats ──
  const completedCount     = allSessions.filter(s => s.status?.toLowerCase() === 'completed').length
  const inProgressCount    = allSessions.filter(s => s.status?.toLowerCase() !== 'completed').length
  // If discrepancies is not present, fallback to 0
  const totalDiscrepancies = allSessions.reduce((sum, s) => sum + (s.totalDiscrepancies ?? 0), 0);

  // ── modal filter/search ──
  const categories = useMemo(() =>
    ['all', ...Array.from(new Set(inventoryItems.map(i => i.category)))],
  [inventoryItems])

  const filteredItems = useMemo(() =>
    inventoryItems.filter(i => {
      const matchSearch =
        i.productName.toLowerCase().includes(modalSearch.toLowerCase()) ||
        i.sku.toLowerCase().includes(modalSearch.toLowerCase())
      const matchCat = modalCategory === 'all' || i.category === modalCategory
      return matchSearch && matchCat
    }),
  [modalSearch, modalCategory, inventoryItems])

  // ── modal stats ──
  const checkedCount     = checkItems.size
  const discrepancyItems = useMemo(() =>
    inventoryItems.filter(i => {
      const actual = checkItems.get(i.id)
      return actual !== undefined && actual !== i.systemQty
    }),
  [checkItems, inventoryItems])
  const discrepancyCount = discrepancyItems.length

  // ── handlers ──
  const handleQtyChange = (id: string, value: string) => {
    const m = new Map(checkItems)
    if (value === '') m.delete(id); else m.set(id, parseInt(value) || 0)
    setCheckItems(m)
  }
  const handleClearItem = (id: string) => {
    const m = new Map(checkItems); m.delete(id); setCheckItems(m)
  }

  // Handle opening a check from the table (for in-progress or viewing completed)
  const handleOpenCheckFromTable = async (session: InventoryCheckListDto) => {
    const isCompleted = session.status?.toLowerCase() === "completed"
    
    if (isCompleted) {
      // Show details modal for completed checks
      setSelectedCheckForDetails(session)
      setShowDetailsModal(true)
      return
    }

    // For in-progress checks, directly load and open the modal
    setActiveCheckId(session.id)
    setShowCheckModal(true)
    setModalSearch('')
    setModalCategory('all')
    setCheckItems(new Map())
    setInventoryItems([])
    setModalError(null)
    setModalLoading(true)

    try {
      if (!hydrated) {
        throw new Error('Đang tải thông tin tài khoản. Vui lòng thử lại sau vài giây.')
      }

      const locationType = normalizeLocationType(user?.workplaceType)
      const locationId = user?.workplaceId?.trim()

      if (!locationType || !locationId) {
        throw new Error('Tài khoản chưa được gán kho/cửa hàng.')
      }

      const [inventoryData, productsData] = await Promise.all([
        InventoryAPIService.getInventoryByLocation(locationType, locationId),
        ProductAPIService.getAllProducts(),
      ])

      const productMap = new Map<string, ProductFromAPI>()
      productsData.forEach((product) => {
        productMap.set(product.id, product)
      })

      const modalItems = mapInventoryToModalItems(inventoryData, productMap)
      setInventoryItems(modalItems)
    } catch (err: any) {
      const fallbackMessage = 'Không thể lấy danh sách tồn kho theo kho/cửa hàng hiện tại.'
      const errorMessage = err?.response?.data?.message || err?.response?.data?.error?.message || err?.message || fallbackMessage
      setModalError(errorMessage)
      console.error('Error in handleOpenCheckFromTable:', { error: err })
    }
    setModalLoading(false)
  }

  const handleCloseModal = () => {
    setShowCheckModal(false)
    setModalSearch('')
    setCheckItems(new Map())
    setShowConfirm(false)
    setActiveCheckId(null)
  }
  const handleCompleteClick = () => {
    if (checkItems.size === 0) { alert('Vui lòng nhập số lượng thực tế!'); return }
    if (discrepancyCount > 0) setShowConfirm(true)
    else handleFinalSubmit()
  }
  
  const handleFinalSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const locationType = normalizeLocationType(user?.workplaceType)
      const locationId = user?.workplaceId?.trim()

      if (!locationType || !locationId) {
        throw new Error('Tài khoản chưa được gán kho/cửa hàng.')
      }

      // Create or use active check
      let checkId = activeCheckId
      if (!checkId) {
        const createPayload: CreateInventoryCheckDto = {
          locationType,
          locationId,
          checkType: 'FULL',
          notes: 'Inventory check from store',
        }
        const createdCheck = await createInventoryCheck(createPayload)
        checkId = createdCheck.id
        setActiveCheckId(checkId)
      }

      // Submit the items
      const submitPayload: SubmitInventoryCheckDto = {
        items: Array.from(checkItems.entries()).map(([productId, actualQuantity]) => ({
          productId,
          actualQuantity,
          note: '',
        })),
      }

      await submitInventoryCheck(checkId, submitPayload)

      // Refresh the list
      const updatedChecks = await getInventoryChecks()
      const currentLocationId = String(locationId).trim().toLowerCase()
      const filtered = updatedChecks.filter((check) => {
        const checkLocationId = String(check.locationId ?? '').trim().toLowerCase()
        return checkLocationId === currentLocationId
      })
      setAllSessions(filtered)

      // Success - close modal
      alert('Đã hoàn thành kiểm kê và cập nhật hệ thống!')
      handleCloseModal()
    } catch (err: any) {
      const fallbackMessage = 'Không thể hoàn thành kiểm kê. Vui lòng thử lại.'
      const message = err?.response?.data?.message || err?.message || fallbackMessage
      alert(`Lỗi: ${message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── table column widths ──
  const COL = {
    phieu:     'w-[200px] min-w-[160px]',
    ngay:      'w-[120px] min-w-[100px]',
    nguoi:     'w-[180px] min-w-[140px]',
    tiendo:    'w-[180px] min-w-[140px]',
    chenhlech: 'w-[100px] min-w-[80px]',
    trangthai: 'w-[140px] min-w-[120px]',
    action:    'w-[90px]  min-w-[80px]',
  }

  // ── page number list for pagination UI ──
  const pageNumbers = useMemo(() => {
    const nums: (number | '…')[] = []
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
        nums.push(i)
      } else if (nums[nums.length - 1] !== '…') {
        nums.push('…')
      }
    }
    return nums
  }, [totalPages, currentPage])

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Check</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kiểm kê định kỳ cửa hàng</p>
        </div>
      </div>

      {/* ── SUMMARY CARDS ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{allSessions.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Tổng phiên kiểm kê</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Đã hoàn thành</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className={`text-2xl font-bold ${totalDiscrepancies > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
              {totalDiscrepancies}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Tổng chênh lệch</p>
          </div>
        </div>
      </div>

      {/* ── HISTORY TABLE ── */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">

        {/* top bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Lịch sử kiểm kê</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {allSessions.length} phiên
              {inProgressCount > 0 && (
                <span className="ml-1.5 text-blue-600 font-medium">· {inProgressCount} đang tiến hành</span>
              )}
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1.5" />
            Xuất báo cáo
          </Button>
        </div>

        {/* scrollable table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1010px] text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className={`text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide ${COL.phieu}`}>Phiếu kiểm kê</th>
                <th className={`text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide ${COL.ngay}`}>Ngày kiểm</th>
                <th className={`text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide ${COL.nguoi}`}>Người kiểm</th>
                <th className={`text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide ${COL.tiendo}`}>Tiến độ</th>
                <th className={`text-center py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide ${COL.chenhlech}`}>Chênh lệch</th>
                <th className={`text-center py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide ${COL.trangthai}`}>Trạng thái</th>
                <th className={`text-right py-3 px-4 ${COL.action}`} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedSessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50/80 transition-colors cursor-pointer">
                  <td className={`py-4 px-4 ${COL.phieu}`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${session.status?.toLowerCase() === "completed" ? "bg-green-500" : "bg-blue-500 animate-pulse"}`} />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{session.checkNumber ?? session.id}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">Kiểm kê định kỳ</p>
                      </div>
                    </div>
                  </td>
                  <td className={`py-4 px-4 ${COL.ngay}`}>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="tabular-nums">{session.checkDate?.slice(0, 10) ?? session.createdAt?.slice(0, 10) ?? ""}</span>
                    </div>
                  </td>
                  <td className={`py-4 px-4 ${COL.nguoi}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={getUserName(session.checkedBy)} />
                      <span className="text-sm text-gray-700 truncate">{getUserName(session.checkedBy)}</span>
                    </div>
                  </td>
                  <td className={`py-4 px-4 ${COL.tiendo}`}>
                    {/* No checkedItems/totalItems in DTO, so show N/A or 0/0 */}
                    <ProgressBar value={0} max={0} done={session.status?.toLowerCase() === "completed"} />
                  </td>
                  <td className={`py-4 px-4 text-center ${COL.chenhlech}`}>
                    <DiscrepancyBadge count={session.totalDiscrepancies ?? 0} />
                  </td>
                  <td className={`py-4 px-4 text-center ${COL.trangthai}`}>
                    <StatusBadge status={session.status?.toLowerCase() === "completed" ? "completed" : "in-progress"} />
                  </td>
                  <td className={`py-4 px-4 text-right ${COL.action}`}>
                    <Button 
                      variant={session.status?.toLowerCase() === "completed" ? "outline" : "primary"} 
                      size="sm"
                      onClick={() => handleOpenCheckFromTable(session)}
                    >
                      {session.status?.toLowerCase() === "completed" ? (
                        <>
                          <Eye className="w-3.5 h-3.5 mr-1" />Chi tiết
                        </>
                      ) : (
                        <>
                          <ClipboardCheck className="w-3.5 h-3.5 mr-1" />Bắt đầu
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION ── */}
        <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between">
          {/* left: count info */}
          <p className="text-xs text-gray-400 tabular-nums">
            Hiển thị{' '}
            <span className="font-semibold text-gray-600">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, allSessions.length)}
            </span>
            {' '}/ {allSessions.length} phiếu
          </p>

          {/* right: page controls */}
          <div className="flex items-center gap-1">
            {/* prev */}
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* page numbers */}
            {pageNumbers.map((p, idx) =>
              p === '…' ? (
                <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p as number)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === p
                      ? 'bg-blue-600 text-white border border-blue-600'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {p}
                </button>
              )
            )}

            {/* next */}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL A — Kiểm tra tồn kho
      ══════════════════════════════════════════════════════════════════ */}
      {showCheckModal && !showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal} />
          <div
            className="relative z-10 bg-white rounded-2xl w-full max-w-3xl flex flex-col max-h-[92vh]"
            style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}
          >
            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">Kiểm tra tồn kho</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {checkedCount > 0
                    ? `${checkedCount}/${inventoryItems.length} sản phẩm đã kiểm · ${discrepancyCount > 0 ? `${discrepancyCount} chênh lệch` : 'Không có chênh lệch'}`
                    : `${inventoryItems.length} sản phẩm cần kiểm`}
                </p>
              </div>
              <button onClick={handleCloseModal} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* info banner */}
            <div className={`mx-5 mt-4 flex items-start gap-2.5 rounded-xl px-4 py-3 border ${
              discrepancyCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'
            }`}>
              <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${discrepancyCount > 0 ? 'text-orange-500' : 'text-blue-500'}`} />
              <p className={`text-sm ${discrepancyCount > 0 ? 'text-orange-800' : 'text-blue-800'}`}>
                {discrepancyCount > 0
                  ? `Có ${discrepancyCount} sản phẩm chênh lệch. Vui lòng kiểm tra lại trước khi hoàn thành.`
                  : 'Kiểm tra và nhập số lượng thực tế của các sản phẩm. Hệ thống sẽ so sánh với số lượng trong kho.'}
              </p>
            </div>

            {modalError && (
              <div className="mx-5 mt-3 rounded-xl px-4 py-3 border bg-red-50 border-red-200">
                <p className="text-sm text-red-700">{modalError}</p>
              </div>
            )}

            {/* search + filter */}
            <div className="mx-5 mt-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên sản phẩm hoặc SKU..."
                  value={modalSearch}
                  onChange={e => setModalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div className="relative flex-shrink-0">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <select
                  value={modalCategory}
                  onChange={e => setModalCategory(e.target.value)}
                  className="pl-8 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition cursor-pointer text-gray-700"
                >
                  <option value="all">Tất cả danh mục</option>
                  {categories.filter(c => c !== 'all').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* product table */}
            <div className="mx-5 mt-3 flex-1 overflow-y-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 w-[220px]">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sản phẩm</span>
                    </th>
                    <th className="text-center py-3 px-3 w-[100px]">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</span>
                    </th>
                    <th className="text-center py-3 px-3 w-[130px]">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SL Hệ thống</span>
                    </th>
                    <th className="text-center py-3 px-3 w-[130px]">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SL Thực tế</span>
                    </th>
                    <th className="text-center py-3 px-3 w-[110px]">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Chênh lệch</span>
                    </th>
                    <th className="py-3 px-2 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {modalLoading && (
                    <tr>
                      <td colSpan={6} className="py-14 text-center">
                        <p className="text-sm text-gray-500">Đang tải danh sách tồn kho...</p>
                      </td>
                    </tr>
                  )}
                  {filteredItems.map(item => {
                    const actual = checkItems.get(item.productId)
                    const checked = actual !== undefined
                    const diff    = checked ? actual - item.systemQty : null
                    const bad     = diff !== null && diff !== 0
                    const good    = diff !== null && diff === 0
                    return (
                      <tr
                        key={item.productId}
                        className={`transition-colors ${
                          bad  ? 'bg-orange-50/60 hover:bg-orange-50'
                          : good ? 'bg-green-50/30 hover:bg-green-50/50'
                          :        'hover:bg-gray-50/70'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-gray-900 text-sm leading-tight">{item.productName}</p>
                          <span className="inline-block mt-1 text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">{item.category}</span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md tracking-wide">{item.sku}</span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="font-semibold text-gray-800 tabular-nums text-sm">{item.systemQty}</span>
                          <span className="text-xs text-gray-400 ml-1">{item.unit}</span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={actual === undefined ? '' : actual}
                            onChange={e => handleQtyChange(item.productId, e.target.value)}
                            placeholder="—"
                            className={`w-28 px-3 py-2 border rounded-lg text-center text-sm font-semibold outline-none transition tabular-nums ${
                              bad  ? 'border-orange-400 bg-orange-50 text-orange-900 focus:ring-2 focus:ring-orange-400'
                              : good ? 'border-green-300 bg-green-50 text-green-900 focus:ring-2 focus:ring-green-400'
                              :        'border-gray-200 bg-white text-gray-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400'
                            }`}
                          />
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {checked ? (
                            diff === 0 ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />Khớp
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold tabular-nums ${
                                diff! > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-700'
                              }`}>
                                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                {diff! > 0 ? '+' : ''}{diff}
                              </span>
                            )
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          {checked ? (
                            <button
                              onClick={() => handleClearItem(item.productId)}
                              className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition mx-auto"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="w-6 h-6 inline-block" />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {!modalLoading && filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-14 text-center">
                        <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm text-gray-400">Không tìm thấy sản phẩm nào</p>
                        <p className="text-xs text-gray-300 mt-1">Thử thay đổi từ khóa hoặc danh mục</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* footer */}
            <div className="px-5 py-4 border-t border-gray-100 mt-1">
              {/* progress cards */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl px-4 py-3 text-center border border-gray-100">
                  <p className="text-xl font-bold text-gray-900 tabular-nums">{checkedCount}</p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />Đã kiểm tra
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3 text-center border border-gray-100">
                  <p className="text-xl font-bold text-gray-900 tabular-nums">{inventoryItems.length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Tổng sản phẩm</p>
                </div>
                <div className={`rounded-xl px-4 py-3 text-center border ${
                  discrepancyCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'
                }`}>
                  <p className={`text-xl font-bold tabular-nums ${discrepancyCount > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                    {discrepancyCount}
                  </p>
                  <p className={`text-xs mt-0.5 flex items-center justify-center gap-1 ${discrepancyCount > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                    {discrepancyCount > 0 && <AlertTriangle className="w-3 h-3" />}
                    Chênh lệch
                  </p>
                </div>
              </div>

              {/* progress bar */}
              <div className="mb-4">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${inventoryItems.length > 0 ? (checkedCount / inventoryItems.length) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5 text-right tabular-nums">
                  {inventoryItems.length > 0 ? Math.round((checkedCount / inventoryItems.length) * 100) : 0}% hoàn thành
                </p>
              </div>

              {/* action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCompleteClick}
                  disabled={checkedCount === 0}
                  className={`flex-1 flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-colors text-sm ${
                    checkedCount > 0
                      ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Hoàn thành kiểm tra
                </button>
                <button
                  onClick={handleCloseModal}
                  className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL B — Xác nhận hoàn thành (khi có chênh lệch)
      ══════════════════════════════════════════════════════════════════ */}
      {showCheckModal && showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div
            className="relative z-10 bg-white rounded-2xl w-full max-w-md flex flex-col"
            style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}
          >
            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Xác nhận hoàn thành kiểm kê</h2>
              </div>
              <button onClick={() => setShowConfirm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* body */}
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-4">
                Có <strong className="text-orange-600">{discrepancyCount} sản phẩm</strong> chênh lệch so với số liệu hệ thống. Bạn có chắc muốn hoàn thành?
              </p>
              <div className="rounded-xl border border-orange-200 bg-orange-50 overflow-hidden">
                <div className="px-4 py-2.5 bg-orange-100 border-b border-orange-200">
                  <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide">Danh sách sản phẩm chênh lệch</p>
                </div>
                <div className="divide-y divide-orange-100 max-h-52 overflow-y-auto">
                  {discrepancyItems.map(item => {
                    const actual = checkItems.get(item.id)!
                    const diff   = actual - item.systemQty
                    return (
                      <div key={item.id} className="flex items-center justify-between px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.productName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Hệ thống: {item.systemQty} {item.unit} → Thực tế: {actual} {item.unit}
                          </p>
                        </div>
                        <span className={`ml-3 flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums ${
                          diff > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-700'
                        }`}>
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          {diff > 0 ? '+' : ''}{diff}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* footer */}
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={handleFinalSubmit}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Xác nhận hoàn thành
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Quay lại chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL — Chi tiết kiểm kê (Details View)
      ══════════════════════════════════════════════════════════════════ */}
      {showDetailsModal && selectedCheckForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetailsModal(false)} />
          <div
            className="relative z-10 bg-white rounded-2xl w-full max-w-2xl flex flex-col max-h-[92vh]"
            style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}
          >
            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">Chi tiết kiểm kê</h2>
                <p className="text-xs text-gray-400 mt-0.5">{selectedCheckForDetails.checkNumber}</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Phiếu</p>
                  <p className="text-sm text-gray-900 font-semibold mt-1">{selectedCheckForDetails.checkNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Ngày</p>
                  <p className="text-sm text-gray-900 font-semibold mt-1">{selectedCheckForDetails.checkDate?.slice(0, 10)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Người kiểm</p>
                  <p className="text-sm text-gray-900 font-semibold mt-1">{getUserName(selectedCheckForDetails.checkedBy)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Chênh lệch</p>
                  <p className="text-sm text-gray-900 font-semibold mt-1">{selectedCheckForDetails.totalDiscrepancies ?? 0}</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Trạng thái</p>
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3" /> Hoàn thành
                  </span>
                </div>
              </div>
            </div>

            {/* footer */}
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}