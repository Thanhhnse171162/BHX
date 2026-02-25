'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function TaskDetailPage() {
  const router = useRouter()
  const [taskStatus, setTaskStatus] = useState<'pending' | 'in-progress' | 'completed'>('in-progress')

  const task = {
    id: '1',
    title: 'RabiLau Vegetables',
    description: 'Restock vegetables in aisles 1-3 with fresh produce from warehouse. Ensure proper rotation of stock (FIFO method). Check expiry dates and remove any damaged items.',
    category: 'Stocking',
    priority: 'high',
    deadline: '9:00 AM - 5:30 PM',
    assignedBy: 'Store Manager',
    location: 'Aisle 1-3',
    estimatedTime: '2 hours',
    createdAt: '2024-02-25 08:00 AM',
  }

  const checklist = [
    { id: 1, item: 'Check stock levels', completed: true },
    { id: 2, item: 'Retrieve items from warehouse', completed: true },
    { id: 3, item: 'Clean display area', completed: true },
    { id: 4, item: 'Arrange products', completed: false },
    { id: 5, item: 'Update inventory system', completed: false },
    { id: 6, item: 'Email service', completed: false },
  ]

  const handleMarkComplete = () => {
    setTaskStatus('completed')
    // TODO: Call API to update task status
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-emerald-600 hover:text-emerald-700 mb-4 flex items-center gap-2"
        >
          ← Back to Tasks
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
            <p className="text-gray-600 mt-1">Task Details</p>
          </div>
          <StatusBadge status={taskStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Image/Visual */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl mb-4 block">🥬</span>
                <p className="text-gray-600 font-medium">Task Visual Reference</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 leading-relaxed">{task.description}</p>
          </div>

          {/* Checklist */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Task Checklist</h2>
              <span className="text-sm text-gray-600">
                {checklist.filter((item) => item.completed).length} / {checklist.length} completed
              </span>
            </div>
            <div className="space-y-3">
              {checklist.map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item.item}
                  completed={item.completed}
                  onToggle={() => {}}
                />
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(checklist.filter((item) => item.completed).length / checklist.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Notes & Comments</h2>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={4}
              placeholder="Add notes or comments about this task..."
            ></textarea>
            <button className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
              Save Note
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-2">
              {taskStatus !== 'completed' && (
                <button
                  onClick={handleMarkComplete}
                  className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  ✓ Mark as Complete
                </button>
              )}
              <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                📸 Upload Photo
              </button>
              <button className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                🔔 Request Help
              </button>
            </div>
          </div>

          {/* Task Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Task Information</h3>
            <div className="space-y-3">
              <DetailItem icon="📦" label="Category" value={task.category} />
              <DetailItem icon="⚠️" label="Priority" value={task.priority.toUpperCase()} />
              <DetailItem icon="🕐" label="Deadline" value={task.deadline} />
              <DetailItem icon="📍" label="Location" value={task.location} />
              <DetailItem icon="⏱️" label="Est. Time" value={task.estimatedTime} />
              <DetailItem icon="👤" label="Assigned By" value={task.assignedBy} />
              <DetailItem icon="📅" label="Created" value={task.createdAt} />
            </div>
          </div>

          {/* Related Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Related Tasks</h3>
            <div className="space-y-2">
              <RelatedTaskItem title="Clean Display Area" status="completed" />
              <RelatedTaskItem title="Update Price Tags" status="pending" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    pending: 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-emerald-100 text-emerald-800',
  }

  return (
    <span className={`px-4 py-2 rounded-full text-sm font-medium ${colors[status as keyof typeof colors]}`}>
      {status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function ChecklistItem({
  item,
  completed,
  onToggle,
}: {
  item: string
  completed: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <input
        type="checkbox"
        checked={completed}
        onChange={onToggle}
        className="h-5 w-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
      />
      <span className={`flex-1 ${completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
        {item}
      </span>
    </div>
  )
}

function DetailItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function RelatedTaskItem({ title, status }: { title: string; status: string }) {
  return (
    <div className="p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
      <div className="flex items-center justify-between">
        <p className="font-medium text-gray-900 text-sm">{title}</p>
        <span
          className={`text-xs ${
            status === 'completed' ? 'text-emerald-600' : 'text-gray-500'
          }`}
        >
          {status === 'completed' ? '✓' : '○'}
        </span>
      </div>
    </div>
  )
}
