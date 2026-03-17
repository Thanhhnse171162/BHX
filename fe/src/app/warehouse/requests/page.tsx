'use client'

import { useState } from 'react'
import {
  Search,
  ChevronDown,
  SlidersHorizontal,
  Plus,
  X,
  MoreVertical,
  AlertTriangle,
  Package,
  Trash2,
} from 'lucide-react'

type Priority = 'High' | 'Medium' | 'Low'
type RequestStatus = 'Pending' | 'Approved' | 'Rejected'
type LocationType = 'Store' | 'DC'

interface ProductRow {
  id: number
  product: string
  currentQty: number
  requestQty: number
  reason: string
}

const MOCK_PRODUCTS = [
  'Ergonomic Office Chair - Grey',
  'Wireless Mechanical Keyboard',
  'USB-C Hub 7-in-1',
  'Standing Desk Mat',
  'Monitor Light Bar',
]

interface RestockRequest {
  id: string
  fromWarehouse: string
  toLocation: string
  type: LocationType
  priority: Priority
  status: RequestStatus
  date: string
  origin: string
  destination: string
  requestedBy: string
  approverNotes: string
  createdOn: string
}

const MOCK_REQUESTS: RestockRequest[] = [
  {
    id: 'RR-1001',
    fromWarehouse: 'DC - Ho Chi Minh',
    toLocation: 'Store Q1 - District 1',
    type: 'Store',
    priority: 'High',
    status: 'Pending',
    date: 'Oct 24, 2023',
    origin: 'DC - Ho Chi Minh (Main)',
    destination: 'Store Q1 - District 1',
    requestedBy: 'Nguyễn Văn Kho Tổng',
    approverNotes: 'Awaiting manager verification for urgent stock level shortage in District 1.',
    createdOn: 'Oct 24, 2023',
  },
  {
    id: 'RR-1002',
    fromWarehouse: 'Main Hub',
    toLocation: 'DC - Da Nang',
    type: 'DC',
    priority: 'Medium',
    status: 'Approved',
    date: 'Oct 23, 2023',
    origin: 'Main Hub',
    destination: 'DC - Da Nang',
    requestedBy: 'Trần Thị Phân Phối',
    approverNotes: 'Approved for scheduled transfer.',
    createdOn: 'Oct 23, 2023',
  },
  {
    id: 'RR-0988',
    fromWarehouse: 'DC - Hanoi',
    toLocation: 'Store HM - Ha Dong',
    type: 'Store',
    priority: 'Low',
    status: 'Rejected',
    date: 'Oct 21, 2023',
    origin: 'DC - Hanoi',
    destination: 'Store HM - Ha Dong',
    requestedBy: 'Lê Văn Nhập Hàng',
    approverNotes: 'Stock levels sufficient at destination. Request denied.',
    createdOn: 'Oct 21, 2023',
  },
]

const WAREHOUSES = ['DC - Ho Chi Minh', 'Main Hub', 'DC - Hanoi', 'DC - Da Nang', 'Central Warehouse']
const DESTINATIONS = ['Store Q1 - District 1', 'DC - Da Nang', 'Store HM - Ha Dong', 'DC - Hanoi']
const LOCATION_TYPES: LocationType[] = ['Store', 'DC']
const PRIORITIES: Priority[] = ['High', 'Medium', 'Low', 'Normal' as Priority]

function TypeBadge({ type }: { type: LocationType }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-gray-800 text-white">
      {type}
    </span>
  )
}

function PriorityLabel({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    High: 'text-red-500 font-semibold',
    Medium: 'text-orange-400 font-semibold',
    Low: 'text-gray-400 font-medium',
  }
  return (
    <span className={styles[priority]}>
      {priority === 'High' && <span className="mr-0.5">!</span>}
      {priority}
    </span>
  )
}

function StatusBadge({ status }: { status: RequestStatus }) {
  const styles: Record<RequestStatus, { dot: string; bg: string; text: string }> = {
    Pending: { dot: 'bg-yellow-400', bg: 'bg-yellow-50 border border-yellow-200', text: 'text-yellow-700' },
    Approved: { dot: 'bg-green-500', bg: 'bg-green-50 border border-green-200', text: 'text-green-700' },
    Rejected: { dot: 'bg-red-500', bg: 'bg-red-50 border border-red-200', text: 'text-red-700' },
  }
  const s = styles[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  )
}

