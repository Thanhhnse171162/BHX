'use client'

import { useAuthStore } from '@/store/auth.store'

export default function KPIPage() {
  const { user } = useAuthStore()

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Performance</h1>
        <p className="text-gray-600 mt-1">Performance Metrics for {user?.name}</p>
      </div>

      {/* Time Period Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-6 inline-flex gap-2">
        {['This Week', 'This Month', 'This Quarter', 'This Year'].map((period) => (
          <button
            key={period}
            className={period === 'This Week' ? 
              'px-6 py-2.5 rounded-lg font-medium bg-blue-500 text-white shadow-md' :
              'px-6 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-100'
            }
          >
            {period}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - KPI Cards & Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tasks Completed */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Tasks Completed</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h3 className="text-4xl font-bold text-gray-900">87</h3>
                    <span className="text-gray-500 text-sm">/ 100 tasks</span>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <div className="mb-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '87%' }}></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">87% of target achieved</p>
            </div>

            {/* Customer Satisfaction */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Customer Satisfaction</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h3 className="text-4xl font-bold text-gray-900">4.8</h3>
                    <span className="text-gray-500 text-sm">/ 5</span>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <div className="mb-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '96%' }}></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">96% of target achieved</p>
            </div>

            {/* On-Time Rate */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-600 text-sm font-medium">On-Time Rate</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h3 className="text-4xl font-bold text-gray-900">95</h3>
                    <span className="text-gray-500 text-sm">/ 100%</span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  📊
                </span>
              </div>
              <div className="mb-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">95% of target achieved</p>
            </div>

            {/* Items Stocked */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Items Stocked</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h3 className="text-4xl font-bold text-gray-900">1245</h3>
                    <span className="text-gray-500 text-sm">/ 1500 items</span>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <div className="mb-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '83%' }}></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">83% of target achieved</p>
            </div>
          </div>

          {/* Performance Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Trend</h3>
            <div className="h-80 flex items-end justify-between gap-3 pb-8">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                const heights = [65, 78, 85, 72, 88, 82, 90]
                const values = [65, 78, 85, 72, 88, 82, 90]
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full bg-gray-100 rounded-t-xl relative" style={{ height: '280px' }}>
                      <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-xl absolute bottom-0 transition-all hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                        style={{ height: `${heights[idx]}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-gray-900 text-white text-xs font-semibold px-2 py-1 rounded">
                            {values[idx]}%
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 font-medium">{day}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Comparison vs Target */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Comparison vs Target</h3>
            <div className="space-y-6">
              {[
                { label: 'Tasks Completed', current: 87, target: 100, color: 'emerald' },
                { label: 'Customer Satisfaction', current: 96, target: 100, color: 'blue' },
                { label: 'On-Time Rate', current: 95, target: 100, color: 'indigo' },
                { label: 'Items Stocked', current: 83, target: 100, color: 'orange' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.current}%</span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`bg-${item.color}-500 h-3 rounded-full transition-all`}
                        style={{ width: `${item.current}%` }}
                      ></div>
                    </div>
                    <div 
                      className="absolute top-0 w-1 h-5 bg-red-500 -mt-1"
                      style={{ left: `${item.target}%` }}
                      title="Target"
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Rankings & Feedback */}
        <div className="space-y-6">
          {/* Overall Performance */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-lg p-8">
            <h3 className="text-lg font-semibold mb-6">Overall Performance</h3>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-44 h-44">
                <svg className="transform -rotate-90 w-44 h-44">
                  <circle
                    cx="88"
                    cy="88"
                    r="80"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="14"
                    fill="none"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r="80"
                    stroke="white"
                    strokeWidth="14"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 80}`}
                    strokeDashoffset={`${2 * Math.PI * 80 * (1 - 0.89)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl font-bold">89%</span>
                </div>
              </div>
            </div>
            <p className="text-center text-emerald-100 font-medium text-lg mb-2">Excellent Performance!</p>
            <p className="text-center text-emerald-200 text-sm">Keep up the great work</p>
          </div>

          {/* Ranking Inside Store */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Team Ranking</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🏆</span>
                  <div>
                    <p className="text-sm text-gray-600">Store Ranking</p>
                    <p className="text-xl font-bold text-gray-900">#3 out of 24</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🏢</span>
                  <div>
                    <p className="text-sm text-gray-600">Region Ranking</p>
                    <p className="text-xl font-bold text-gray-900">#12 out of 156</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback from Manager */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Feedback</h3>
            <div className="space-y-4">
              {[
                { text: 'Excellent customer service!', from: 'Manager', time: '2 days ago', icon: '👍', type: 'positive' },
                { text: 'Very organized and efficient', from: 'Supervisor', time: '5 days ago', icon: '⭐', type: 'positive' },
                { text: 'Great teamwork on inventory', from: 'Team Lead', time: '1 week ago', icon: '💪', type: 'positive' },
              ].map((feedback, idx) => (
                <div key={idx} className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{feedback.icon}</span>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium mb-1">&quot;{feedback.text}&quot;</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-semibold">{feedback.from}</span>
                        <span>•</span>
                        <span>{feedback.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Achievement */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">This Month</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-purple-100">Total Tasks</span>
                <span className="text-2xl font-bold">124</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-100">Completed</span>
                <span className="text-2xl font-bold">87</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-100">Success Rate</span>
                <span className="text-2xl font-bold">89%</span>
              </div>
              <div className="pt-3 border-t border-purple-400">
                <div className="flex items-center justify-between">
                  <span className="text-purple-100">Rating</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="text-yellow-300 text-lg">⭐</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
