'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { PageHeader } from '@/shared/ui/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { DataTable } from '@/shared/ui/DataTable'
import Modal from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'

interface OrderItem {
  productId: string
  name: string
  quantity: number
  price: number
  imageUrl?: string
}

interface OrderRow {
  id: string
  orderNumber: string
  orderType: 'ONLINE' | 'POS'
  customerName?: string
  customerPhone?: string
  totalAmount: number
  status: string
  storeName: string
  createdAt: string
  updatedAt: string
  items?: OrderItem[]
}

const DEFAULT_IMAGE = 'https://placehold.co/48x48?text=No+Image'

function OrderItemThumb({
  imageUrl,
  name,
  size,
  className,
}: {
  imageUrl?: string
  name: string
  size: number
  className?: string
}) {
  const [src, setSrc] = useState(imageUrl || DEFAULT_IMAGE)
  useEffect(() => {
    setSrc(imageUrl || DEFAULT_IMAGE)
  }, [imageUrl])
  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      className={className}
      unoptimized
      onError={() => setSrc(DEFAULT_IMAGE)}
    />
  )
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
  REFUNDED: 'Refunded',
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-green-100 text-green-800',
  REFUNDED: 'bg-orange-100 text-orange-800',
}

export default function AdminOrderStatusPage() {
  const [rows, setRows] = useState<OrderRow[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selected, setSelected] = useState<OrderRow | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Build productId → image_url map from demo-products
    const productImageMap: Record<string, string> = {}
    try {
      const productsRaw = window.localStorage.getItem('demo-products')
      if (productsRaw) {
        const products = JSON.parse(productsRaw) as Array<{
          id: string
          image_url?: string
          imageUrl?: string
        }>
        products.forEach((p) => {
          productImageMap[p.id] = p.image_url || p.imageUrl || DEFAULT_IMAGE
        })
      }
    } catch {
      // ignore
    }

    // Helper: enrich items with imageUrl
    const enrichItems = (items?: OrderItem[]): OrderItem[] =>
      (items || []).map((item) => ({
        ...item,
        imageUrl: productImageMap[item.productId] || DEFAULT_IMAGE,
      }))

    const onlineRaw = window.localStorage.getItem('demo-online-orders')
    const posRaw = window.localStorage.getItem('demo-pos-orders')
    const all: OrderRow[] = []

    if (onlineRaw) {
      try {
        const online = JSON.parse(onlineRaw) as Array<{
          id: string
          orderNumber: string
          customerName: string
          customerPhone: string
          totalAmount: number
          status: string
          storeName: string
          createdAt: string
          updatedAt: string
          items?: OrderItem[]
        }>
        online.forEach((o) =>
          all.push({
            id: o.id,
            orderNumber: o.orderNumber,
            orderType: 'ONLINE',
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            totalAmount: o.totalAmount,
            status: o.status,
            storeName: o.storeName,
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
            items: enrichItems(o.items),
          })
        )
      } catch {
        // ignore
      }
    }

    if (posRaw) {
      try {
        const pos = JSON.parse(posRaw) as Array<{
          id: string
          orderNumber: string
          customerName?: string
          customerPhone?: string
          totalAmount: number
          status: string
          storeName: string
          createdAt: string
          updatedAt: string
          items?: OrderItem[]
        }>
        pos.forEach((o) =>
          all.push({
            id: o.id,
            orderNumber: o.orderNumber,
            orderType: 'POS',
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            totalAmount: o.totalAmount,
            status: o.status,
            storeName: o.storeName,
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
            items: enrichItems(o.items),
          })
        )
      } catch {
        // ignore
      }
    }

    setRows(all)
  }, [])

  const filtered = rows.filter((r) => {
    const matchesSearch =
      r.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.customerPhone || '').includes(searchQuery)
    const matchesType = filterType === 'all' || r.orderType === filterType
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="p-6">
      <PageHeader
        title="Order Status"
        subtitle="Unified view of all orders (Online and POS) with status tracking"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Orders', href: '/admin/orders' },
          { label: 'Order Status', href: '/admin/orders' },
        ]}
      />

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by order number, customer name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="ONLINE">Online</option>
              <option value="POS">POS</option>
            </select>
          </div>
          <div>
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              {Object.entries(statusLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {sorted.length === 0 ? (
          <EmptyState title="No Orders" description="No orders found" />
        ) : (
          <DataTable
            data={sorted as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'orderNumber', label: 'Order Number' },
              {
                key: 'orderType',
                label: 'Type',
                render: (value) => {
                  const type = value as 'ONLINE' | 'POS'
                  return (
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        type === 'ONLINE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {type}
                    </span>
                  )
                },
              },
              {
                key: 'customerName',
                label: 'Customer',
                // ✅ Fix: item as unknown as OrderRow
                render: (_value, item) => {
                  const o = item as unknown as OrderRow
                  return (
                    <div>
                      <div className="font-medium text-gray-900">
                        {o.customerName ||
                          (o.orderType === 'POS' ? 'Walk-in' : 'N/A')}
                      </div>
                      {o.customerPhone ? (
                        <div className="text-xs text-gray-500">
                          {o.customerPhone}
                        </div>
                      ) : null}
                    </div>
                  )
                },
              },
              {
                key: 'items',
                label: 'Products',
                // ✅ Fix: item as unknown as OrderRow
                render: (_value, item) => {
                  const o = item as unknown as OrderRow
                  if (!o.items || o.items.length === 0)
                    return <span className="text-gray-400 text-xs">—</span>

                  const preview = o.items.slice(0, 3)
                  const overflow = o.items.length - preview.length

                  return (
                    <div className="flex items-center gap-1">
                      {preview.map((it, idx) => (
                        <div key={idx} className="relative group">
                          <OrderItemThumb
                            imageUrl={it.imageUrl}
                            name={it.name}
                            size={36}
                            className="w-9 h-9 rounded-md object-cover border border-gray-200 bg-gray-50"
                          />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
                            <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap max-w-[140px] truncate shadow-lg">
                              {it.name} x{it.quantity}
                            </div>
                          </div>
                        </div>
                      ))}
                      {overflow > 0 && (
                        <span className="w-9 h-9 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
                          +{overflow}
                        </span>
                      )}
                    </div>
                  )
                },
              },
              {
                key: 'totalAmount',
                label: 'Total Amount',
                render: (value) => (
                  <span className="font-semibold text-gray-900">
                    {Number(value).toLocaleString('vi-VN')} ₫
                  </span>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: (value) => (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      statusColors[value as string] ||
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {statusLabels[value as string] || (value as string)}
                  </span>
                ),
              },
              { key: 'storeName', label: 'Store' },
              {
                key: 'id',
                label: 'Actions',
                // ✅ Fix: item as unknown as OrderRow
                render: (_v, item) => {
                  const o = item as unknown as OrderRow
                  return (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelected(o)
                        setIsModalOpen(true)
                      }}
                    >
                      View Details
                    </Button>
                  )
                },
              },
            ]}
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Order Details: ${selected?.orderNumber || ''}`}
        size="md"
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {selected ? (
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg space-y-1">
              <div>
                <span className="text-gray-600">Type:</span>{' '}
                <span className="font-medium text-gray-900">
                  {selected.orderType}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>{' '}
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    statusColors[selected.status] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {statusLabels[selected.status] || selected.status}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Store:</span>{' '}
                <span className="font-medium text-gray-900">
                  {selected.storeName}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Created:</span>{' '}
                <span className="font-medium text-gray-900">
                  {new Date(selected.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>

            {selected.items && selected.items.length > 0 && (
              <div>
                <p className="font-semibold text-gray-700 mb-2">
                  Sản phẩm ({selected.items.length})
                </p>
                <ul className="space-y-2">
                  {selected.items.map((it, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 bg-white"
                    >
                      <OrderItemThumb
                        imageUrl={it.imageUrl}
                        name={it.name}
                        size={48}
                        className="w-12 h-12 rounded-md object-cover border border-gray-200 bg-gray-50 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {it.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          x{it.quantity} &nbsp;·&nbsp;{' '}
                          {it.price.toLocaleString('vi-VN')} ₫/sp
                        </p>
                      </div>
                      <span className="font-semibold text-gray-800 whitespace-nowrap">
                        {(it.price * it.quantity).toLocaleString('vi-VN')} ₫
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-gray-500 text-xs">
              Chi tiết đầy đủ: Online xem ở{' '}
              <span className="font-medium">/admin/orders/online</span>, POS xem
              ở <span className="font-medium">/admin/orders/pos</span>.
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}