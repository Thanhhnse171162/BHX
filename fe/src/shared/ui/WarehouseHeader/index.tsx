'use client'

import { useAuth } from '@/shared/hooks/useAuth'
import { LogoutButton } from '@/shared/ui/LogoutButton'
import { Avatar } from '@/shared/ui/Avatar'
import { User, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function WarehouseHeader() {
  const { user } = useAuth()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleProfileClick = () => {
    setIsMenuOpen(false)
    router.push('/warehouse/profile')
  }

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
          {/* User Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <Avatar name={user?.name || 'User'} size="sm" />
              <div className="text-sm">
                <span className="font-medium">Warehouse Staff</span>
                <span className="mx-2">|</span>
                <span className="text-white/80">BK02</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <>
                {/* Backdrop to close menu */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsMenuOpen(false)}
                />
                
                {/* Menu */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500">{user?.email || 'user@company.com'}</p>
                  </div>

                  {/* Menu Items */}
                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">Profile</span>
                  </button>

                  <div className="border-t border-gray-100 my-1" />

                  <div className="px-2">
                    <LogoutButton 
                      variant="text-only" 
                      className="rounded hover:bg-red-50"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
