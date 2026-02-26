'use client'

import { useAuth } from '@/shared/hooks/useAuth'
import { LogoutButton } from '@/shared/ui/LogoutButton'
import { Avatar } from '@/shared/ui/Avatar'

export function WarehouseHeader() {
  const { user } = useAuth()

  return (
    <header className="bg-[#2d6e3e] text-white px-6 py-4 shadow-md">
      <div className="flex items-center justify-between">
        {/* Welcome Message */}
        <div>
          <h2 className="text-xl font-semibold">
            Welcome, {user?.name || 'User'}
          </h2>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-4">
          {/* Role Badge */}
          <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-lg">
            <Avatar name={user?.name || 'User'} size="sm" />
            <div className="text-sm">
              <span className="font-medium">Warehouse Staff</span>
              <span className="mx-2">|</span>
              <span className="text-white/80">BK02</span>
            </div>
          </div>

          {/* Logout Button */}
          <LogoutButton variant="outline" className="border-white/20 text-white hover:bg-white/10" />
        </div>
      </div>
    </header>
  )
}
