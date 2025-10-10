import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value
  const isAuthenticated = authToken === 'authenticated'

  const isAuthPage = request.nextUrl.pathname === '/'
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
  
  // Allow access to auth pages and API routes
  if (isAuthPage || isApiRoute) {
    return NextResponse.next()
  }

  // Protect all other routes
  if (!isAuthenticated) {
    const loginUrl = new URL('/', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
