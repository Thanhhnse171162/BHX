'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { DataTable } from '@/shared/ui/DataTable'
import Modal from '@/shared/ui/Modal'

type CouponStatus = 'active' | 'scheduled' | 'expired' | 'disabled'
type CouponType = 'percentage' | 'fixed_amount'

interface Coupon {
  id: string
  code: string
  name: string
  description?: string
  type: CouponType
  discountValue: number
  minPurchaseAmount?: number
  maxDiscountAmount?: number
  startDate: string
  endDate: string
  status: CouponStatus
  usageLimit?: number
  usageCount: number
  createdAt: string
}

interface CouponFormState {
  code: string
  name: string
  description: string
  type: CouponType
  discountValue: number
  minPurchaseAmount: number
  maxDiscountAmount: number
  startDate: string
  endDate: string
  usageLimit: number
  status: CouponStatus
}

const statusLabels: Record<CouponStatus, string> = {
  active: 'Đang hoạt động',
  scheduled: 'Đã lên lịch',
  expired: 'Hết hạn',
  disabled: 'Tạm ngừng',
}

const statusColors: Record<CouponStatus, string> = {
  active: 'bg-green-100 text-green-800',
  scheduled: 'bg-blue-100 text-blue-800',
  expired: 'bg-gray-100 text-gray-700',
  disabled: 'bg-red-100 text-red-800',
}

const typeLabels: Record<CouponType, string> = {
  percentage: 'Giảm theo %',
  fixed_amount: 'Giảm số tiền',
}

