'use client'

import { useState } from 'react'

interface Task {
  id: string
  title: string
  description: string
  category: string
  priority: 'high' | 'medium' | 'low'
  deadline: string
  status: 'pending' | 'in-progress' | 'completed'
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Cleaning Workstations',
    description: 'Sanitize workstations in aisles 1-3',
    category: 'Cleaning',
    priority: 'high',
    deadline: '9:00 AM - 5:30 PM',
    status: 'pending',
  },
  {
    id: '2',
    title: 'Gear Arrangement',
    description: 'Organize and arrange gear in warehouse',
    category: 'Organization',
    priority: 'medium',
    deadline: '9:30 AM - 10:00 PM',
    status: 'in-progress',
  },
  {
    id: '3',
    title: 'Stocking Display',
    description: 'Restock items in the display area',
    category: 'Stocking',
    priority: 'low',
    deadline: '10:30 AM - 11:00 AM',
    status: 'completed',
  },
]

export default function TasksPage() {
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('today')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button className="text-emerald-600 hover:text-emerald-700 mb-4 flex items-center gap-2">
          ← Back
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Task List</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 Calendar
            </button>
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
          All Tasks
        </button>
        <button
          onClick={() => setFilter('today')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'today'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Today
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

      {/* Task List */}
      <div className="grid grid-cols-1 gap-4">
        {mockTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}

function TaskCard({ task }: { task: Task }) {
  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-orange-100 text-orange-800',
    low: 'bg-blue-100 text-blue-800',
  }

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-emerald-100 text-emerald-800',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
              {task.priority.toUpperCase()}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-3">{task.description}</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-gray-600">
              📁 {task.category}
            </span>
            <span className="flex items-center gap-1 text-gray-600">
              🕐 {task.deadline}
            </span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[task.status]}`}>
          {task.status === 'in-progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
        </span>
      </div>

      <div className="flex gap-2">
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
          View Details
        </button>
        {task.status !== 'completed' && (
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
            Mark Complete
          </button>
        )}
      </div>
    </div>
  )
}
