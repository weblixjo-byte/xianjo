// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'experimental-edge';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin and /api/admin vectors globally
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    
    // Explicitly allow public authentication portals
    if (pathname === '/admin/login' || pathname === '/api/admin/login') {
      return NextResponse.next();
    }

    // Extract the strict admin token (Master Password fallback)
    const adminToken = request.cookies.get('admin_auth')?.value;
    const masterPassword = process.env.ADMIN_PASSWORD;

    // Reject mismatch or missing tokens immediately via Edge
    if (!adminToken || adminToken !== masterPassword) {
      
      // If unauthorized API request -> Return 401 JSON
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized Access. Strict Admin Firewall Active.' }, { status: 401 });
      }
      
      // If unauthorized Edge navigation -> Force 307 Redirect to Login Screen
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// NextJS Middleware configuration
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
