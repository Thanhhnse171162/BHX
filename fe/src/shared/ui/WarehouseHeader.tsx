'use client'

import { useAuth } from '@/shared/hooks/useAuth'
import { Bell, Settings } from 'lucide-react'
import { Avatar } from './Avatar'
import { useState } from 'react'

export function WarehouseHeader() {
  const { user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)

  // Mock notifications
  const notifications = [
    { id: 1, message: 'Low stock alert: Product A', time: '5 min ago', unread: true },
    { id: 2, message: 'Stock check completed', time: '1 hour ago', unread: true },
    { id: 3, message: 'New stock delivery arrived', time: '2 hours ago', unread: false }
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6">
      {/* Actions & User */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-gray-50 rounded-lg relative transition-colors"
          >
            <Bell size={20} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-gray-500 mt-1">{unreadCount} unread</p>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        notif.unread ? 'bg-blue-50' : ''
                      }`}
                    >
                      <p className="text-sm text-gray-900">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 text-center border-t border-gray-200">
                  <button className="text-sm text-[#2d6e3e] hover:underline">
                    View all notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Settings */}
        <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
          <Settings size={20} className="text-gray-600" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <Avatar 
            name={user?.name || 'Warehouse Staff'} 
            size="sm"
          />
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900">{user?.name || 'Warehouse Staff'}</p>
            <p className="text-xs text-gray-500">{user?.email || 'warehouse@company.com'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
