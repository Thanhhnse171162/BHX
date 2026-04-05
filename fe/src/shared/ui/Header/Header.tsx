'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/hooks/useAuth'
import { useCartStore } from '@/store/cart.store'
import { MegaMenu } from './MegaMenu'
import { DeliveryLocationSelector } from './DeliveryLocationSelector'

interface SearchSuggestion {
  id: string
  type: 'product' | 'category' | 'keyword'
  text: string
  image?: string
  category?: string
  price?: number
}

const MOCK_SUGGESTIONS: SearchSuggestion[] = [
  { id: '1', type: 'product', text: 'Cà chua bi', category: 'Rau củ quả', image: '/products/tomato.jpg', price: 25000 },
  { id: '2', type: 'product', text: 'Thịt ba chỉ heo', category: 'Thịt, cá', image: '/products/pork.jpg', price: 89000 },
  { id: '3', type: 'category', text: 'Trái cây tươi' },
  { id: '4', type: 'keyword', text: 'khuyến mãi cuối tuần' },
  { id: '5', type: 'product', text: 'Sữa tươi Vinamilk', category: 'Đồ uống', image: '/products/milk.jpg', price: 32000 }
]

const TRENDING_SEARCHES = [
  '🔥 Rau củ tươi', '🔥 Thịt heo', '🎁 Khuyến mãi', '🥗 Trái cây', '🍖 Thịt bò'
]

interface HeaderProps {
  hideDeliveryAndCart?: boolean
}

