'use client'

import { useState, useEffect } from 'react'
import { Edit2 } from 'lucide-react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { DataTable } from '@/shared/ui/DataTable'
import Modal from '@/shared/ui/Modal'
import { useAuthStore } from '@/store/auth.store'
import { InventoryAPIService } from '@/services/inventory-api.service'
import { ProductAPIService, ProductFromAPI } from '@/services/product-api.service'

interface InventoryItem {
  id: string
  sku: string
  productName: string
  unit?: string
  locationType: 'WAREHOUSE' | 'STORE'
  locationName: string
  quantity: number
  minStock: number
  maxStock: number
  lastUpdated: string
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
}

interface LocationOption {
  id: string
  name: string
  locationType: 'WAREHOUSE' | 'STORE'
}

const ITEMS_PER_PAGE = 10

const statusLabels = {
  IN_STOCK: 'Còn Hàng',
  LOW_STOCK: 'Hàng Thấp',
  OUT_OF_STOCK: 'Hết Hàng',
}

const statusColors = {
  IN_STOCK: 'bg-green-100 text-green-800',
  LOW_STOCK: 'bg-yellow-100 text-yellow-800',
  OUT_OF_STOCK: 'bg-red-100 text-red-800',
}

export default function InventoryOverviewPage() {
  const token = useAuthStore((s) => s.token)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [productId, setProductId] = useState('')
  const [productName, setProductName] = useState('')
  const [locationType, setLocationType] = useState<'WAREHOUSE' | 'STORE'>('WAREHOUSE')
  const [locationName, setLocationName] = useState('')
  const [locationId, setLocationId] = useState('')
  const [quantity, setQuantity] = useState(0)
  const [minStock, setMinStock] = useState(0)
  const [maxStock, setMaxStock] = useState(0)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([])
  const [products, setProducts] = useState<ProductFromAPI[]>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Min stock modal state
  const [isMinStockModalOpen, setIsMinStockModalOpen] = useState(false)
  const [minStockEditingId, setMinStockEditingId] = useState<string | null>(null)
  const [minStockEditValue, setMinStockEditValue] = useState(0)
  const [isUpdatingMinStock, setIsUpdatingMinStock] = useState(false)
  const [minStockError, setMinStockError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const detectLocationType = (raw: any): 'WAREHOUSE' | 'STORE' => {
    const explicit = String(raw?.locationType || raw?.type || raw?.warehouseType || '').toUpperCase()
    if (explicit === 'STORE') return 'STORE'
    if (explicit === 'WAREHOUSE') return 'WAREHOUSE'

    const id = String(raw?.id || '').trim().toLowerCase()
    if (id.startsWith('b')) return 'STORE'
    return 'WAREHOUSE'
  }

  // Load inventory từ localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem('demo-inventory')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as InventoryItem[]
      setInventory(parsed)
    } catch {
      // ignore parse error
    }
  }, [])

  // Load products từ API
  useEffect(() => {
    let cancelled = false

    const fetchProducts = async () => {
      setIsLoadingProducts(true)
      try {
        const productList = await ProductAPIService.getAllProducts()
        if (!cancelled) {
          setProducts(productList)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        if (!cancelled) {
          setProducts([])
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProducts(false)
        }
      }
    }

    fetchProducts()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const fetchLocations = async () => {
      setIsLoadingLocations(true)
      try {
        const response = await fetch('/api/warehouses', {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        })

        const payload = await response.json().catch(() => null)
        const list =
          Array.isArray(payload?.data) ? payload.data :
          Array.isArray(payload) ? payload :
          []

        const mapped: LocationOption[] = list
          .map((item: any) => ({
            id: String(item?.id || '').trim(),
            name: String(item?.name || item?.location || item?.code || item?.id || '').trim(),
            locationType: detectLocationType(item),
          }))
          .filter((item: LocationOption) => item.name)

        if (!cancelled) {
          setLocationOptions(mapped)
        }
      } catch {
        if (!cancelled) {
          setLocationOptions([])
        }
      } finally {
        if (!cancelled) {
          setIsLoadingLocations(false)
        }
      }
    }

    fetchLocations()

    return () => {
      cancelled = true
    }
  }, [token])

  const syncInventory = (next: InventoryItem[]) => {
    setInventory(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('demo-inventory', JSON.stringify(next))
    }
  }

  const calculateStatus = (qty: number, min: number): InventoryItem['status'] => {
    if (qty === 0) return 'OUT_OF_STOCK'
    if (qty <= min) return 'LOW_STOCK'
    return 'IN_STOCK'
  }

  const handleOpenCreate = () => {
    setMode('create')
    setEditingId(null)
    setProductId('')
    setProductName('')
    setLocationType('WAREHOUSE')
    setLocationName('')
    setLocationId('')
    setQuantity(0)
    setMinStock(0)
    setMaxStock(0)
    setSubmitError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setProductId('')
    setProductName('')
    setLocationType('WAREHOUSE')
    setLocationName('')
    setLocationId('')
    setQuantity(0)
    setMinStock(0)
    setMaxStock(0)
    setEditingId(null)
    setSubmitError(null)
  }



  const handleEditMinStockClick = (item: InventoryItem) => {
    setMinStockEditingId(item.id)
    setMinStockEditValue(item.minStock)
    setMinStockError(null)
    setIsMinStockModalOpen(true)
  }

  const handleCloseMinStockModal = () => {
    setIsMinStockModalOpen(false)
    setMinStockEditingId(null)
    setMinStockEditValue(0)
    setMinStockError(null)
  }

  const handleUpdateMinStock = async () => {
    if (!minStockEditingId) return

    setIsUpdatingMinStock(true)
    setMinStockError(null)

    try {
      await InventoryAPIService.updateMinStockLevel(minStockEditingId, minStockEditValue)

      // Update local inventory state
      setInventory(
        inventory.map((item) =>
          item.id === minStockEditingId
            ? { ...item, minStock: minStockEditValue }
            : item
        )
      )

      handleCloseMinStockModal()
    } catch (error: any) {
      console.error('Error updating min stock level:', error)
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to update min stock level. Please try again.'
      setMinStockError(errorMessage)
    } finally {
      setIsUpdatingMinStock(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!productId || !locationId) {
      setSubmitError('Please fill in all required fields including Product ID and Location')
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'create') {
        // Gọi API check-or-create
        await InventoryAPIService.checkOrCreateInventory({
          productId,
          locationType,
          locationId,
          quantity,
          minStockLevel: minStock,
          maxStockLevel: maxStock,
        })

        // After successful API call, also add to local state for immediate display
        const selectedProduct = products.find((p) => p.id === productId)
        const newItem: InventoryItem = {
          id: `inv-${Date.now()}`,
          sku: selectedProduct?.sku || '',
          productName,
          unit: undefined,
          locationType,
          locationName,
          quantity,
          minStock,
          maxStock,
          lastUpdated: new Date().toISOString(),
          status: calculateStatus(quantity, minStock),
        }
        syncInventory([...inventory, newItem])
      } else if (mode === 'edit' && editingId) {
        // For edit mode, use updateInventory
        await InventoryAPIService.updateInventory(editingId, {
          productId,
          quantity,
          minStockLevel: minStock,
          maxStockLevel: maxStock,
          locationType,
          locationId,
        } as any)

        // Update local state
        syncInventory(
          inventory.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  productName,
                  locationType,
                  locationName,
                  quantity,
                  minStock,
                  maxStock,
                  lastUpdated: new Date().toISOString(),
                  status: calculateStatus(quantity, minStock),
                }
              : item
          )
        )
      }

      handleCloseModal()
    } catch (error: any) {
      console.error('Error submitting inventory:', error)
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to save inventory item. Please try again.'
      setSubmitError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const createButton = (
    <Button onClick={handleOpenCreate}>Thêm Tồn Kho</Button>
  )

  const filteredLocationOptions = locationOptions.filter((loc) => loc.locationType === locationType)

  return (
    <div className="p-6">
      <PageHeader
        title="Tổng Quan Tồn Kho"
        subtitle="Quản lý mức tồn kho và hàng tồn kho trên các kho và cửa hàng"
        actions={createButton}
        breadcrumbs={[
          { label: 'Quản Trị', href: '/admin' },
          { label: 'Kho & Tồn Kho', href: '/admin/inventory' },
          { label: 'Tổng Quan Tồn Kho', href: '/admin/inventory' },
        ]}
      />

      <div className="card">
        {inventory.length === 0 ? (
          <EmptyState
            title="Không có Bản Ghi Tồn Kho"
            description="Bắt đầu theo dõi tồn kho cho sản phẩm của bạn"
            action={createButton}
          />
        ) : (
          <div>
            <DataTable
              data={(() => {
                const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
                const endIndex = startIndex + ITEMS_PER_PAGE
                return inventory.slice(startIndex, endIndex) as unknown as Record<string, unknown>[]
              })()}
              columns={[
                {
                  key: 'productName',
                  label: 'Sản Phẩm',
                render: (_value, item) => {
                  const inv = item as unknown as InventoryItem
                  // Find the product to get SKU if available
                  const product = products.find((p) => p.name === inv.productName)
                  return (
                    <div>
                      <div className="text-sm font-medium text-gray-900">{inv.productName}</div>
                      {product && (
                        <div className="text-xs text-gray-500">{product.sku}</div>
                      )}
                    </div>
                  )
                },
              },
              {
                key: 'locationType',
                label: 'Vị Trí',
                render: (_value, item) => {
                  const inv = item as unknown as InventoryItem
                  return (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {inv.locationName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {inv.locationType === 'WAREHOUSE' ? 'Warehouse' : 'Store'}
                      </div>
                    </div>
                  )
                },
              },
              {
                key: 'quantity',
                label: 'Số Lượng',
                render: (value: unknown) => {
                  return <span className="font-semibold text-gray-900">{String(value)}</span>
                },
              },
              {
                key: 'minStock',
                label: 'Tồn Kho Tối Thiểu / Tối Đa',
                render: (_value, item) => {
                  const inv = item as unknown as InventoryItem
                  return (
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Min: {inv.minStock}</div>
                        <div className="text-sm text-gray-500">Max: {inv.maxStock}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditMinStockClick(inv)
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors flex-shrink-0"
                        title="Edit minimum stock level"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  )
                },
              },
              {
                key: 'status',
                label: 'Trạng Thái',
                render: (value: unknown) => {
                  const status = value as InventoryItem['status']
                  return (
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}
                    >
                      {statusLabels[status]}
                    </span>
                  )
                },
              },
              {
                key: 'lastUpdated',
                label: 'Cập Nhật Lần Cuối',
                render: (value) => {
                  return new Date(value as string).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                },
              },

            ]}
            />
            
            {/* Pagination Controls */}
            {inventory.length > 0 && (
              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <div className="text-sm text-gray-600">
                  Hiển thị {Math.min(currentPage * ITEMS_PER_PAGE - ITEMS_PER_PAGE + 1, inventory.length)} - {Math.min(currentPage * ITEMS_PER_PAGE, inventory.length)} của {inventory.length}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Trang Trước
                  </Button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.ceil(inventory.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded text-sm ${
                          currentPage === page
                            ? 'bg-primary-500 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(inventory.length / ITEMS_PER_PAGE), p + 1))}
                    disabled={currentPage >= Math.ceil(inventory.length / ITEMS_PER_PAGE)}
                  >
                    Trang Tiếp
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={mode === 'create' ? 'Thêm Mục Tồn Kho' : 'Chỉnh Sửa Mục Tồn Kho'}
        size="md"
        footer={
          <div className="flex flex-col gap-3">
            {submitError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {submitError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Đang Lưu...' : 'Lưu'}
              </Button>
            </div>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Sản Phẩm*</label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={productId}
              onChange={(e) => {
                const selectedId = e.target.value
                setProductId(selectedId)
                const selectedProduct = products.find((p) => p.id === selectedId)
                if (selectedProduct) {
                  setProductName(selectedProduct.name)
                }
              }}
              required
              disabled={isLoadingProducts}
            >
              <option value="">{isLoadingProducts ? 'Đang tải sản phẩm...' : 'Chọn sản phẩm'}</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.sku} - {product.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Loại Vị Trí</label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={locationType}
              onChange={(e) => {
                const nextType = e.target.value as 'WAREHOUSE' | 'STORE'
                setLocationType(nextType)
                setLocationId('')
                setLocationName('')
                const nextOptions = locationOptions.filter((loc) => loc.locationType === nextType)
                if (nextOptions.length > 0) {
                  setLocationName(nextOptions[0].name)
                  setLocationId(nextOptions[0].id)
                }
              }}
            >
              <option value="WAREHOUSE">Kho</option>
              <option value="STORE">Cửa Hàng</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Tên Vị Trí*</label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={locationName}
              onChange={(e) => {
                const selectedName = e.target.value
                setLocationName(selectedName)
                const selectedLocation = locationOptions.find((loc) => loc.name === selectedName)
                if (selectedLocation) {
                  setLocationId(selectedLocation.id)
                }
              }}
              required
              disabled={isLoadingLocations}
            >
              <option value="">{isLoadingLocations ? 'Đang tải vị trí...' : 'Chọn vị trí'}</option>
              {filteredLocationOptions.map((loc) => (
                <option key={`${loc.locationType}-${loc.id}`} value={loc.name}>
                  {loc.name}
                </option>
              ))}
              {locationName && !filteredLocationOptions.some((loc) => loc.name === locationName) && (
                <option value={locationName}>{locationName}</option>
              )}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Số Lượng"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              placeholder="0"
              required
              min={0}
            />
            <Input
              label="Tồn Kho Tối Thiểu"
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(Number(e.target.value))}
              placeholder="0"
              required
              min={0}
            />
            <Input
              label="Tồn Kho Tối Đa"
              type="number"
              value={maxStock}
              onChange={(e) => setMaxStock(Number(e.target.value))}
              placeholder="0"
              required
              min={0}
            />
          </div>
        </form>
      </Modal>

      {/* Min Stock Level Modal */}
      <Modal
        isOpen={isMinStockModalOpen}
        onClose={handleCloseMinStockModal}
        title="Điều chỉnh mức tồn kho tối thiểu"
        size="sm"
        footer={
          <div className="flex flex-col gap-3">
            {minStockError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {minStockError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={handleCloseMinStockModal} disabled={isUpdatingMinStock}>
                Hủy
              </Button>
              <Button onClick={handleUpdateMinStock} disabled={isUpdatingMinStock}>
                {isUpdatingMinStock ? 'Đang Cập Nhật...' : 'Cập Nhật'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Mức tồn kho tối thiểu"
            type="number"
            value={minStockEditValue}
            onChange={(e) => setMinStockEditValue(Number(e.target.value))}
            placeholder="0"
            min={0}
            required
          />
          <p className="text-sm text-gray-500">
            Giá trị này xác định khi nào hàng tồn kho được coi là thấp.
          </p>
        </div>
      </Modal>
    </div>
  )
}

