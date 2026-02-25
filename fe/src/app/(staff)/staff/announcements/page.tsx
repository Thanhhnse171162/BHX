'use client'

import { useState } from 'react'

interface Announcement {
  id: string
  title: string
  message: string
  category: 'general' | 'urgent' | 'policy' | 'event'
  timestamp: string
  author: string
  isRead: boolean
}

const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Team Meeting at 4 PM',
    message: 'All staff members are required to attend the team meeting in the conference room. We will discuss upcoming promotions and new store policies.',
    category: 'general',
    timestamp: '2 hours ago',
    author: 'Store Manager',
    isRead: false,
  },
  {
    id: '2',
    title: 'New Safety Procedures',
    message: 'Updated safety procedures are now in effect. Please review the new guidelines in the employee handbook and complete the safety training by end of week.',
    category: 'urgent',
    timestamp: '1 day ago',
    author: 'HR Department',
    isRead: false,
  },
  {
    id: '3',
    title: 'Holiday Schedule Update',
    message: 'The holiday schedule has been updated. Please check your assigned shifts for the upcoming holiday season.',
    category: 'general',
    timestamp: '2 days ago',
    author: 'Scheduling Team',
    isRead: true,
  },
  {
    id: '4',
    title: 'Employee Appreciation Day',
    message: 'Join us for Employee Appreciation Day this Friday! There will be food, games, and prizes. All staff are invited.',
    category: 'event',
    timestamp: '3 days ago',
    author: 'HR Department',
    isRead: true,
  },
]

export default function AnnouncementsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all')
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)

  const filteredAnnouncements = mockAnnouncements.filter((announcement) => {
    if (filter === 'unread') return !announcement.isRead
    if (filter === 'urgent') return announcement.category === 'urgent'
    return true
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button className="text-emerald-600 hover:text-emerald-700 mb-4 flex items-center gap-2">
          ← Back
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('urgent')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'urgent'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Urgent
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Announcement List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onClick={() => setSelectedAnnouncement(announcement)}
              isSelected={selectedAnnouncement?.id === announcement.id}
            />
          ))}
        </div>

        {/* Announcement Detail / Notifications */}
        <div className="space-y-6">
          {selectedAnnouncement ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedAnnouncement.title}
                </h3>
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="mb-4">
                <CategoryBadge category={selectedAnnouncement.category} />
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {selectedAnnouncement.message}
              </p>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">
                  <strong>From:</strong> {selectedAnnouncement.author}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Posted:</strong> {selectedAnnouncement.timestamp}
                </p>
              </div>
              <div className="mt-4">
                <button className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                  Mark as Read
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="font-bold mb-4">Notifications Panel</h3>
              <div className="space-y-3">
                <NotificationItem
                  icon="📢"
                  title="New stock alert"
                  subtitle="Announcement"
                  status="New"
                />
                <NotificationItem
                  icon="🔔"
                  title="Shift reminder"
                  subtitle="Today at 9:00 AM"
                  status="New"
                />
                <NotificationItem
                  icon="📝"
                  title="Task assignment"
                  subtitle="Clean area 3"
                  status="Seen"
                />
                <NotificationItem
                  icon="⏰"
                  title="Break time due"
                  subtitle="In 30 minutes"
                  status="Seen"
                />
                <NotificationItem
                  icon="📊"
                  title="Weekly KPI Delivered"
                  subtitle="4.8 rating"
                  status="Seen"
                />
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Announcement Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total</span>
                <span className="font-bold text-gray-900">{mockAnnouncements.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Unread</span>
                <span className="font-bold text-orange-600">
                  {mockAnnouncements.filter((a) => !a.isRead).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Urgent</span>
                <span className="font-bold text-red-600">
                  {mockAnnouncements.filter((a) => a.category === 'urgent').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnnouncementCard({
  announcement,
  onClick,
  isSelected,
}: {
  announcement: Announcement
  onClick: () => void
  isSelected: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-all ${
        isSelected ? 'border-emerald-600' : 'border-gray-200 hover:border-emerald-300'
      } ${!announcement.isRead ? 'bg-blue-50' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-gray-900">{announcement.title}</h3>
            {!announcement.isRead && (
              <span className="h-2 w-2 bg-emerald-600 rounded-full"></span>
            )}
          </div>
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {announcement.message}
          </p>
        </div>
        <CategoryBadge category={announcement.category} />
      </div>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span className="flex items-center gap-1">
          👤 {announcement.author}
        </span>
        <span>{announcement.timestamp}</span>
      </div>
    </div>
  )
}

function CategoryBadge({ category }: { category: Announcement['category'] }) {
  const colors = {
    general: 'bg-blue-100 text-blue-800',
    urgent: 'bg-red-100 text-red-800',
    policy: 'bg-purple-100 text-purple-800',
    event: 'bg-emerald-100 text-emerald-800',
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[category]}`}>
      {category.toUpperCase()}
    </span>
  )
}

function NotificationItem({
  icon,
  title,
  subtitle,
  status,
}: {
  icon: string
  title: string
  subtitle: string
  status: string
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
      <span className="text-xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="font-medium text-sm truncate">{title}</p>
          {status === 'New' && (
            <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
              New
            </span>
          )}
        </div>
        <p className="text-xs text-emerald-100">{subtitle}</p>
      </div>
    </div>
  )
}
