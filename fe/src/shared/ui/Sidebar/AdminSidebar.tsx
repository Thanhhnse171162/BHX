'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
// Optimized: Import only what we actually use
import { Menu, X, ChevronDown, ChevronRight, LogOut } from 'lucide-react'
import * as Icons from 'lucide-react'
import type { NavGroup } from '@/shared/config/nav'
import { useAuthStore } from '@/store/auth.store'

const iconMap = {
  LayoutDashboard: Icons.LayoutDashboard,
  Users: Icons.Users,
  ShieldCheck: Icons.ShieldCheck,
  Package2: Icons.Package2,
  FolderTree: Icons.FolderTree,
  Warehouse: Icons.Warehouse,
  PackageCheck: Icons.PackageCheck,
  AlertTriangle: Icons.AlertTriangle,
  ScrollText: Icons.ScrollText,
  ShoppingCart: Icons.ShoppingCart,
  Store: Icons.Store,
  ListChecks: Icons.ListChecks,
  UserCircle: Icons.UserCircle,
  Award: Icons.Award,
  Tag: Icons.Tag,
  Ticket: Icons.Ticket,
  Truck: Icons.Truck,
  PackageSearch: Icons.PackageSearch,
  TrendingUp: Icons.TrendingUp,
  PackageOpen: Icons.PackageOpen,
  DollarSign: Icons.DollarSign,
  BarChart3: Icons.BarChart3,
  Settings: Icons.Settings,
  Lock: Icons.Lock,
}

interface AdminSidebarProps {
  navigation: NavGroup[]
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function AdminSidebar({ navigation, isCollapsed, onToggleCollapse }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev =>
      prev.includes(label)
        ? prev.filter(g => g !== label)
        : [...prev, label]
    )
  }

  const isActive = (href: string) => {
    // Chỉ active khi trùng đúng route của item
    // Tránh trường hợp item cha (/admin/promotions) cũng active khi đang ở /admin/promotions/coupons
    return pathname === href
  }

  const getIcon = (iconName?: string) => {
    if (!iconName) return null
    const Icon = iconMap[iconName as keyof typeof iconMap]
    return Icon ? <Icon className="w-5 h-5" /> : null
  }

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-72'
      } bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 flex flex-col shadow-2xl border-r border-slate-700/50`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Bảng điều hành</h2>
              <p className="text-xs text-slate-400">GR-SCMS</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
          aria-label={isCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {navigation.map((group) => {
          const isGroupExpanded = expandedGroups.includes(group.label) || !isCollapsed

          return (
            <div key={group.label} className="space-y-1">
              {/* Group Header */}
              {!isCollapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider hover:text-emerald-300 transition-colors"
                >
                  <span>{group.label}</span>
                  {isGroupExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Group Items */}
              {(isGroupExpanded || isCollapsed) && (
                <div className={`space-y-0.5 ${!isCollapsed ? 'pl-1' : ''}`}>
                  {group.items.map((item) => {
                    const active = isActive(item.href)
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                          ${active
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                          }
                          ${isCollapsed ? 'justify-center' : ''}
                        `}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <span className={`flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`}>
                          {getIcon(item.icon)}
                        </span>
                        {!isCollapsed && (
                          <span className="text-sm font-medium truncate">{item.label}</span>
                        )}
                        {!isCollapsed && active && (
                          <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}

              {/* Separator */}
              {!isCollapsed && (
                <div className="mt-4 border-t border-slate-700/30" />
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer - Quick Actions */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
          <div className="text-xs text-slate-400 space-y-2">
            <div className="flex items-center justify-between">
              <span>Trạng thái hệ thống</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Trực tuyến
              </span>
            </div>
            <div className="text-slate-500">v2.0.1</div>
          </div>
        </div>
      )}

      <div className="p-3 border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-200 hover:bg-rose-500/20 hover:text-rose-100 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Đăng xuất' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  )
}
