'use client'

import { useEffect } from 'react'

/**
 * AuthReset Component
 * 
 * DISABLED: No longer forces logout on app boot.
 * Authentication is now persisted in localStorage via Zustand persist middleware.
 * 
 * This component is kept for backward compatibility but does nothing.
 * Users will remain logged in across page refreshes and navigation.
 * 
 * To manually clear auth, use the logout() function from useAuthStore.
 */
export function AuthReset() {
  // Component is now inactive - authentication persists across reloads
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔓 Auth persistence enabled - users remain logged in')
    }
  }, [])

  return null
}
