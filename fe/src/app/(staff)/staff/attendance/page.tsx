'use client'

import { useAuthStore } from '@/store/auth.store'
import { useState } from 'react'

interface AttendanceRecord {
  id: string
  date: string
  checkIn: string
  checkOut: string
  totalHours: string
  status: 'present' | 'late' | 'absent'
}

const mockAttendance: AttendanceRecord[] = [
  { id: '1', date: 'Feb 26, 2026', checkIn: '8:00 AM', checkOut: '5:00 PM', totalHours: '9h 0m', status: 'present' },
  { id: '2', date: 'Feb 25, 2026', checkIn: '8:15 AM', checkOut: '5:00 PM', totalHours: '8h 45m', status: 'late' },
  { id: '3', date: 'Feb 24, 2026', checkIn: '8:00 AM', checkOut: '5:00 PM', totalHours: '9h 0m', status: 'present' },
  { id: '4', date: 'Feb 23, 2026', checkIn: '8:00 AM', checkOut: '5:00 PM', totalHours: '9h 0m', status: 'present' },
  { id: '5', date: 'Feb 22, 2026', checkIn: '8:00 AM', checkOut: '5:00 PM', totalHours: '9h 0m', status: 'present' },
  { id: '6', date: 'Feb 21, 2026', checkIn: '8:00 AM', checkOut: '5:00 PM', totalHours: '9h 0m', status: 'present' },
]

export default function AttendancePage() {
  const { user } = useAuthStore()
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const handleCheckIn = () => {
    setIsCheckedIn(true)
    // TODO: Call API
  }

  const handleCheckOut = () => {
    setIsCheckedIn(false)
    // TODO: Call API
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600 mt-1">Track your check-in and work hours</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Check In/Out & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Check In/Out Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white mb-4">
                <span className="text-5xl">🕐</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isCheckedIn ? 'Checked In' : 'Ready to Check In'}
              </h2>
              <p className="text-gray-600">Current Time: {currentTime}</p>
              {isCheckedIn && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                  <span className="font-medium">Active Session</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleCheckIn}
                disabled={isCheckedIn}
                className={`py-4 px-6 rounded-xl font-semibold text-white transition-all ${
                  isCheckedIn 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Check In</span>
                </div>
              </button>
              <button
                onClick={handleCheckOut}
                disabled={!isCheckedIn}
                className={`py-4 px-6 rounded-xl font-semibold text-white transition-all ${
                  !isCheckedIn 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Check Out</span>
                </div>
              </button>
            </div>

            {isCheckedIn && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Started at:</span>
                  <span className="font-semibold text-gray-900">8:00 AM</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-700">Duration:</span>
                  <span className="font-semibold text-blue-600">4h 23m</span>
                </div>
              </div>
            )}
          </div>

          {/* Attendance History Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Attendance History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Check-in</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Check-out</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total Hours</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mockAttendance.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 text-sm text-gray-900">{record.date}</td>
                      <td className="py-4 px-4 text-sm text-gray-900">{record.checkIn}</td>
                      <td className="py-4 px-4 text-sm text-gray-900">{record.checkOut}</td>
                      <td className="py-4 px-4 text-sm font-medium text-gray-900">{record.totalHours}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          record.status === 'present' ? 'bg-green-100 text-green-700' :
                          record.status === 'late' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {record.status === 'present' ? 'Present' :
                           record.status === 'late' ? 'Late' :
                           'Absent'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Today Status & Monthly Summary */}
        <div className="space-y-6">
          {/* Today Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Today&apos;s Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-semibold text-gray-900">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isCheckedIn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {isCheckedIn ? 'On Duty' : 'Not Started'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Shift</span>
                <span className="font-semibold text-gray-900">8:00 AM - 5:00 PM</span>
              </div>
            </div>
          </div>

          {/* Monthly Summary */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-6">Monthly Summary</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-100">Total Days</span>
                  <span className="text-2xl font-bold">22</span>
                </div>
                <div className="w-full bg-blue-400 rounded-full h-2">
                  <div className="bg-white h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-100">Present</span>
                  <span className="text-2xl font-bold">20</span>
                </div>
                <div className="w-full bg-blue-400 rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full" style={{ width: '91%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-100">Late</span>
                  <span className="text-2xl font-bold">2</span>
                </div>
                <div className="w-full bg-blue-400 rounded-full h-2">
                  <div className="bg-orange-400 h-2 rounded-full" style={{ width: '9%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-100">Total Hours</span>
                  <span className="text-2xl font-bold">178</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-blue-400">
              <div className="flex items-center justify-between">
                <span className="text-blue-100">Attendance Rate</span>
                <span className="text-3xl font-bold">91%</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">This Week</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">✅</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Days Present</p>
                    <p className="font-bold text-gray-900">5/5</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">⏰</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hours Worked</p>
                    <p className="font-bold text-gray-900">40h</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🎯</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">On-Time Rate</p>
                    <p className="font-bold text-gray-900">100%</p>
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
