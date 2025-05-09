import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimiter } from './middleware/rateLimit';

export async function middleware(request: NextRequest) {
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
  response.headers.set('X-XSS-Prefetch-Control', '1; mode=block');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add CSP header if not already set in next.config.js
  if (!response.headers.has('Content-Security-Policy')) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.fbcdn.net https://*.facebook.com https://graph.facebook.com; connect-src 'self' https://graph.facebook.com;"
    );
  }

  return response;
}

// Configure which paths to apply middleware to
export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
    // Apply to all pages except static assets and api routes (which are handled above)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};