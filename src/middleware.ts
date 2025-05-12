import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimiter } from './middleware/rateLimit';

const PRODUCTION_DOMAIN = 'leadstrack.in';

export async function middleware(request: NextRequest) {
  // Skip middleware for auth-related paths
  if (request.nextUrl.pathname.startsWith('/api/auth') ||
      request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.next();
  }

  // Only apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const response = rateLimiter(request);
    if (response.status === 429) {
      return response;
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  
  // Common security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Strict CSP for production
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://*.fbcdn.net https://*.facebook.com https://graph.facebook.com",
    `connect-src 'self' https://graph.facebook.com https://${PRODUCTION_DOMAIN} https://fonts.googleapis.com https://fonts.gstatic.com`,
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspDirectives);

  // HSTS only in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

// Configure which paths to apply middleware to
export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
    // Apply to auth routes
    '/auth/:path*',
    // Apply to all pages except static assets and api routes (which are handled above)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};