export function Header({ hideDeliveryAndCart = false }: HeaderProps) {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const { items: cartItems, removeItem, getTotalItems, getTotalPrice } = useCartStore()
  
  // State management
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showCartPreview, setShowCartPreview] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>(['Rau củ', 'Thịt heo', 'Trái cây'])
  const [isScrolled, setIsScrolled] = useState(false)
  const [showSupportMenu, setShowSupportMenu] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  
  // Refs
  const searchRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const cartRef = useRef<HTMLDivElement>(null)
  const supportRef = useRef<HTMLDivElement>(null)
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setShowCartPreview(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search handler with debounce
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }

    if (!query.trim()) {
      setSuggestions([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    
    searchDebounceRef.current = setTimeout(() => {
      const filtered = MOCK_SUGGESTIONS.filter(item =>
        item.text.toLowerCase().includes(query.toLowerCase())
      )
      setSuggestions(filtered)
      setIsSearching(false)
    }, 300)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setRecentSearches(prev => {
        const updated = [searchQuery, ...prev.filter(s => s !== searchQuery)]
        return updated.slice(0, 5)
      })
      router.push(`/customer/search?q=${encodeURIComponent(searchQuery)}`)
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.text)
    setShowSuggestions(false)
    if (suggestion.type === 'product') {
      router.push(`/product/${suggestion.id}`)
    } else if (suggestion.type === 'category') {
      router.push(`/customer/category/${suggestion.id}`)
    } else {
      router.push(`/customer/search?q=${encodeURIComponent(suggestion.text)}`)
    }
  }

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
    router.push('/login')
  }

  const removeRecentSearch = (search: string) => {
    setRecentSearches(prev => prev.filter(s => s !== search))
  }

  // Calculated values from cart store
  const cartCount = getTotalItems()
  const cartTotal = getTotalPrice()

  // Fix hydration mismatch
  useEffect(() => {
    if (isAuthenticated && !user) {
      logout()
    }
  }, [isAuthenticated, user, logout])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
  }

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'shadow-xl' 
        : 'shadow-lg'
    }`}>
      {/* Main header - Green background */}
      <div className="bg-[#0aa84f] h-[72px] flex items-center">
        <div className="max-w-[1600px] mx-auto px-4 w-full">
          <div className="flex items-center gap-[30px]">
            {/* Logo */}
            <Link href="/customer" className="flex-shrink-0 group">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white group-hover:scale-105 transition-all duration-300">
                  <Image
                    src="/logocty.png"
                    alt="GR-SCMS"
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                    priority
                  />
                </div>
                <div className="hidden md:block">
                  <div className="font-extrabold text-[22px] leading-tight tracking-wide whitespace-nowrap">
                    <span className="text-white">GR-SCMS </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Search bar */}
            <div ref={searchRef} className="flex-1 relative max-w-[500px]">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm sản phẩm, danh mục..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full h-[40px] pl-4 pr-12 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200 text-gray-700 text-[13px] font-normal"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-green-600 transition-colors"
                    aria-label="Tìm kiếm"
                  >
                    {isSearching ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </form>

              {/* Search suggestions dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Recent searches */}
                  {searchQuery === '' && recentSearches.length > 0 && (
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tìm kiếm gần đây</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSearchQuery(search)
                              handleSearch(search)
                            }}
                            className="group flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-emerald-50 rounded-full text-[13px] transition-all duration-200"
                          >
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium text-gray-700 group-hover:text-emerald-700">{search}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeRecentSearch(search)
                              }}
                              className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending searches */}
                  {searchQuery === '' && (
                    <div className="p-4 border-b border-gray-100">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Xu hướng tìm kiếm</span>
                      <div className="flex flex-wrap gap-2">
                        {TRENDING_SEARCHES.map((trend, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              const cleanTrend = trend.replace(/[🔥🎁🥗🍖]/g, '').trim()
                              setSearchQuery(cleanTrend)
                              handleSearch(cleanTrend)
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 rounded-full text-[13px] font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 border border-orange-200/50"
                          >
                            {trend}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search suggestions */}
                  {suggestions.length > 0 && (
                    <div className="max-h-96 overflow-y-auto">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0"
                        >
                          {suggestion.type === 'product' && suggestion.image && (
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                              <Image
                                src={suggestion.image}
                                alt={suggestion.text}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              {suggestion.type === 'category' && (
                                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                              )}
                              {suggestion.type === 'keyword' && (
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              )}
                              <span className="font-semibold text-gray-900">{suggestion.text}</span>
                            </div>
                            {suggestion.category && (
                              <div className="text-[11px] text-gray-500 mt-0.5">{suggestion.category}</div>
                            )}
                          </div>
                          {suggestion.price && (
                            <div className="font-bold text-emerald-600 text-[13px]">
                              {formatPrice(suggestion.price)}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No results */}
                  {searchQuery !== '' && suggestions.length === 0 && !isSearching && (
                    <div className="p-8 text-center">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-gray-500 font-semibold">Không tìm thấy kết quả</p>
                      <p className="text-[13px] text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right section */}
            <div className="flex items-center gap-[30px] ml-auto">

              {!hideDeliveryAndCart && (
                <>
                  {/* Delivery Location Selector */}
                  <DeliveryLocationSelector />

                  {/* Cart - Giỏ hàng */}
                  <div ref={cartRef} className="relative">
                    <button
                      onClick={() => setShowCartPreview(!showCartPreview)}
                      className="flex items-center gap-2 h-[40px] px-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                      aria-label="Giỏ hàng"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="hidden lg:inline text-white font-semibold text-[13px]">Giỏ hàng ({cartCount})</span>
                      {cartCount > 0 && (
                        <span className="md:hidden absolute -top-1 -right-1 min-w-[20px] h-5 bg-yellow-400 text-green-600 text-[11px] rounded-full flex items-center justify-center font-extrabold px-1.5">
                          {cartCount}
                        </span>
                      )}
                    </button>

                    {/* Cart preview dropdown */}
                    {showCartPreview && (
                      <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 text-[15px]">Giỏ hàng của bạn</h3>
                            <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-[11px] font-extrabold rounded-full">
                              {cartCount} sản phẩm
                            </span>
                          </div>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {cartItems.length > 0 ? (
                            <>
                              {cartItems.map((item) => (
                                <div key={item.id} className="p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-3xl border border-gray-200">
                                      {item.image}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-gray-900 text-[13px] line-clamp-2">{item.name}</p>
                                      <div className="flex items-center justify-between mt-1">
                                        <span className="text-[13px] text-gray-600">SL: {item.quantity}</span>
                                        <span className="font-bold text-emerald-600 text-[13px]">{formatPrice(item.price * item.quantity)}</span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => removeItem(item.id)}
                                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      aria-label="Xóa"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <div className="p-4 bg-gray-50 border-t border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="font-semibold text-gray-700 text-[14px]">Tổng cộng:</span>
                                  <span className="font-extrabold text-green-600 text-[17px]">{formatPrice(cartTotal)}</span>
                                </div>
                                <Link
                                  href="/customer/cart"
                                  onClick={() => setShowCartPreview(false)}
                                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold text-[14px] transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98"
                                >
                                  <span>Xem giỏ hàng</span>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                  </svg>
                                </Link>
                              </div>
                            </>
                          ) : (
                            <div className="p-8 text-center">
                              <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <p className="text-gray-500 font-semibold">Giỏ hàng trống</p>
                              <Link
                                href="/customer"
                                onClick={() => setShowCartPreview(false)}
                                className="inline-block mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[13px] font-semibold transition-colors"
                              >
                                Tiếp tục mua sắm
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* User menu - Hội viên */}
              {user && isAuthenticated ? (
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 h-[40px] px-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="hidden lg:inline text-white font-semibold text-[13px]">Tài khoản</span>
                  </button>

                  {/* User dropdown menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-[17px] shadow-md">
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-[14px] truncate">{user.email}</p>
                            <p className="text-[11px] text-gray-600 mt-0.5">
                              {user.role === 'ADMIN' ? 'Quản trị viên' :
                               user.role === 'STORE_MANAGER' ? 'Quản lý cửa hàng' :
                               user.role === 'WAREHOUSE_MANAGER' ? 'Quản lý kho' :
                               user.role === 'STAFF' ? 'Nhân viên' : 'Khách hàng'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        {user.role === 'CUSTOMER' ? (
                          <>
                            <Link
                              href="/customer/profile"
                              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 hover:text-green-600"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="font-semibold text-[13px]">Tài khoản của tôi</span>
                            </Link>
                            <Link
                              href="/customer/orders"
                              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 hover:text-green-600"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                              <span className="font-semibold text-[13px]">Đơn hàng của tôi</span>
                            </Link>
                            <Link
                              href="/customer/loyalty"
                              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 hover:text-green-600"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-semibold text-[13px]">Điểm tích lũy</span>
                            </Link>
                          </>
                        ) : (
                          <Link
                            href={
                              user.role === 'STORE_MANAGER' ? '/store-manager' :
                              user.role === 'ADMIN' ? '/admin/dashboard' :
                              user.role === 'WAREHOUSE_MANAGER' ? '/warehouse' :
                              user.role === 'WAREHOUSE_STAFF' ? '/warehouse-store' :
                              user.role === 'STAFF' ? '/cashier' : '/'
                            }
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 hover:text-green-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span className="font-semibold text-[13px]">Vào trang quản lý</span>
                          </Link>
                        )}
                      </div>
                      <div className="border-t border-gray-100 py-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors text-green-600 font-bold text-[13px]"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 h-[40px] px-6 bg-white hover:bg-white/90 rounded-full transition-colors text-green-600 font-bold text-[13px]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Đăng nhập</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom navigation bar */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-6 py-2.5">
            {/* Mega Menu - Danh mục sản phẩm */}
            <MegaMenu />

            {/* Tư vấn mua hàng */}
            <div
              ref={supportRef}
              className="relative"
              onMouseEnter={() => setShowSupportMenu(true)}
              onMouseLeave={() => setShowSupportMenu(false)}
            >
              <button
                className="flex items-center gap-2 text-gray-700 hover:text-green-600 font-semibold text-[13px] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-[13px]">Tư vấn mua hàng</span>
              </button>

              {/* Support dropdown */}
              {showSupportMenu && (
                <div className="absolute top-full left-0 mt-0 w-[280px] bg-white border border-gray-200 shadow-2xl z-50 rounded-b-lg overflow-hidden">
                  <div className="py-1">
                    <div className="px-4 py-3 bg-green-600 text-white font-bold">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>Tư vấn mua hàng</span>
                      </div>
                    </div>
                    <a
                      href="tel:02471066866"
                      className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 text-gray-800 transition-colors border-t border-gray-200"
                    >
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <div className="text-[11px] text-gray-500">Mua online:</div>
                        <div className="font-bold text-green-600 text-[15px]">024 71066866</div>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
