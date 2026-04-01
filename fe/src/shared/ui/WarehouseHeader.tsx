'use client'

import { useAuth } from '@/shared/hooks/useAuth'
import { Avatar } from './Avatar'

export function WarehouseHeader() {
  const { user } = useAuth()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6">
      {/* Actions & User */}
      <div className="flex items-center gap-4">
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
