'use client'

import { useState } from 'react'
import { CheckCircle, Clock, Calendar, Plus } from 'lucide-react'
import { Button } from '@/shared/ui/Button'

// Mock data
const inventoryChecks = [
  { 
    id: 1, 
    date: '2024-02-26', 
    time: '14:30',
    status: 'Completed', 
    checkedBy: 'Nguyen Van A',
    itemsChecked: 245,
    discrepancies: 0,
    duration: '2h 15m' 
  },
  { 
    id: 2, 
    date: '2024-02-24', 
    time: '09:00',
    status: 'Completed', 
    checkedBy: 'Tran Thi B',
    itemsChecked: 240,
    discrepancies: 2,
    duration: '2h 30m' 
  },
  { 
    id: 3, 
    date: '2024-02-20', 
    time: '15:45',
    status: 'Completed', 
    checkedBy: 'Le Van C',
    itemsChecked: 238,
    discrepancies: 1,
    duration: '2h 20m' 
  },
  { 
    id: 4, 
    date: '2024-02-15', 
    time: '10:00',
    status: 'Completed', 
    checkedBy: 'Nguyen Van A',
    itemsChecked: 235,
    discrepancies: 3,
    duration: '2h 45m' 
  },
  { 
    id: 5, 
    date: '2024-02-10', 
    time: '14:00',
    status: 'Completed', 
    checkedBy: 'Pham Thi D',
    itemsChecked: 230,
    discrepancies: 0,
    duration: '2h 10m' 
  }
]

export default function InventoryChecksPage() {
  const [selectedCheck, setSelectedCheck] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Checks</h1>
          <p className="text-gray-600 mt-1">Track and manage inventory audit history</p>
        </div>
        <Button className="bg-[#2d6e3e] hover:bg-[#255931] flex items-center gap-2">
          <Plus size={18} />
          Start New Check
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Checks</p>
              <p className="text-3xl font-bold text-gray-900">{inventoryChecks.length}</p>
            </div>
            <CheckCircle className="text-green-500" size={36} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Last Check</p>
              <p className="text-xl font-bold text-gray-900">{inventoryChecks[0].date}</p>
            </div>
            <Calendar className="text-blue-500" size={36} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Avg. Duration</p>
              <p className="text-xl font-bold text-gray-900">2h 20m</p>
            </div>
            <Clock className="text-orange-500" size={36} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Discrepancies</p>
              <p className="text-3xl font-bold text-red-600">
                {inventoryChecks.reduce((sum, check) => sum + check.discrepancies, 0)}
              </p>
            </div>
            <div className="text-3xl">⚠️</div>
          </div>
        </div>
      </div>

      {/* Checks History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Check History</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {inventoryChecks.map((check) => (
            <div 
              key={check.id} 
              className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => setSelectedCheck(selectedCheck === check.id ? null : check.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-gray-400" size={18} />
                      <span className="font-semibold text-gray-900">{check.date}</span>
                      <span className="text-gray-500 text-sm">{check.time}</span>
                    </div>
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                      <CheckCircle size={14} />
                      {check.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Checked By</p>
                      <p className="font-medium text-gray-900">{check.checkedBy}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Items Checked</p>
                      <p className="font-medium text-gray-900">{check.itemsChecked}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Duration</p>
                      <p className="font-medium text-gray-900">{check.duration}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Discrepancies</p>
                      <p className={`font-bold ${check.discrepancies > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {check.discrepancies}
                      </p>
                    </div>
                  </div>

                  {selectedCheck === check.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Check Summary</h4>
                          <ul className="space-y-2 text-sm">
                            <li className="flex justify-between">
                              <span className="text-gray-600">Total Items:</span>
                              <span className="font-medium">{check.itemsChecked}</span>
                            </li>
                            <li className="flex justify-between">
                              <span className="text-gray-600">Matched:</span>
                              <span className="font-medium text-green-600">{check.itemsChecked - check.discrepancies}</span>
                            </li>
                            <li className="flex justify-between">
                              <span className="text-gray-600">Mismatched:</span>
                              <span className="font-medium text-red-600">{check.discrepancies}</span>
                            </li>
                          </ul>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Actions</h4>
                          <div className="space-y-2">
                            <Button size="sm" variant="outline" className="w-full">
                              View Full Report
                            </Button>
                            <Button size="sm" variant="outline" className="w-full">
                              Export PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Scheduled Check */}
      <div className="bg-gradient-to-br from-[#2d6e3e] to-[#1f5b2e] rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold mb-2">Next Scheduled Check</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} />
                <span className="font-medium">2024-03-01</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} />
                <span className="font-medium">10:00 AM</span>
              </div>
            </div>
            <p className="text-white/80 text-sm mt-2">Assigned to: Nguyen Van A</p>
          </div>
          <Button className="bg-white text-[#2d6e3e] hover:bg-gray-100">
            Reschedule
          </Button>
        </div>
      </div>
    </div>
  )
}
