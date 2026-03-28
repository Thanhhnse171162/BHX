'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { DataTable } from '@/shared/ui/DataTable'
import Modal from '@/shared/ui/Modal'

type CustomerStatus = 'ACTIVE' | 'INACTIVE'

interface CustomerRow {
  id: string
  fullName: string
  email: string
  phone: string
  address: string
  status: CustomerStatus
  loyaltyPoints: number
  totalOrders: number
  totalSpent: number
  createdAt: string
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [query, setQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | CustomerStatus>('all')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState<CustomerStatus>('ACTIVE')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const raw = window.localStorage.getItem('demo-customers')
    if (!raw) {
      const seed: CustomerRow[] = [
        {
          id: 'cust-1',
          fullName: 'Nguyễn Văn A',
          email: 'customer@bhx.vn',
          phone: '0909000000',
          address: 'TP.HCM',
          status: 'ACTIVE',
          loyaltyPoints: 120,
          totalOrders: 3,
          totalSpent: 530000,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'cust-2',
          fullName: 'Trần Thị B',
          email: 'tranthib@bhx.vn',
          phone: '0908123456',
          address: 'TP.HCM',
          status: 'ACTIVE',
          loyaltyPoints: 40,
          totalOrders: 1,
          totalSpent: 120000,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'cust-3',
          fullName: 'Lê Văn C',
          email: 'levanc@bhx.vn',
          phone: '0907555666',
          address: 'Bình Dương',
          status: 'INACTIVE',
          loyaltyPoints: 0,
          totalOrders: 0,
          totalSpent: 0,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]
      setCustomers(seed)
      window.localStorage.setItem('demo-customers', JSON.stringify(seed))
      return
    }

    try {
      const parsed = JSON.parse(raw) as CustomerRow[]
      setCustomers(parsed)
    } catch {
      setCustomers([])
    }
  }, [])

  const syncCustomers = (next: CustomerRow[]) => {
    setCustomers(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('demo-customers', JSON.stringify(next))
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return customers.filter((c) => {
      const matchesQuery =
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)

      const matchesStatus = filterStatus === 'all' || c.status === filterStatus
      return matchesQuery && matchesStatus
    })
  }, [customers, query, filterStatus])

  const openCreate = () => {
    setMode('create')
    setEditingId(null)
    setFullName('')
    setEmail('')
    setPhone('')
    setAddress('')
    setStatus('ACTIVE')
    setIsModalOpen(true)
  }

  const openEdit = (c: CustomerRow) => {
    setMode('edit')
    setEditingId(c.id)
    setFullName(c.fullName)
    setEmail(c.email)
    setPhone(c.phone)
    setAddress(c.address)
    setStatus(c.status)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this customer?')) return
    syncCustomers(customers.filter((c) => c.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName || !email || !phone) return

    if (mode === 'create') {
      const next: CustomerRow = {
        id: `cust-${Date.now()}`,
        fullName,
        email,
        phone,
        address,
        status,
        loyaltyPoints: 0,
        totalOrders: 0,
        totalSpent: 0,
        createdAt: new Date().toISOString(),
      }
      syncCustomers([next, ...customers])
      closeModal()
      return
    }

    if (mode === 'edit' && editingId) {
      const next = customers.map((c) =>
        c.id === editingId ? { ...c, fullName, email, phone, address, status } : c
      )
      syncCustomers(next)
      closeModal()
    }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Customers"
        subtitle="Manage customer profiles, loyalty, and activity"
        actions={<Button onClick={openCreate}>Create Customer</Button>}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Customers', href: '/admin/customers' },
        ]}
      />

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, or phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-52">
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | CustomerStatus)}
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <EmptyState
            title="No Customers"
            description={query || filterStatus !== 'all' ? 'No customers match your filters.' : 'Create your first customer.'}
            action={!query && filterStatus === 'all' ? <Button onClick={openCreate}>Create Customer</Button> : undefined}
          />
        ) : (
          <DataTable
            data={filtered}
            columns={[
              {
                key: 'fullName',
                label: 'Customer',
                render: (_v, item) => {
                  const c = item as CustomerRow
                  return (
                    <div>
                      <div className="font-semibold text-gray-900">{c.fullName}</div>
                      <div className="text-xs text-gray-500">{c.email}</div>
                      <div className="text-xs text-gray-500">{c.phone}</div>
                    </div>
                  )
                },
              },
              {
                key: 'status',
                label: 'Status',
                render: (_v, item) => {
                  const c = item as CustomerRow
                  return (
                    <select
                      className={`px-2 py-1 text-xs border border-gray-300 rounded-md bg-white`}
                      value={c.status}
                      onChange={(e) => {
                        const next = customers.map((x) =>
                          x.id === c.id ? { ...x, status: e.target.value as CustomerStatus } : x
                        )
                        syncCustomers(next)
                      }}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  )
                },
              },
              {
                key: 'loyaltyPoints',
                label: 'Loyalty',
                render: (v) => <span className="font-medium text-gray-900">{Number(v).toLocaleString('vi-VN')}</span>,
              },
              {
                key: 'totalOrders',
                label: 'Orders',
              },
              {
                key: 'totalSpent',
                label: 'Total Spent',
                render: (v) => <span className="font-semibold text-gray-900">{Number(v).toLocaleString('vi-VN')} ₫</span>,
              },
              {
                key: 'createdAt',
                label: 'Created At',
                render: (v) =>
                  new Date(v as string).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' }),
              },
              {
                key: 'id',
                label: 'Actions',
                render: (_v, item) => {
                  const c = item as CustomerRow
                  return (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(c.id)}>
                        Delete
                      </Button>
                    </div>
                  )
                },
              },
            ]}
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={mode === 'create' ? 'Create Customer' : 'Edit Customer'}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save</Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Optional" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={status}
              onChange={(e) => setStatus(e.target.value as CustomerStatus)}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="text-xs text-gray-500">
            Demo data is stored in <span className="font-medium">localStorage</span> (`demo-customers`). API integration can replace this later.
          </div>
        </form>
      </Modal>
    </div>
  )
}


