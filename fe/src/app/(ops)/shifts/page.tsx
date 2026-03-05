'use client'

import { useState } from 'react'
import { Calendar, Clock, CheckCircle, AlertCircle, User, ChevronLeft, ChevronRight } from 'lucide-react'

interface Shift {
  id: string
  date: string
  startTime: string
  endTime: string
  type: 'morning' | 'afternoon' | 'evening'
  status: 'upcoming' | 'active' | 'completed' | 'absent'
  location: string
  supervisor: string
}

const shiftTypeConfig = {
  morning: { label: 'Ca sáng', color: 'bg-amber-100 text-amber-800' },
  afternoon: { label: 'Ca chiều', color: 'bg-blue-100 text-blue-800' },
  evening: { label: 'Ca tối', color: 'bg-indigo-100 text-indigo-800' },
}

const statusConfig = {
  upcoming: { label: 'Sắp tới', color: 'text-gray-500', icon: Calendar },
  active: { label: 'Đang làm', color: 'text-green-600', icon: CheckCircle },
  completed: { label: 'Hoàn thành', color: 'text-gray-400', icon: CheckCircle },
  absent: { label: 'Vắng', color: 'text-red-500', icon: AlertCircle },
}

function getWeekDates(offset: number): Date[] {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1 + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function formatDate(d: Date) {
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' })
}

const mockShifts: Shift[] = [
  {
    id: 'S001',
    date: new Date().toISOString().split('T')[0],
    startTime: '06:00',
    endTime: '14:00',
    type: 'morning',
    status: 'active',
    location: 'Kho A - Cổng 1',
    supervisor: 'Nguyễn Quản Lý',
  },
  {
    id: 'S002',
    date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })(),
    startTime: '14:00',
    endTime: '22:00',
    type: 'afternoon',
    status: 'upcoming',
    location: 'Kho A - Cổng 2',
    supervisor: 'Trần Quản Lý',
  },
  {
    id: 'S003',
    date: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0] })(),
    startTime: '06:00',
    endTime: '14:00',
    type: 'morning',
    status: 'completed',
    location: 'Kho B',
    supervisor: 'Nguyễn Quản Lý',
  },
  {
    id: 'S004',
    date: (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().split('T')[0] })(),
    startTime: '22:00',
    endTime: '06:00',
    type: 'evening',
    status: 'upcoming',
    location: 'Kho A - Khu vực đóng gói',
    supervisor: 'Lê Quản Lý',
  },
  {
    id: 'S005',
    date: (() => { const d = new Date(); d.setDate(d.getDate() - 3); return d.toISOString().split('T')[0] })(),
    startTime: '14:00',
    endTime: '22:00',
    type: 'afternoon',
    status: 'completed',
    location: 'Kho B',
    supervisor: 'Trần Quản Lý',
  },
]

export default function ShiftsPageContent() {
  const [weekOffset, setWeekOffset] = useState(0)
  const weekDates = getWeekDates(weekOffset)
  const today = new Date().toISOString().split('T')[0]

  const totalThisWeek = mockShifts.length
  const completed = mockShifts.filter(s => s.status === 'completed').length
  const upcoming = mockShifts.filter(s => s.status === 'upcoming').length
  const active = mockShifts.filter(s => s.status === 'active').length

  const weekDateStrings = new Set(weekDates.map(d => d.toISOString().split('T')[0]))
  const shiftsThisWeek = mockShifts.filter(s => weekDateStrings.has(s.date))

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lịch ca làm việc</h1>
        <p className="text-gray-500 mt-1 text-sm">Quản lý ca làm việc của bạn</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Tổng ca</p>
          <p className="text-2xl font-bold text-gray-900">{totalThisWeek}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-100">
          <p className="text-sm text-green-600">Đang làm</p>
          <p className="text-2xl font-bold text-green-700">{active}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100">
          <p className="text-sm text-blue-600">Sắp tới</p>
          <p className="text-2xl font-bold text-blue-700">{upcoming}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Hoàn thành</p>
          <p className="text-2xl font-bold text-gray-700">{completed}</p>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {formatDate(weekDates[0])} — {formatDate(weekDates[6])}
            {weekOffset === 0 && <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Tuần này</span>}
          </span>
          <button
            onClick={() => setWeekOffset(o => o + 1)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Day Grid */}
        <div className="grid grid-cols-7 divide-x divide-gray-100">
          {weekDates.map(date => {
            const dateStr = date.toISOString().split('T')[0]
            const isToday = dateStr === today
            const dayShifts = mockShifts.filter(s => s.date === dateStr)
            const dayName = date.toLocaleDateString('vi-VN', { weekday: 'narrow' })
            const dayNum = date.getDate()

            return (
              <div key={dateStr} className={`p-2 min-h-[80px] ${isToday ? 'bg-emerald-50' : ''}`}>
                <div className={`text-center mb-2`}>
                  <p className="text-xs text-gray-400">{dayName}</p>
                  <p className={`text-sm font-bold ${isToday ? 'text-emerald-600' : 'text-gray-700'}`}>{dayNum}</p>
                </div>
                <div className="space-y-1">
                  {dayShifts.map(s => (
                    <div
                      key={s.id}
                      className={`text-xs rounded px-1 py-0.5 ${shiftTypeConfig[s.type].color} truncate`}
                      title={`${s.startTime}-${s.endTime}`}
                    >
                      {s.startTime}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Shift List */}
      <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Chi tiết ca trong tuần</h2>
      <div className="space-y-3">
        {shiftsThisWeek.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Không có ca làm việc trong tuần này</p>
          </div>
        ) : (
          shiftsThisWeek.map(shift => {
            const stCfg = statusConfig[shift.status]
            const StIcon = stCfg.icon
            const shiftDate = new Date(shift.date)

            return (
              <div key={shift.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${shiftTypeConfig[shift.type].color}`}>
                          {shiftTypeConfig[shift.type].label}
                        </span>
                        <span className={`text-xs font-medium flex items-center gap-1 ${stCfg.color}`}>
                          <StIcon className="w-3 h-3" />
                          {stCfg.label}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 mt-1">
                        {shiftDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      <p className="text-sm text-gray-500">{shift.startTime} – {shift.endTime}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{shift.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>GS: {shift.supervisor}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
