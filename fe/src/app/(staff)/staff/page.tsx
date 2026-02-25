'use client'

import { useAuthStore } from '@/store/auth.store'
import { useState } from 'react'

export default function StaffDashboard() {
  const { user } = useAuthStore()
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const currentDate = new Date()
  const formattedDate = currentDate.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric' 
  })

  const handleCheckIn = () => {
    setIsCheckedIn(true)
    // TODO: Call API to check in
  }

  const handleCheckOut = () => {
    setIsCheckedIn(false)
    // TODO: Call API to check out
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}</h1>
          <p className="text-gray-600 mt-1">{formattedDate}</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            🔔
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            ⚙️
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Check In/Out Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Today's Shift</h2>
                <p className="text-gray-600">{formattedDate}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-600">9:00 AM - 5 PM</p>
                <p className="text-sm text-gray-600">Aisle 3</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleCheckIn}
                disabled={isCheckedIn}
                className={`py-4 px-6 rounded-lg font-semibold text-white transition-colors ${
                  isCheckedIn 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                ✓ Check In
              </button>
              <button
                onClick={handleCheckOut}
                disabled={!isCheckedIn}
                className={`py-4 px-6 rounded-lg font-semibold text-white transition-colors ${
                  !isCheckedIn 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                ⏸ Check Out
              </button>
            </div>

            {/* Shift Status */}
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Stocking Hours</p>
                <p className="text-2xl font-bold text-blue-600">4/8 hrs</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Customer Helps</p>
                <p className="text-2xl font-bold text-purple-600">4.8 ⭐</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Items Moved</p>
                <p className="text-2xl font-bold text-orange-600">766</p>
              </div>
            </div>
          </div>

          {/* Daily Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Daily Tasks</h2>
              <a href="/staff/tasks" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                See All →
              </a>
            </div>

            <div className="space-y-3">
              <TaskItem 
                title="Restock Vegetables" 
                completed={true}
              />
              <TaskItem 
                title="Clean Beverage Area" 
                completed={true}
              />
              <TaskItem 
                title="Set Up Promotion Display" 
                completed={false}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Profile & Announcements */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <span className="text-4xl font-bold">{user?.name.charAt(0).toUpperCase()}</span>
              </div>
              <h3 className="text-xl font-bold mb-1">Changing In</h3>
              <p className="text-emerald-100 mb-4">Store Staff Position</p>

              <div className="w-full space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-200">👤</span>
                  <div>
                    <p className="text-xs text-emerald-200">Employee ID</p>
                    <p className="font-semibold">{user?.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-200">📞</span>
                  <div>
                    <p className="text-xs text-emerald-200">Phone</p>
                    <p className="font-semibold">09987.856.321</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-200">📧</span>
                  <div>
                    <p className="text-xs text-emerald-200">Email</p>
                    <p className="font-semibold text-sm break-all">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 w-full space-y-2">
                <button className="w-full py-2 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-colors">
                  Change Password
                </button>
                <button className="w-full py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors">
                  Edit Information
                </button>
              </div>
            </div>
          </div>

          {/* Work Targets */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Work Targets</h3>
            <div className="space-y-4">
              <TargetItem 
                icon="📦" 
                label="Per Goods" 
                value="9:00 AM - 2:00 PM"
                status="In time"
                statusColor="text-emerald-600"
              />
              <TargetItem 
                icon="📦" 
                label="Finishing Sales" 
                value="45,000đ"
                status="On Time"
                statusColor="text-blue-600"
              />
            </div>
          </div>

          {/* Announcements */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Announcements</h3>
              <a href="/staff/announcements" className="text-emerald-600 hover:text-emerald-700 text-sm">
                View All →
              </a>
            </div>
            <div className="space-y-3">
              <AnnouncementItem 
                title="Store Meeting at 4 PM"
                time="2 hours ago"
              />
              <AnnouncementItem 
                title="New Safety Procedures"
                time="Yesterday"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskItem({ title, completed }: { title: string; completed: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <input 
        type="checkbox" 
        checked={completed}
        readOnly
        className="h-5 w-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
      />
      <span className={`flex-1 ${completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
        {title}
      </span>
    </div>
  )
}

function TargetItem({ 
  icon, 
  label, 
  value, 
  status, 
  statusColor 
}: { 
  icon: string
  label: string
  value: string
  status: string
  statusColor: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <p className="text-sm text-gray-600">{label}</p>
        <p className="font-semibold text-gray-900">{value}</p>
        <p className={`text-xs font-medium ${statusColor}`}>{status}</p>
      </div>
    </div>
  )
}

function AnnouncementItem({ title, time }: { title: string; time: string }) {
  return (
    <div className="p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
      <p className="font-medium text-gray-900 text-sm">{title}</p>
      <p className="text-xs text-gray-500 mt-1">{time}</p>
    </div>
  )
}
