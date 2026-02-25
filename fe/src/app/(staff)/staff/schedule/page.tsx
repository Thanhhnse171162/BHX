'use client'

import { useState } from 'react'

interface ScheduleEntry {
  id: string
  date: string
  day: string
  shift: string
  time: string
  location: string
  status: 'upcoming' | 'ongoing' | 'completed'
}

const mockSchedule: ScheduleEntry[] = [
  {
    id: '1',
    date: '21',
    day: 'Mon',
    shift: 'Morning',
    time: '9:00 AM - 5:00 PM',
    location: 'Store Work',
    status: 'completed',
  },
  {
    id: '2',
    date: '22',
    day: 'Tue',
    shift: 'Morning',
    time: '9:00 AM - 5:00 PM',
    location: 'Store Work',
    status: 'completed',
  },
  {
    id: '3',
    date: '23',
    day: 'Wed',
    shift: 'Morning',
    time: '9:00 AM - 5:00 PM',
    location: 'Store Work',
    status: 'completed',
  },
  {
    id: '4',
    date: '24',
    day: 'Thu',
    shift: 'Morning',
    time: '9:00 AM - 5:00 PM',
    location: 'Home Work',
    status: 'ongoing',
  },
  {
    id: '5',
    date: '25',
    day: 'Fri',
    shift: 'Morning',
    time: '9:00 AM - 2:00 PM',
    location: 'Store Work',
    status: 'upcoming',
  },
]

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const weekDates = [21, 22, 23, 24, 25, 26, 27]

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const currentMonth = 'February'
  const currentYear = '2026'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button className="text-emerald-600 hover:text-emerald-700 mb-4 flex items-center gap-2">
          ← Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
            <p className="text-gray-600 mt-1">{currentMonth} {currentYear}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                ← Previous
              </button>
              <h2 className="text-xl font-bold text-gray-900">{currentMonth} {currentYear}</h2>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                Next →
              </button>
            </div>

            {/* Week Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {daysOfWeek.map((day, index) => (
                <div key={day} className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">{day}</p>
                  <div
                    className={`p-4 rounded-lg ${
                      index === 4
                        ? 'bg-emerald-600 text-white'
                        : index < 4
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-white border border-gray-200 text-gray-400'
                    }`}
                  >
                    <p className="text-lg font-bold">{weekDates[index]}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Schedule List */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 mb-4">This Week's Schedule</h3>
              {mockSchedule.map((entry) => (
                <ScheduleCard key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Working Hours Summary */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="font-bold mb-4">Working Hours</h3>
            <div className="space-y-4">
              <div>
                <p className="text-emerald-100 text-sm mb-1">This Week</p>
                <p className="text-3xl font-bold">40 hrs</p>
              </div>
              <div className="h-px bg-emerald-400"></div>
              <div>
                <p className="text-emerald-100 text-sm mb-1">This Month</p>
                <p className="text-3xl font-bold">160 hrs</p>
              </div>
            </div>
          </div>

          {/* Shift Types */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Shift Types</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-600"></div>
                  <span className="text-sm text-gray-700">Morning (9 AM - 5 PM)</span>
                </div>
                <span className="text-sm font-medium text-gray-900">4 days</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                  <span className="text-sm text-gray-700">Afternoon (2 PM - 10 PM)</span>
                </div>
                <span className="text-sm font-medium text-gray-900">1 day</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-600"></div>
                  <span className="text-sm text-gray-700">Night (10 PM - 6 AM)</span>
                </div>
                <span className="text-sm font-medium text-gray-900">0 days</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                Request Time Off
              </button>
              <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Swap Shift
              </button>
              <button className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                View Guidelines
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScheduleCard({ entry }: { entry: ScheduleEntry }) {
  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-800',
    ongoing: 'bg-emerald-100 text-emerald-800',
    completed: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-900">{entry.date}</p>
        <p className="text-sm text-gray-600">{entry.day}</p>
      </div>
      <div className="h-12 w-px bg-gray-200"></div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-gray-900">{entry.shift} Shift</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[entry.status]}`}>
            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
          </span>
        </div>
        <p className="text-sm text-gray-600">{entry.time}</p>
        <p className="text-sm text-gray-500">{entry.location}</p>
      </div>
    </div>
  )
}
