'use client'

import {
  Package,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Clock,
} from 'lucide-react'

export default function WarehouseManagerDashboard() {

  // Mock data
  const metrics = [
    {
      label: 'Total Products',
      value: '12,450',
      change: '+2.5%',
      trend: 'up',
      icon: Package,
      color: 'emerald',
    },
    {
      label: 'Total Stock',
      value: '856.2k',
      change: '+2%',
      trend: 'up',
      icon: Package,
      color: 'blue',
    },
    {
      label: 'Low Stock Items',
      value: '42',
      change: 'Critical',
      trend: 'down',
      icon: AlertTriangle,
      color: 'red',
    },
    {
      label: 'Store Refills',
      value: '18',
      change: 'Pending',
      trend: 'neutral',
      icon: RefreshCw,
      color: 'orange',
    },
    {
      label: 'Transfers',
      value: '7',
      change: 'Active',
      trend: 'neutral',
      icon: ArrowRight,
      color: 'purple',
    },
  ]

  const staffOnline = [
    { name: 'Mark Thompson', role: 'Floor Manager', status: 'online' },
    { name: 'Sarah Jenkins', role: 'Inventory Clerk', status: 'online' },
    { name: 'David Chen', role: 'Loading Bay Lead', status: 'online' },
    { name: 'Elena Rodriguez', role: 'Safety Officer', status: 'online' },
  ]

  const pendingRefills = [
    {
      id: 'Store #44-Downtown',
      items: '12 SKUs - Electronics, Home Office',
      status: 'urgent',
      urgency: 'URGENT',
    },
    {
      id: 'Store #12-Northside Mall',
      items: '42 SKUs - Apparel, Accessories',
      status: 'routine',
      urgency: 'ROUTINE',
    },
  ]

  const transferRequests = [
    {
      id: 'WH-2 East to WH-1',
      description: 'Requested: Today 16:00',
      item: 'Bulk Storage Pallets x120',
      status: 'in-transit',
    },
    {
      id: 'WH-1 to WH-4 Coastal',
      description: 'Requested: 2d Ago',
      item: 'Winter Season Stock (+650 units)',
      status: 'action-required',
    },
  ]

  const dailyMovementData = [
    { day: 'Mon', inbound: 210, outbound: 180 },
    { day: 'Tue', inbound: 260, outbound: 220 },
    { day: 'Wed', inbound: 190, outbound: 240 },
    { day: 'Thu', inbound: 340, outbound: 280 },
    { day: 'Fri', inbound: 310, outbound: 380 },
    { day: 'Sat', inbound: 240, outbound: 320 },
    { day: 'Sun', inbound: 280, outbound: 180 },
  ]

  const maxValue = Math.max(
    ...dailyMovementData.flatMap((d) => [d.inbound, d.outbound])
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operational Overview</h1>
          <p className="text-gray-600 mt-1">Real-time status for regional distribution</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg">
          {['Dashboard', 'Real-time Log', 'Audit'].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === 'Dashboard'
                  ? 'bg-[#2d6e3e] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    metric.color === 'emerald'
                      ? 'bg-emerald-50'
                      : metric.color === 'blue'
                      ? 'bg-blue-50'
                      : metric.color === 'red'
                      ? 'bg-red-50'
                      : metric.color === 'orange'
                      ? 'bg-orange-50'
                      : 'bg-purple-50'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      metric.color === 'emerald'
                        ? 'text-emerald-600'
                        : metric.color === 'blue'
                        ? 'text-blue-600'
                        : metric.color === 'red'
                        ? 'text-red-600'
                        : metric.color === 'orange'
                        ? 'text-orange-600'
                        : 'text-purple-600'
                    }`}
                  />
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    metric.trend === 'up'
                      ? 'text-emerald-700 bg-emerald-50'
                      : metric.trend === 'down'
                      ? 'text-red-700 bg-red-50'
                      : 'text-gray-700 bg-gray-100'
                  }`}
                >
                  {metric.change}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-500 mb-1">
                {metric.label}
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {metric.value}
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Stock Movement Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              Daily Stock Movement
            </h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#ff6b35] rounded"></div>
                <span className="text-gray-600">Inbound</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-300 rounded"></div>
                <span className="text-gray-600">Outbound</span>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {dailyMovementData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center gap-1 flex-1">
                  <div
                    className="w-full bg-[#ff6b35] rounded-t transition-all hover:opacity-80"
                    style={{
                      height: `${(data.inbound / maxValue) * 100}%`,
                      minHeight: '8px',
                    }}
                    title={`Inbound: ${data.inbound}`}
                  ></div>
                  <div
                    className="w-full bg-gray-300 rounded-t transition-all hover:opacity-80"
                    style={{
                      height: `${(data.outbound / maxValue) * 100}%`,
                      minHeight: '8px',
                    }}
                    title={`Outbound: ${data.outbound}`}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-600">
                  {data.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Online */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Staff Online</h2>
            <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              {staffOnline.length} Active
            </span>
          </div>
          <div className="space-y-3">
            {staffOnline.map((staff, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#2d6e3e] to-[#1e4d2b] rounded-full flex items-center justify-center text-white font-semibold">
                    {staff.name[0]}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {staff.name}
                  </div>
                  <div className="text-xs text-gray-500">{staff.role}</div>
                </div>
                <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 text-sm font-medium text-[#2d6e3e] hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-2">
            View All Staff
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Store Refills */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Pending Store Refills
            </h2>
            <button className="text-sm font-medium text-[#2d6e3e] hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {pendingRefills.map((refill, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{refill.id}</h3>
                    <p className="text-sm text-gray-600 mt-1">{refill.items}</p>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded ${
                      refill.status === 'urgent'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {refill.urgency}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex-1 px-4 py-2 bg-[#ff6b35] text-white text-sm font-medium rounded-lg hover:bg-[#e55a2a] transition-colors">
                    Approve
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transfer Requests */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Transfer Requests</h2>
            <button className="text-sm font-medium text-[#2d6e3e] hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {transferRequests.map((transfer, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      transfer.status === 'in-transit'
                        ? 'bg-blue-50'
                        : 'bg-orange-50'
                    }`}
                  >
                    {transfer.status === 'in-transit' ? (
                      <ArrowRight className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{transfer.id}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {transfer.description}
                    </p>
                    <p className="text-sm text-gray-700 mt-2">{transfer.item}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {transfer.status === 'in-transit' ? (
                    <span className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium text-center rounded-lg">
                      In Transit
                    </span>
                  ) : (
                    <>
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                        Accept
                      </button>
                      <button className="flex-1 px-4 py-2 bg-[#ff6b35] text-white text-sm font-medium rounded-lg hover:bg-[#e55a2a] transition-colors">
                        Action Required
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
