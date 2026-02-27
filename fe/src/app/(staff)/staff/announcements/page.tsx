'use client'

import { useState } from 'react'

interface Announcement {
  id: string
  title: string
  message: string
  category: 'general' | 'urgent' | 'policy' | 'event'
  priority: 'high' | 'medium' | 'low'
  timestamp: string
  author: string
  isRead: boolean
}

const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Team Meeting at 4 PM Today',
    message: 'All staff members are required to attend the team meeting in the conference room. We will discuss upcoming promotions and new store policies. Please bring your notebooks.',
    category: 'urgent',
    priority: 'high',
    timestamp: '2 hours ago',
    author: 'Store Manager',
    isRead: false,
  },
  {
    id: '2',
    title: 'New Safety Procedures Effective Immediately',
    message: 'Updated safety procedures are now in effect. Please review the new guidelines in the employee handbook and complete the safety training by end of week. This is mandatory for all staff.',
    category: 'policy',
    priority: 'high',
    timestamp: '1 day ago',
    author: 'HR Department',
    isRead: false,
  },
  {
    id: '3',
    title: 'Holiday Schedule Update',
    message: 'The holiday schedule has been updated. Please check your assigned shifts for the upcoming holiday season. Contact your supervisor if you have any conflicts.',
    category: 'general',
    priority: 'medium',
    timestamp: '2 days ago',
    author: 'Scheduling Team',
    isRead: true,
  },
  {
    id: '4',
    title: 'Employee Appreciation Day - This Friday!',
    message: 'Join us for Employee Appreciation Day this Friday! There will be food, games, and prizes. All staff are invited. Event starts at 3 PM in the break room.',
    category: 'event',
    priority: 'medium',
    timestamp: '3 days ago',
    author: 'HR Department',
    isRead: true,
  },
  {
    id: '5',
    title: 'Inventory System Maintenance',
    message: 'The inventory system will undergo maintenance this weekend. Please complete all stock updates before Friday evening.',
    category: 'general',
    priority: 'low',
    timestamp: '5 days ago',
    author: 'IT Department',
    isRead: true,
  },
]

export default function AnnouncementsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)

  const filteredAnnouncements = selectedCategory === 'all' 
    ? mockAnnouncements 
    : mockAnnouncements.filter(a => a.category === selectedCategory)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'urgent': return 'bg-red-100 text-red-700'
      case 'policy': return 'bg-purple-100 text-purple-700'
      case 'event': return 'bg-green-100 text-green-700'
      default: return 'bg-blue-100 text-blue-700'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'urgent': return '⚠️'
      case 'policy': return '📋'
      case 'event': return '🎉'
      default: return '📢'
    }
  }

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case 'high': return <div className="w-2 h-2 bg-red-500 rounded-full"></div>
      case 'medium': return <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
      default: return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
    }
  }

  const unreadCount = mockAnnouncements.filter(a => !a.isRead).length

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
            <p className="text-gray-600 mt-1">Stay updated with store news and updates</p>
          </div>
          {unreadCount > 0 && (
            <div className="px-4 py-2 bg-red-500 text-white rounded-full font-semibold">
              {unreadCount} New
            </div>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-6 inline-flex gap-2">
        {[
          { value: 'all', label: 'All' },
          { value: 'urgent', label: 'Urgent' },
          { value: 'policy', label: 'Policy' },
          { value: 'event', label: 'Events' },
          { value: 'general', label: 'General' },
        ].map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              selectedCategory === category.value
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Announcement List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No announcements</h3>
              <p className="text-gray-600">There are no announcements in this category</p>
            </div>
          ) : (
            filteredAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                onClick={() => setSelectedAnnouncement(announcement)}
                className={`bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-all hover:shadow-md ${
                  !announcement.isRead ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                } ${selectedAnnouncement?.id === announcement.id ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Priority Indicator */}
                  <div className="pt-2">
                    {getPriorityIndicator(announcement.priority)}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(announcement.category)}`}>
                            <span className="mr-1">{getCategoryIcon(announcement.category)}</span>
                            {announcement.category.charAt(0).toUpperCase() + announcement.category.slice(1)}
                          </span>
                          {!announcement.isRead && (
                            <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-semibold">
                              NEW
                            </span>
                          )}
                        </div>
                        <h3 className={`text-lg font-bold mb-2 ${!announcement.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {announcement.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{announcement.message}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{announcement.author}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{announcement.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="pt-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column - Detail View & Summary */}
        <div className="space-y-6">
          {/* Announcement Detail */}
          {selectedAnnouncement ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Announcement Details</h3>
              <div className="space-y-4">
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(selectedAnnouncement.category)}`}>
                    <span className="mr-1">{getCategoryIcon(selectedAnnouncement.category)}</span>
                    {selectedAnnouncement.category.charAt(0).toUpperCase() + selectedAnnouncement.category.slice(1)}
                  </span>
                </div>
                
                <div>
                  <h4 className="font-bold text-gray-900 text-xl mb-3">{selectedAnnouncement.title}</h4>
                  <p className="text-gray-700 leading-relaxed">{selectedAnnouncement.message}</p>
                </div>

                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">{selectedAnnouncement.author}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{selectedAnnouncement.timestamp}</span>
                  </div>
                </div>

                <button className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors">
                  Mark as Read
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="text-4xl mb-3">👈</div>
              <p className="text-gray-600">Select an announcement to view details</p>
            </div>
          )}

          {/* Summary Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {mockAnnouncements.filter(a => !a.isRead).length}
                  </div>
                  <span className="text-sm font-medium text-gray-700">Unread</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {mockAnnouncements.length}
                  </div>
                  <span className="text-sm font-medium text-gray-700">Total</span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">By Category</h3>
            <div className="space-y-3">
              {[
                { category: 'urgent', label: 'Urgent', color: 'bg-red-500' },
                { category: 'policy', label: 'Policy', color: 'bg-purple-500' },
                { category: 'event', label: 'Events', color: 'bg-green-500' },
                { category: 'general', label: 'General', color: 'bg-blue-500' },
              ].map((item) => {
                const count = mockAnnouncements.filter(a => a.category === item.category).length
                return (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
