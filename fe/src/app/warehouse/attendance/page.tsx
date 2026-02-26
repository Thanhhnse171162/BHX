'use client'

import { Users, UserCheck, UserX, Clock, Calendar } from 'lucide-react'
import { Button } from '@/shared/ui/Button'

// Mock data
const attendanceData = [
  { 
    id: 1, 
    name: 'Nguyen Van A', 
    role: 'Warehouse Staff',
    checkIn: '08:00', 
    checkOut: '17:00',
    status: 'present',
    date: '2024-02-26',
    hoursWorked: 9
  },
  { 
    id: 2, 
    name: 'Tran Thi B', 
    role: 'Warehouse Staff',
    checkIn: '08:15', 
    checkOut: '17:05',
    status: 'present',
    date: '2024-02-26',
    hoursWorked: 8.8
  },
  { 
    id: 3, 
    name: 'Le Van C', 
    role: 'Warehouse Staff',
    checkIn: '08:30', 
    checkOut: '17:30',
    status: 'present',
    date: '2024-02-26',
    hoursWorked: 9
  },
  { 
    id: 4, 
    name: 'Pham Thi D', 
    role: 'Warehouse Staff',
    checkIn: '08:00', 
    checkOut: 'N/A',
    status: 'present',
    date: '2024-02-26',
    hoursWorked: 0
  },
  { 
    id: 5, 
    name: 'Hoang Van E', 
    role: 'Warehouse Staff',
    checkIn: 'N/A', 
    checkOut: 'N/A',
    status: 'absent',
    date: '2024-02-26',
    hoursWorked: 0
  }
]

const stats = {
  totalStaff: 15,
  present: 14,
  absent: 1,
  late: 2,
  avgHoursWorked: 8.5
}

export default function AttendancePage() {
  const selectedDate = '2024-02-26'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Attendance</h1>
          <p className="text-gray-600 mt-1">Monitor staff check-ins and check-outs</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-[#2d6e3e] text-[#2d6e3e] flex items-center gap-2">
            <Calendar size={18} />
            Today: {selectedDate}
          </Button>
          <Button className="bg-[#2d6e3e] hover:bg-[#255931]">
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Staff</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalStaff}</p>
            </div>
            <Users className="text-gray-400" size={36} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Check-ins</p>
              <p className="text-3xl font-bold text-green-600">{stats.present}</p>
            </div>
            <UserCheck className="text-green-500" size={36} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Check-outs</p>
              <p className="text-3xl font-bold text-green-600">{stats.present - 1}</p>
            </div>
            <UserCheck className="text-green-500" size={36} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Absent</p>
              <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
            </div>
            <UserX className="text-red-500" size={36} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Avg. Hours</p>
              <p className="text-3xl font-bold text-blue-600">{stats.avgHoursWorked}</p>
            </div>
            <Clock className="text-blue-500" size={36} />
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Today's Attendance</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Staff Name</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Role</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Check-in</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Check-out</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Hours Worked</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((record) => (
                <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#2d6e3e] rounded-full flex items-center justify-center text-white font-semibold">
                        {record.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{record.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">{record.role}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`font-medium ${record.checkIn === 'N/A' ? 'text-gray-400' : 'text-gray-900'}`}>
                      {record.checkIn}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`font-medium ${record.checkOut === 'N/A' ? 'text-gray-400' : 'text-gray-900'}`}>
                      {record.checkOut}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="font-semibold text-gray-900">
                      {record.hoursWorked > 0 ? `${record.hoursWorked}h` : '-'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {record.status === 'present' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        <UserCheck size={14} />
                        Present
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        <UserX size={14} />
                        Absent
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary & Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium">Monday</span>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 font-semibold">15 Present</span>
                <span className="text-red-600 font-semibold">0 Absent</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium">Tuesday</span>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 font-semibold">14 Present</span>
                <span className="text-red-600 font-semibold">1 Absent</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium">Wednesday</span>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 font-semibold">15 Present</span>
                <span className="text-red-600 font-semibold">0 Absent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Late Arrivals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Late Arrivals This Week</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Tran Thi B</p>
                <p className="text-sm text-gray-600">Monday - 30 min late</p>
              </div>
              <Clock className="text-orange-600" size={20} />
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Le Van C</p>
                <p className="text-sm text-gray-600">Tuesday - 15 min late</p>
              </div>
              <Clock className="text-orange-600" size={20} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
