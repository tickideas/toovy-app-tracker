import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value
  
  // In middleware, we only check for the presence of a token
  // The actual JWT verification happens in the API routes
  // This avoids the Edge Runtime crypto module limitation
  const hasToken = !!authToken
  
  const isAuthPage = request.nextUrl.pathname === '/'
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
  const isAuthApiRoute = request.nextUrl.pathname.startsWith('/api/auth/')
  const isPublicApiRoute = request.nextUrl.pathname.startsWith('/api/public/')
  const isDebugApiRoute = request.nextUrl.pathname.startsWith('/api/debug/')
  const isSharePage = request.nextUrl.pathname.startsWith('/share/')
  
  // Allow access to auth pages, auth API routes, public API routes, debug API routes, and share pages
  if (isAuthPage || isAuthApiRoute || isPublicApiRoute || isDebugApiRoute || isSharePage) {
    return NextResponse.next()
  }

  // For other API routes, just check if token exists
  // The actual verification happens in the API route handlers
  if (isApiRoute && !hasToken) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // For non-API routes, they need the token
  if (!hasToken && !isAuthPage) {
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