function createInitialForm(): CouponFormState {
  const today = new Date().toISOString().slice(0, 10)
  return {
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    discountValue: 10,
    minPurchaseAmount: 0,
    maxDiscountAmount: 0,
    startDate: today,
    endDate: today,
    usageLimit: 0,
    status: 'scheduled',
  }
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | CouponStatus>('all')
  const [filterType, setFilterType] = useState<'all' | CouponType>('all')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CouponFormState>(createInitialForm)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem('demo-coupons')
    if (!raw) {
      const seed: Coupon[] = [
        {
          id: 'cp-1',
          code: 'WELCOME10',
          name: 'Giảm 10% cho đơn đầu tiên',
          description: 'Áp dụng cho khách hàng mới, tối đa 50.000đ',
          type: 'percentage',
          discountValue: 10,
          maxDiscountAmount: 50000,
          minPurchaseAmount: 200000,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          usageLimit: 1000,
          usageCount: 123,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'cp-2',
          code: 'SAVE50K',
          name: 'Giảm 50.000đ cho đơn từ 500.000đ',
          description: '',
          type: 'fixed_amount',
          discountValue: 50000,
          minPurchaseAmount: 500000,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled',
          usageLimit: 300,
          usageCount: 0,
          createdAt: new Date().toISOString(),
        },
      ]
      setCoupons(seed)
      window.localStorage.setItem('demo-coupons', JSON.stringify(seed))
      return
    }
    try {
      setCoupons(JSON.parse(raw) as Coupon[])
    } catch {
      setCoupons([])
    }
  }, [])

  const syncCoupons = (next: Coupon[]) => {
    setCoupons(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('demo-coupons', JSON.stringify(next))
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return coupons.filter((c) => {
      const matchesSearch =
        !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
      const matchesStatus = filterStatus === 'all' || c.status === filterStatus
      const matchesType = filterType === 'all' || c.type === filterType
      return matchesSearch && matchesStatus && matchesType
    })
  }, [coupons, search, filterStatus, filterType])

  const totalCoupons = coupons.length
  const activeCoupons = coupons.filter((c) => c.status === 'active').length
  const totalUsage = coupons.reduce((sum, c) => sum + c.usageCount, 0)

  const openCreate = () => {
    setMode('create')
    setEditingId(null)
    setForm(createInitialForm())
    setIsModalOpen(true)
  }

  const openEdit = (coupon: Coupon) => {
    setMode('edit')
    setEditingId(coupon.id)
    setForm({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      type: coupon.type,
      discountValue: coupon.discountValue,
      minPurchaseAmount: coupon.minPurchaseAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      startDate: coupon.startDate.slice(0, 10),
      endDate: coupon.endDate.slice(0, 10),
      usageLimit: coupon.usageLimit || 0,
      status: coupon.status,
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
  }

  const handleChange = (patch: Partial<CouponFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code || !form.name) return

    const base: Coupon = {
      id: editingId || `cp-${Date.now()}`,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      type: form.type,
      discountValue: form.discountValue,
      minPurchaseAmount: form.minPurchaseAmount || undefined,
      maxDiscountAmount: form.maxDiscountAmount || undefined,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      status: form.status,
      usageLimit: form.usageLimit || undefined,
      usageCount: editingId ? coupons.find((c) => c.id === editingId)?.usageCount || 0 : 0,
      createdAt: editingId ? coupons.find((c) => c.id === editingId)!.createdAt : new Date().toISOString(),
    }

    if (mode === 'create') {
      syncCoupons([base, ...coupons])
    } else if (mode === 'edit' && editingId) {
      syncCoupons(coupons.map((c) => (c.id === editingId ? base : c)))
    }
    closeModal()
  }

  const handleDelete = (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa coupon này?')) return
    syncCoupons(coupons.filter((c) => c.id !== id))
  }

  const handleToggleStatus = (id: string) => {
    const next: Coupon[] = coupons.map((c) =>
      c.id === id
        ? {
            ...c,
            status: c.status === 'active' ? 'disabled' : 'active',
          }
        : c
    )
    syncCoupons(next)
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Mã giảm giá"
        subtitle="Quản lý mã coupon giảm giá cho khách hàng"
        breadcrumbs={[
          { label: 'Quản trị', href: '/admin' },
          { label: 'Khuyến mãi', href: '/admin/promotions' },
          { label: 'Mã giảm giá', href: '/admin/promotions/coupons' },
        ]}
        actions={
          <Button onClick={openCreate}>
            + Tạo coupon
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Tổng coupon</div>
          <div className="text-2xl font-bold text-gray-900">{totalCoupons}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Đang hoạt động</div>
          <div className="text-2xl font-bold text-green-600">{activeCoupons}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Tổng lượt sử dụng</div>
          <div className="text-2xl font-bold text-purple-600">{totalUsage}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Tìm theo mã hoặc tên coupon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | CouponStatus)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="scheduled">Đã lên lịch</option>
              <option value="expired">Hết hạn</option>
              <option value="disabled">Tạm ngừng</option>
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | CouponType)}
            >
              <option value="all">Tất cả loại</option>
              <option value="percentage">% giảm giá</option>
              <option value="fixed_amount">Giảm số tiền</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <EmptyState
            title="Không có coupon"
            description={search || filterStatus !== 'all' || filterType !== 'all'
              ? 'Không tìm thấy coupon phù hợp với bộ lọc'
              : 'Tạo coupon đầu tiên của bạn'}
            action={
              search || filterStatus !== 'all' || filterType !== 'all'
                ? undefined
                : <Button onClick={openCreate}>+ Tạo coupon</Button>
            }
          />
        ) : (
          <DataTable
            data={filtered}
            columns={[
              {
                key: 'code',
                label: 'Mã coupon',
                render: (v, item) => {
                  const c = item as Coupon
                  return (
                    <div>
                      <div className="font-semibold text-gray-900">{v as string}</div>
                      <div className="text-xs text-gray-500">{c.name}</div>
                    </div>
                  )
                },
              },
              {
                key: 'type',
                label: 'Loại',
                render: (v) => {
                  const t = v as CouponType
                  return <span className="text-sm text-gray-700">{typeLabels[t]}</span>
                },
              },
              {
                key: 'discountValue',
                label: 'Giá trị',
                render: (v, item) => {
                  const c = item as Coupon
                  return c.type === 'percentage' ? (
                    <span className="font-semibold text-gray-900">{v}%</span>
                  ) : (
                    <span className="font-semibold text-gray-900">
                      {Number(v).toLocaleString('vi-VN')} ₫
                    </span>
                  )
                },
              },
              {
                key: 'startDate',
                label: 'Thời gian',
                render: (_v, item) => {
                  const c = item as Coupon
                  return (
                    <div className="text-xs text-gray-700">
                      <div>{new Date(c.startDate).toLocaleDateString('vi-VN')}</div>
                      <div className="text-gray-500">
                        đến {new Date(c.endDate).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  )
                },
              },
              {
                key: 'usageCount',
                label: 'Sử dụng',
                render: (v, item) => {
                  const c = item as Coupon
                  return (
                    <div className="text-sm text-gray-700">
                      {v}
                      {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                    </div>
                  )
                },
              },
              {
                key: 'status',
                label: 'Trạng thái',
                render: (v) => {
                  const s = v as CouponStatus
                  return (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[s]}`}>
                      {statusLabels[s]}
                    </span>
                  )
                },
              },
              {
                key: 'id',
                label: 'Thao tác',
                render: (_v, item) => {
                  const c = item as Coupon
                  return (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(c.id)}
                      >
                        {c.status === 'active' ? 'Tạm ngừng' : 'Kích hoạt'}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(c.id)}>
                        Xóa
                      </Button>
                    </div>
                  )
                },
              },
            ]}
          />
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={mode === 'create' ? 'Tạo coupon mới' : 'Chỉnh sửa coupon'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>
              Hủy
            </Button>
            <Button onClick={handleSubmit}>Lưu</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Mã coupon"
              value={form.code}
              onChange={(e) => handleChange({ code: e.target.value })}
              required
            />
            <Input
              label="Tên chiến dịch"
              value={form.name}
              onChange={(e) => handleChange({ name: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Mô tả</label>
            <textarea
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={form.description}
              onChange={(e) => handleChange({ description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Loại giảm giá</label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={form.type}
                onChange={(e) => handleChange({ type: e.target.value as CouponType })}
              >
                <option value="percentage">% giảm giá</option>
                <option value="fixed_amount">Giảm số tiền</option>
              </select>
            </div>
            <Input
              label={form.type === 'percentage' ? 'Giá trị (%)' : 'Giá trị (VNĐ)'}
              type="number"
              value={form.discountValue}
              onChange={(e) => handleChange({ discountValue: Number(e.target.value) })}
              min={1}
              required
            />
            <Input
              label="Giới hạn sử dụng (0 = không giới hạn)"
              type="number"
              value={form.usageLimit}
              onChange={(e) => handleChange({ usageLimit: Number(e.target.value) })}
              min={0}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Giá trị đơn tối thiểu (VNĐ)"
              type="number"
              value={form.minPurchaseAmount}
              onChange={(e) => handleChange({ minPurchaseAmount: Number(e.target.value) })}
              min={0}
            />
            <Input
              label="Giảm tối đa (VNĐ)"
              type="number"
              value={form.maxDiscountAmount}
              onChange={(e) => handleChange({ maxDiscountAmount: Number(e.target.value) })}
              min={0}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Ngày bắt đầu"
              type="date"
              value={form.startDate}
              onChange={(e) => handleChange({ startDate: e.target.value })}
              required
            />
            <Input
              label="Ngày kết thúc"
              type="date"
              value={form.endDate}
              onChange={(e) => handleChange({ endDate: e.target.value })}
              required
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Trạng thái</label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={form.status}
                onChange={(e) => handleChange({ status: e.target.value as CouponStatus })}
              >
                <option value="scheduled">Đã lên lịch</option>
                <option value="active">Đang hoạt động</option>
                <option value="disabled">Tạm ngừng</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}


