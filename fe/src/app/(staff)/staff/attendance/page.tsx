'use client'

import { useAuthStore } from '@/store/auth.store'
import { useState } from 'react'

interface AttendanceRecord {
  id: string
  date: string
  location: string
  checkIn: string
  checkOut: string
  status: 'present' | 'late' | 'absent'
  aisle: string
}

const mockAttendance: AttendanceRecord[] = [
  {
    id: '1',
    date: 'Feb 25',
    location: 'Store Area',
    checkIn: '8:00 AM - 12:00 PM',
    checkOut: 'In Editor',
    status: 'present',
    aisle: '3 Aisle',
  },
  {
    id: '2',
    date: 'Aisle 2',
    location: 'Store Area',
    checkIn: '9:00 AM - 5:00 PM',
    checkOut: 'At Johnson',
    status: 'late',
    aisle: '2 Aisle',
  },
]

export default function AttendancePage() {
  const { user } = useAuthStore()
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all')

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button className="text-emerald-600 hover:text-emerald-700 mb-4 flex items-center gap-2">
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Attendance History</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Profile Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                <p className="text-gray-600">Staff ID: {user?.id.slice(0, 8)}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                  ✓ On Duty
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setFilter('week')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'week' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setFilter('month')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'month' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Month
            </button>
          </div>

          {/* Attendance Records */}
          <div className="space-y-4">
            {mockAttendance.map((record) => (
              <div key={record.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{user?.name}</h3>
                      <p className="text-sm text-gray-600">Staff</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    record.status === 'present' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {record.status === 'present' ? 'On Time' : 'Late'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">📍</span>
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="font-medium text-gray-900">{record.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">📅</span>
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-medium text-gray-900">{record.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">🕐</span>
                    <div>
                      <p className="text-xs text-gray-500">Shift</p>
                      <p className="font-medium text-gray-900">{record.checkIn}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">📦</span>
                    <div>
                      <p className="text-xs text-gray-500">Aisle</p>
                      <p className="font-medium text-gray-900">{record.aisle}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Filter & Additional Options */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Filter Options</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option>All Status</option>
                  <option>Present</option>
                  <option>Late</option>
                  <option>Absent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option>All Locations</option>
                  <option>Store Area</option>
                  <option>Warehouse</option>
                </select>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="font-bold mb-4">This Month Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-emerald-100">Total Days</span>
                <span className="font-bold text-2xl">22</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-100">Present</span>
                <span className="font-bold text-2xl">20</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-100">Late</span>
                <span className="font-bold text-2xl">2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-100">Absent</span>
                <span className="font-bold text-2xl">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
