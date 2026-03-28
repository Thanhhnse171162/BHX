'use client'

import { useAuthStore } from '@/store/auth.store'
import Link from 'next/link'
import { Clock, CheckSquare, Calendar } from 'lucide-react'

export default function StaffDashboard() {
  const { user } = useAuthStore()
  const currentDate = new Date()
  const formattedDate = currentDate.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
        <p className="text-gray-600 mt-1">{formattedDate}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/staff/attendance" className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Quick Action</p>
              <h3 className="text-2xl font-bold mt-1">Check In</h3>
            </div>
            <Clock className="w-10 h-10" />
          </div>
        </Link>

        <Link href="/staff/tasks" className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Your Tasks</p>
              <h3 className="text-2xl font-bold mt-1">5 Pending</h3>
            </div>
            <CheckSquare className="w-10 h-10" />
          </div>
        </Link>

        <Link href="/staff/schedule" className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">This Week</p>
              <h3 className="text-2xl font-bold mt-1">38 Hours</h3>
            </div>
            <Calendar className="w-10 h-10" />
          </div>
        </Link>
      </div>

      {/* KPI Overview Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Personal KPI Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tasks Completed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium">Tasks Completed</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-3xl font-bold text-gray-900">87</h3>
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
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '87%' }}></div>
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
                  <h3 className="text-3xl font-bold text-gray-900">4.8</h3>
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
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '96%' }}></div>
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
                  <h3 className="text-3xl font-bold text-gray-900">95</h3>
                  <span className="text-gray-500 text-sm">/ 100%</span>
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                📊
              </span>
            </div>
            <div className="mb-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '95%' }}></div>
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
                  <h3 className="text-3xl font-bold text-gray-900">1245</h3>
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
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '83%' }}></div>
              </div>
            </div>
            <p className="text-sm text-gray-600">83% of target achieved</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Performance & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Trend</h3>
            <div className="h-64 flex items-end justify-between gap-2 pb-8">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                const heights = [65, 78, 85, 72, 88, 82, 90]
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-t-lg relative" style={{ height: '200px' }}>
                      <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg absolute bottom-0 transition-all hover:from-blue-600 hover:to-blue-500"
                        style={{ height: `${heights[idx]}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 font-medium">{day}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Today's Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Today&apos;s Assigned Tasks</h3>
              <Link href="/staff/tasks" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { title: 'Restock dairy section', priority: 'High', status: 'pending', time: '9:00 AM' },
                { title: 'Customer service - Aisle 3', priority: 'Medium', status: 'in-progress', time: '10:30 AM' },
                { title: 'Inventory count - Frozen foods', priority: 'Low', status: 'pending', time: '2:00 PM' },
                { title: 'Clean break room', priority: 'Low', status: 'pending', time: '4:00 PM' },
              ].map((task, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 rounded border-gray-300" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <p className="text-sm text-gray-500">{task.time}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    task.priority === 'High' ? 'bg-red-100 text-red-700' :
                    task.priority === 'Medium' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {task.priority}
                  </span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {task.status === 'in-progress' ? 'In Progress' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Overall Performance & Announcements */}
        <div className="space-y-6">
          {/* Overall Performance */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-lg p-8">
            <h3 className="text-lg font-semibold mb-6">Overall Performance</h3>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg className="transform -rotate-90 w-40 h-40">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="white"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 70}`}
                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - 0.89)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold">89%</span>
                </div>
              </div>
            </div>
            <p className="text-center text-emerald-100 font-medium text-lg">Excellent Performance!</p>
            
            {/* Team Ranking */}
            <div className="mt-8 pt-6 border-t border-emerald-400">
              <h4 className="font-semibold mb-4">Team Ranking</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏆</span>
                    <span className="text-emerald-100">Store Ranking</span>
                  </div>
                  <span className="font-bold">#3 out of 24</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏢</span>
                    <span className="text-emerald-100">Region Ranking</span>
                  </div>
                  <span className="font-bold">#12 out of 156</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Recent Feedback</h3>
              <Link href="/staff/announcements" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-4">
              {[
                { text: 'Excellent customer service!', from: 'Manager', time: '2 days ago', icon: '👍' },
                { text: 'Very organized and efficient', from: 'Supervisor', time: '5 days ago', icon: '⭐' },
              ].map((feedback, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{feedback.icon}</span>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium mb-1">&quot;{feedback.text}&quot;</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{feedback.from}</span>
                        <span>•</span>
                        <span>{feedback.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
