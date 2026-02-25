'use client'

import { useAuthStore } from '@/store/auth.store'

interface KPIMetric {
  name: string
  current: number
  target: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  percentage: number
}

const mockKPIs: KPIMetric[] = [
  {
    name: 'Tasks Completed',
    current: 87,
    target: 100,
    unit: 'tasks',
    trend: 'up',
    percentage: 87,
  },
  {
    name: 'Customer Satisfaction',
    current: 4.8,
    target: 5.0,
    unit: '/5',
    trend: 'up',
    percentage: 96,
  },
  {
    name: 'On-Time Rate',
    current: 95,
    target: 100,
    unit: '%',
    trend: 'stable',
    percentage: 95,
  },
  {
    name: 'Items Stocked',
    current: 1245,
    target: 1500,
    unit: 'items',
    trend: 'up',
    percentage: 83,
  },
]

export default function KPIPage() {
  const { user } = useAuthStore()

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button className="text-emerald-600 hover:text-emerald-700 mb-4 flex items-center gap-2">
          ← Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">KPI Details</h1>
            <p className="text-gray-600 mt-1">Performance Metrics for {user?.name}</p>
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
            <option>This Week</option>
            <option>This Month</option>
            <option>This Quarter</option>
            <option>This Year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockKPIs.map((kpi) => (
              <KPICard key={kpi.name} kpi={kpi} />
            ))}
          </div>

          {/* Detailed Performance Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Trend</h2>
            <div className="h-64 flex items-end justify-between gap-4">
              {[65, 72, 78, 85, 82, 87, 90].map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg hover:opacity-80 transition-opacity"
                    style={{ height: `${value}%` }}
                  ></div>
                  <span className="text-xs text-gray-600">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Goals & Achievements */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Goals & Achievements</h2>
            <div className="space-y-4">
              <AchievementItem
                icon="🏆"
                title="100 Tasks Milestone"
                description="Complete 100 tasks this month"
                progress={87}
                status="In Progress"
              />
              <AchievementItem
                icon="⭐"
                title="5-Star Rating"
                description="Maintain 5.0 customer satisfaction"
                progress={96}
                status="Almost There"
              />
              <AchievementItem
                icon="✅"
                title="Perfect Attendance"
                description="No absences for 30 days"
                progress={100}
                status="Achieved"
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="font-bold mb-2">Overall Performance</h3>
            <div className="text-center my-6">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-emerald-400"
                    opacity="0.3"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - 0.89)}`}
                    className="text-white"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute">
                  <p className="text-4xl font-bold">89%</p>
                </div>
              </div>
            </div>
            <p className="text-center text-emerald-100">Excellent Performance!</p>
          </div>

          {/* Ranking */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Team Ranking</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🥇</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Store Ranking</p>
                  <p className="text-sm text-gray-600">#3 out of 24</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏢</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Region Ranking</p>
                  <p className="text-sm text-gray-600">#12 out of 156</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Feedback */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Recent Feedback</h3>
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-1">
                  "Excellent customer service!"
                </p>
                <p className="text-xs text-gray-500">Manager • 2 days ago</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-1">
                  "Very organized and efficient"
                </p>
                <p className="text-xs text-gray-500">Supervisor • 5 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({ kpi }: { kpi: KPIMetric }) {
  const trendIcons = {
    up: '📈',
    down: '📉',
    stable: '➡️',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-bold text-gray-900">{kpi.name}</h3>
        <span className="text-xl">{trendIcons[kpi.trend]}</span>
      </div>
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-emerald-600">{kpi.current}</span>
          <span className="text-gray-600">/ {kpi.target} {kpi.unit}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-emerald-600 h-2 rounded-full transition-all"
            style={{ width: `${kpi.percentage}%` }}
          ></div>
        </div>
      </div>
      <p className="text-sm text-gray-600">{kpi.percentage}% of target achieved</p>
    </div>
  )
}

function AchievementItem({
  icon,
  title,
  description,
  progress,
  status,
}: {
  icon: string
  title: string
  description: string
  progress: number
  status: string
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="text-3xl">{icon}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-bold text-gray-900">{title}</h4>
          <span className="text-sm font-medium text-emerald-600">{status}</span>
        </div>
        <p className="text-sm text-gray-600 mb-2">{description}</p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              progress === 100 ? 'bg-emerald-600' : 'bg-blue-600'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}
