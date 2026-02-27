'use client'

import { useState } from 'react'

interface Task {
  id: string
  title: string
  description: string
  priority: 'High' | 'Medium' | 'Low'
  deadline: string
  status: 'pending' | 'in-progress' | 'completed'
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Restock dairy section',
    description: 'Check inventory and restock all dairy products. Ensure proper temperature control and rotation.',
    priority: 'High',
    deadline: 'Today, 9:00 AM',
    status: 'pending',
  },
  {
    id: '2',
    title: 'Customer service - Aisle 3',
    description: 'Assist customers with product queries and ensure clean aisle presentation.',
    priority: 'Medium',
    deadline: 'Today, 10:30 AM',
    status: 'in-progress',
  },
  {
    id: '3',
    title: 'Inventory count - Frozen foods',
    description: 'Complete weekly inventory count for frozen food section.',
    priority: 'Low',
    deadline: 'Today, 2:00 PM',
    status: 'pending',
  },
  {
    id: '4',
    title: 'Clean break room',
    description: 'Sanitize tables, refrigerator, and microwave in staff break room.',
    priority: 'Low',
    deadline: 'Today, 4:00 PM',
    status: 'pending',
  },
  {
    id: '5',
    title: 'Price tag updates',
    description: 'Update price tags for promotional items in produce section.',
    priority: 'High',
    deadline: 'Tomorrow, 8:00 AM',
    status: 'pending',
  },
  {
    id: '6',
    title: 'Organize storage room',
    description: 'Reorganize back storage for better accessibility.',
    priority: 'Medium',
    deadline: 'Tomorrow, 11:00 AM',
    status: 'completed',
  },
]

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTasks = mockTasks.filter(task => {
    const matchesTab = activeTab === 'all' || task.status === activeTab
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅'
      case 'in-progress': return '🔄'
      default: return '📋'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700'
      case 'Medium': return 'bg-orange-100 text-orange-700'
      case 'Low': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'in-progress': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const taskCounts = {
    all: mockTasks.length,
    pending: mockTasks.filter(t => t.status === 'pending').length,
    'in-progress': mockTasks.filter(t => t.status === 'in-progress').length,
    completed: mockTasks.filter(t => t.status === 'completed').length,
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
        <p className="text-gray-600 mt-1">Manage and track your assigned tasks</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-6 inline-flex gap-2">
        {(['all', 'pending', 'in-progress', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === tab
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="capitalize">{tab.replace('-', ' ')}</span>
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20">
              {taskCounts[tab]}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search' : 'No tasks match the selected filter'}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    className="w-5 h-5 mt-1 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    readOnly
                  />

                  {/* Task Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`text-lg font-semibold ${
                        task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}>
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-3">{task.description}</p>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{task.deadline}</span>
                      </div>

                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                        <span className="mr-1">{getStatusIcon(task.status)}</span>
                        {task.status === 'in-progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Task Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Task Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {taskCounts.all}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Tasks</p>
                    <p className="font-semibold text-gray-900">All time</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {taskCounts.pending}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="font-semibold text-gray-900">To do</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {taskCounts.completed}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="font-semibold text-gray-900">Done</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Progress */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Today&apos;s Progress</h3>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-100">Completion Rate</span>
                <span className="text-2xl font-bold">33%</span>
              </div>
              <div className="w-full bg-purple-400 rounded-full h-3">
                <div className="bg-white h-3 rounded-full transition-all" style={{ width: '33%' }}></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-purple-100">Tasks Today</span>
                <span className="font-bold">4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-100">Completed</span>
                <span className="font-bold">1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-100">In Progress</span>
                <span className="font-bold">1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-100">Remaining</span>
                <span className="font-bold">2</span>
              </div>
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Priority Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">High Priority</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {mockTasks.filter(t => t.priority === 'High').length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Medium Priority</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {mockTasks.filter(t => t.priority === 'Medium').length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Low Priority</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {mockTasks.filter(t => t.priority === 'Low').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
