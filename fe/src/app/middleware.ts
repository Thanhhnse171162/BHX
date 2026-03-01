import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware is disabled because auth is now handled client-side only (in-memory, no persistence)
// Client-side RouteGuard components handle route protection
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

/* Previous middleware code (disabled):
const protectedPaths = {
  admin: '/admin',
  ops: '/ops',
  customer: '/customer',
  staff: '/staff',
  warehouse: '/warehouse',
}

const authPaths = ['/login', '/register', '/forgot-password']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value
  const userRole = request.cookies.get('user_role')?.value

  // Allow public routes
  if (pathname === '/' || authPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // Check if path is protected
  if (pathname.startsWith(protectedPaths.admin)) {
    if (!token || userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (pathname.startsWith(protectedPaths.ops)) {
    if (!token || !['STAFF', 'STORE_MANAGER', 'WAREHOUSE_MANAGER'].includes(userRole || '')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (pathname.startsWith(protectedPaths.customer)) {
    if (!token || userRole !== 'CUSTOMER') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (pathname.startsWith(protectedPaths.staff)) {
    if (!token || userRole !== 'STAFF') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (pathname.startsWith(protectedPaths.warehouse)) {
    if (!token || userRole !== 'WAREHOUSE_STAFF') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}
*/
