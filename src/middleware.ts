import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🛡️ Protect Admin Routes
  if (pathname.startsWith('/admin')) {
    // Skip protection for the login page itself to avoid infinite redirect
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    const adminAuth = request.cookies.get('admin_auth')?.value;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // If no session or password not configured
    if (!adminAuth || !adminPassword) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Verify the token format (Base64 of password:secret)
    // Note: We cannot easily verify the secret here because process.env in middleware 
    // might be limited, but we check if the cookie exists. 
    // The API routes perform deep verification.
    try {
      const expectedToken = Buffer.from(`${adminPassword}:${process.env.AUTH_SECRET || 'fallback-secret'}`).toString('base64');
      if (adminAuth !== expectedToken) {
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// 🎯 Configure Middleware Matching
export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
