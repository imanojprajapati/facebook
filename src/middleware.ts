import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Convert array to string for CSP header
const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.fbcdn.net https://*.facebook.com",
  "font-src 'self'",
  "frame-src 'self' https://www.facebook.com",
  "connect-src 'self' https://*.facebook.com https://graph.facebook.com",
  "form-action 'self' https://www.facebook.com",
  "base-uri 'self'",
].join("; ");

export async function middleware(request: NextRequest) {
  // Create response
  const response = NextResponse.next();

  // Add security headers
  const headers = response.headers;

  // Content Security Policy
  headers.set("Content-Security-Policy", cspHeader);

  // Set CORS headers for auth routes
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    headers.set('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  }

  // Other security headers
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

// Only run middleware on API routes and auth pages
export const config = {
  matcher: [
    '/api/:path*',
    '/auth/:path*',
  ],
};