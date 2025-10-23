import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Middleware for route protection and role-based access control
 * Uses JWT tokens instead of database queries for Edge Runtime compatibility
 *
 * Features:
 * - Authentication check
 * - Role-based authorization
 * - Security headers (CSP, X-Frame-Options, etc.)
 * - CORS configuration
 */
export async function middleware(req: NextRequest) {
  // NextAuth v5 uses AUTH_SECRET as primary, fallback to NEXTAUTH_SECRET
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  });

  const path = req.nextUrl.pathname;

  // If no token and accessing protected route, redirect to login
  if (!token && path.match(/^\/(super-admin|kitchen|customer-admin|booking)/)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Role-based route protection
  if (token) {
    const userRole = token.role as string;

    if (path.startsWith('/super-admin') && userRole !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    if (path.startsWith('/kitchen') && !['SUPER_ADMIN', 'KITCHEN_ADMIN'].includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    if (path.startsWith('/customer-admin') && !['SUPER_ADMIN', 'CUSTOMER_ADMIN'].includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  // Continue with request and add security headers
  const response = NextResponse.next();

  // ============= SECURITY HEADERS =============

  // 1. Content Security Policy (CSP)
  // Prevents XSS, clickjacking, and other code injection attacks
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-inline needed for Next.js
    "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for Tailwind
    "img-src 'self' data: blob: http://localhost:* https:",
    "font-src 'self'",
    "connect-src 'self' http://localhost:* ws://localhost:*", // WebSocket for dev
    "frame-ancestors 'none'", // Prevent clickjacking
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspHeader);

  // 2. X-Frame-Options
  // Prevents clickjacking attacks (legacy support for CSP frame-ancestors)
  response.headers.set('X-Frame-Options', 'DENY');

  // 3. X-Content-Type-Options
  // Prevents MIME-sniffing attacks
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // 4. Referrer-Policy
  // Controls how much referrer information is sent
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 5. X-XSS-Protection
  // Legacy XSS protection (browser built-in, supplemented by CSP)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // 6. Permissions-Policy
  // Controls which browser features can be used
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // 7. Strict-Transport-Security (HSTS)
  // Force HTTPS connections (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  // 8. X-Powered-By
  // Custom header to show Red Bull Racing branding
  response.headers.set('X-Powered-By', 'Red Bull Racing');

  // 9. X-DNS-Prefetch-Control
  // Control DNS prefetching
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // ============= CORS HEADERS (if needed for API) =============

  // Only add CORS headers for API routes
  if (path.startsWith('/api/')) {
    const origin = req.headers.get('origin');
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3001',
      'http://localhost:3000',
    ];

    // Check if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, PATCH, OPTIONS'
      );
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With'
      );
      response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Protected dashboard routes
    '/super-admin/:path*',
    '/kitchen/:path*',
    '/customer-admin/:path*',
    '/booking/:path*',
    // API routes (for security headers and CORS)
    '/api/:path*',
  ],
};