function SelectField({ label, options, value, onChange }: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 pr-8"
        >
          <option value="">{options[0].startsWith('Select') ? options[0] : `Select ${label}`}</option>
          {options.filter(o => !o.startsWith('Select')).map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
      </div>
    </div>
  )
}

let nextId = 3

export default function WarehouseRequestsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [warehouseFilter, setWarehouseFilter] = useState('All Locations')
  const [showModal, setShowModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<RestockRequest>(MOCK_REQUESTS[0])

  // Modal form state
  const [fromWarehouse, setFromWarehouse] = useState('')
  const [toWarehouse, setToWarehouse] = useState('')
  const [fromLocType, setFromLocType] = useState('')
  const [toLocType, setToLocType] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [notes, setNotes] = useState('')
  const [productRows, setProductRows] = useState<ProductRow[]>([
    { id: 1, product: 'Ergonomic Office Chair - Grey', currentQty: 12, requestQty: 50, reason: 'Stock shortage for upcoming sale' },
    { id: 2, product: 'Wireless Mechanical Keyboard', currentQty: 5, requestQty: 20, reason: 'Replacement for damaged units' },
  ])

  const addProductRow = () => {
    nextId++
    setProductRows(rows => [...rows, { id: nextId, product: '', currentQty: 0, requestQty: 0, reason: '' }])
  }

  const removeProductRow = (id: number) => {
    setProductRows(rows => rows.filter(r => r.id !== id))
  }

  const updateRow = (id: number, field: keyof ProductRow, value: string | number) => {
    setProductRows(rows => rows.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const closeModal = () => {
    setShowModal(false)
    setFromWarehouse('')
    setToWarehouse('')
    setFromLocType('')
    setToLocType('')
    setPriority('Medium')
    setNotes('')
    setProductRows([
      { id: 1, product: 'Ergonomic Office Chair - Grey', currentQty: 12, requestQty: 50, reason: 'Stock shortage for upcoming sale' },
      { id: 2, product: 'Wireless Mechanical Keyboard', currentQty: 5, requestQty: 20, reason: 'Replacement for damaged units' },
    ])
  }

  const filtered = MOCK_REQUESTS.filter(r => {
    const matchSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.fromWarehouse.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All Status' || r.status === statusFilter
    const matchWarehouse = warehouseFilter === 'All Locations' || r.fromWarehouse === warehouseFilter
    return matchSearch && matchStatus && matchWarehouse
  })

  return (
    <div className="space-y-6">
      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
                  <Package size={12} className="text-white" />
                </span>
                <h2 className="text-base font-bold text-gray-900">Create New Restock Request</h2>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {/* Row 1: FROM WAREHOUSE / TO WAREHOUSE / PRIORITY */}
              <div className="grid grid-cols-3 gap-4">
                <SelectField
                  label="FROM WAREHOUSE"
                  options={['Select Source Warehouse', ...WAREHOUSES]}
                  value={fromWarehouse}
                  onChange={setFromWarehouse}
                />
                <SelectField
                  label="TO WAREHOUSE"
                  options={['Select Destination', ...DESTINATIONS]}
                  value={toWarehouse}
                  onChange={setToWarehouse}
                />
                <SelectField
                  label="PRIORITY"
                  options={['High', 'Medium', 'Low', 'Normal']}
                  value={priority}
                  onChange={setPriority}
                />
              </div>

              {/* Row 2: FROM LOCATION TYPE / TO LOCATION TYPE / NOTES */}
              <div className="grid grid-cols-3 gap-4">
                <SelectField
                  label="FROM LOCATION TYPE"
                  options={['Select Type', ...LOCATION_TYPES]}
                  value={fromLocType}
                  onChange={setFromLocType}
                />
                <SelectField
                  label="TO LOCATION TYPE"
                  options={['Select Type', ...LOCATION_TYPES]}
                  value={toLocType}
                  onChange={setToLocType}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">NOTES</label>
                  <textarea
                    rows={3}
                    placeholder="Reason for restock, specific instructions..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Requested Products */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package size={15} className="text-gray-500" />
                    <span className="font-semibold text-gray-800 text-sm">Requested Products</span>
                  </div>
                  <button
                    onClick={addProductRow}
                    className="flex items-center gap-1 text-green-600 text-sm font-medium hover:text-green-700 transition-colors"
                  >
                    <Plus size={15} />
                    Add Product
                  </button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">PRODUCT</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">CURRENT QTY</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">REQUEST QTY</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">REASON / NOTES</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {productRows.map((row, idx) => (
                        <tr key={row.id} className={idx !== productRows.length - 1 ? 'border-b border-gray-100' : ''}>
                          <td className="px-4 py-3">
                            <div className="relative">
                              <select
                                value={row.product}
                                onChange={e => updateRow(row.id, 'product', e.target.value)}
                                className="appearance-none border-0 bg-transparent text-sm text-gray-800 focus:outline-none pr-5 w-full"
                              >
                                <option value="">Select product</option>
                                {MOCK_PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{row.currentQty}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={row.requestQty}
                              onChange={e => updateRow(row.id, 'requestQty', parseInt(e.target.value) || 0)}
                              className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center text-green-600 font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={row.reason}
                              onChange={e => updateRow(row.id, 'reason', e.target.value)}
                              placeholder="Add reason..."
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

                  {/* Add another row */}
                  <div className="px-4 py-3 border-t border-gray-100">
                    <button
                      onClick={addProductRow}
                      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-green-600 transition-colors"
                    >
                      <Plus size={14} className="text-green-500" />
                      Add another row
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <span className="text-sm text-gray-500">
                Items requested: <span className="font-medium text-gray-700">{productRows.length} products total</span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={closeModal}
                  className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Save Draft
                </button>
                <button className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors">
                  Submit Restock Request
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restock Requests</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage warehouse transfer and supply requests across your distribution network.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Plus size={16} />
          Create Request
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by request number (e.g. RR-1001)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">STATUS</span>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none border border-gray-200 rounded-lg pl-3 pr-7 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {['All Status', 'Pending', 'Approved', 'Rejected'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>
        </div>

        {/* Warehouse filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">WAREHOUSE</span>
          <div className="relative">
            <select
              value={warehouseFilter}
              onChange={e => setWarehouseFilter(e.target.value)}
              className="appearance-none border border-gray-200 rounded-lg pl-3 pr-7 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option>All Locations</option>
              {WAREHOUSES.map(w => <option key={w}>{w}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>
        </div>

        <button className="ml-auto p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <SlidersHorizontal size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                REQUEST<br />ID
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                FROM<br />WAREHOUSE
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                TO LOCATION
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                PRIORITY
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                STATUS
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                DATE
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(req => (
              <tr
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 font-semibold text-gray-900">{req.id}</td>
                <td className="px-6 py-4 text-gray-700">{req.fromWarehouse}</td>
                <td className="px-6 py-4 text-gray-700">{req.toLocation}</td>
                <td className="px-6 py-4">
                  <PriorityLabel priority={req.priority} />
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={req.status} />
                </td>
                <td className="px-6 py-4 text-gray-500">{req.date}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={e => e.stopPropagation()}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    <MoreVertical size={16} className="text-gray-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-100">
          <span className="text-sm text-gray-500">Showing 1-10 of 124 results</span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors">
              Previous
            </button>
            <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Detail panel */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Request Details</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedRequest.id} • Created on {selectedRequest.createdOn}
              </p>
            </div>
            <StatusBadge status={selectedRequest.status} />
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">ORIGIN</p>
                <p className="text-sm font-medium text-gray-800">{selectedRequest.origin}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">DESTINATION</p>
                <p className="text-sm font-medium text-gray-800">{selectedRequest.destination}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">PRIORITY</p>
                <div className="flex items-center gap-1 text-sm">
                  {selectedRequest.priority === 'High' && (
                    <AlertTriangle size={14} className="text-red-500" />
                  )}
                  <PriorityLabel priority={selectedRequest.priority} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">REQUESTED BY</p>
                <p className="text-sm font-medium text-gray-800">{selectedRequest.requestedBy}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">APPROVER NOTES</p>
              <p className="text-sm text-gray-500 italic">{selectedRequest.approverNotes}</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button className="flex-1 border border-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                Reject
              </button>
              <button className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors">
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
