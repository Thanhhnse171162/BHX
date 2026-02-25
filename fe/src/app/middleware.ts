import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPaths = {
  admin: '/admin',
  ops: '/ops',
  customer: '/customer',
  staff: '/staff',
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

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
