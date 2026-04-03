'use client'

import { useState } from 'react'

interface Shift {
  id: string
  day: string
  date: string
  startTime: string
  endTime: string
  hours: string
  status: 'scheduled' | 'confirmed' | 'completed'
}

const mockShifts: Shift[] = [
  { id: '1', day: 'Monday', date: 'Feb 26', startTime: '8:00 AM', endTime: '5:00 PM', hours: '9h', status: 'confirmed' },
  { id: '2', day: 'Tuesday', date: 'Feb 27', startTime: '8:00 AM', endTime: '5:00 PM', hours: '9h', status: 'scheduled' },
  { id: '3', day: 'Wednesday', date: 'Feb 28', startTime: '8:00 AM', endTime: '5:00 PM', hours: '9h', status: 'scheduled' },
  { id: '4', day: 'Thursday', date: 'Feb 29', startTime: '8:00 AM', endTime: '5:00 PM', hours: '9h', status: 'scheduled' },
  { id: '5', day: 'Friday', date: 'Mar 1', startTime: '8:00 AM', endTime: '5:00 PM', hours: '9h', status: 'scheduled' },
  { id: '6', day: 'Saturday', date: 'Mar 2', startTime: 'OFF', endTime: '', hours: '0h', status: 'scheduled' },
  { id: '7', day: 'Sunday', date: 'Mar 3', startTime: 'OFF', endTime: '', hours: '0h', status: 'scheduled' },
]

export default function SchedulePage() {
  const [selectedWeek] = useState('This Week')

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600 mt-1">View your work schedule and shifts</p>
        </div>
        <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-md transition-colors">
          Request Leave
        </button>
      </div>

      {/* Week Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex items-center justify-between">
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">{selectedWeek}</h2>
          <p className="text-sm text-gray-600">Feb 26 - Mar 3, 2026</p>
        </div>

        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Calendar View */}
        <div className="lg:col-span-2 space-y-4">
          {mockShifts.map((shift) => (
            <div
              key={shift.id}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all ${
                shift.status === 'confirmed' ? 'border-green-300 bg-green-50' :
                shift.startTime === 'OFF' ? 'border-gray-200 bg-gray-50' :
                'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center font-bold ${
                    shift.status === 'confirmed' ? 'bg-green-500 text-white' :
                    shift.startTime === 'OFF' ? 'bg-gray-300 text-gray-600' :
                    'bg-blue-500 text-white'
                  }`}>
                    <span className="text-xs">{shift.day.slice(0, 3)}</span>
                    <span className="text-xl">{shift.date.split(' ')[1]}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{shift.day}</h3>
                    {shift.startTime === 'OFF' ? (
                      <p className="text-gray-500 font-medium">Day Off</p>
                    ) : (
                      <p className="text-gray-600">
                        {shift.startTime} - {shift.endTime}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {shift.startTime !== 'OFF' && (
                    <>
                      <div className="text-2xl font-bold text-gray-900 mb-1">{shift.hours}</div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        shift.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        shift.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {shift.status === 'confirmed' ? 'Confirmed' :
                         shift.status === 'completed' ? 'Completed' :
                         'Scheduled'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {shift.status === 'confirmed' && shift.startTime !== 'OFF' && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Shift confirmed - Ready to work</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Column - Summary & Info */}
        <div className="space-y-6">
          {/* Weekly Summary */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-6">This Week Summary</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-100">Total Hours</span>
                  <span className="text-3xl font-bold">45h</span>
                </div>
                <div className="w-full bg-blue-400 rounded-full h-2">
                  <div className="bg-white h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>

              <div className="pt-4 border-t border-blue-400 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">Working Days</span>
                  <span className="font-bold text-xl">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">Days Off</span>
                  <span className="font-bold text-xl">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">Avg Hours/Day</span>
                  <span className="font-bold text-xl">9h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Shifts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Upcoming Shifts</h3>
            <div className="space-y-3">
              {mockShifts.filter(s => s.startTime !== 'OFF').slice(0, 3).map((shift) => (
                <div key={shift.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{shift.day}</span>
                    <span className="text-sm text-gray-600">{shift.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{shift.startTime} - {shift.endTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shift Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Shift Details</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📍</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold text-gray-900">Main Store Floor</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">👔</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Position</p>
                  <p className="font-semibold text-gray-900">Nhân viên</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">👤</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Supervisor</p>
                  <p className="font-semibold text-gray-900">Nguyen Van A</p>
                </div>
              </div>
            </div>
          </div>

          {/* Request Leave Button */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Need Time Off?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Request leave at least 3 days in advance for approval.
            </p>
            <button className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors">
              Submit Leave Request
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
