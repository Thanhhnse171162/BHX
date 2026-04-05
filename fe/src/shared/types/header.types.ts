/**
 * Header Types for GR-SCMS E-commerce Platform
 * Defines interfaces for search, location, cart, and notification features
 */

export interface SearchSuggestion {
  id: string
  type: 'product' | 'category' | 'keyword'
  text: string
  image?: string
  category?: string
  url?: string
  price?: number
}

export interface LocationOption {
  id: string
  city: string
  district: string
  ward?: string
  storeCount: number
  coordinates?: {
    lat: number
    lng: number
  }
  address?: string
  phone?: string
}

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  maxQuantity?: number
  discount?: number
}

export interface NotificationItem {
  id: string
  type: 'order' | 'promotion' | 'system' | 'loyalty'
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
  metadata?: Record<string, unknown>
}

export interface MenuItem {
  label: string
  href: string
  icon?: React.ReactNode
  badge?: string
  roles: string[]
  children?: MenuItem[]
}

export interface HeaderProps {
  className?: string
  showAnnouncement?: boolean
  announcementText?: string
}
