import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get hostname (e.g. vercel.com, test.vercel.app, etc.)
  const hostname = request.headers.get('host');
  const url = request.nextUrl.clone();

  // Skip middleware for API and static routes
  if (url.pathname.startsWith('/api') || 
      url.pathname.startsWith('/_next') || 
      url.pathname.includes('/static/') ||
      url.pathname.includes('.')) {
    return NextResponse.next();
  }

  // Validate allowed domains
  const allowedDomains = ['localhost:3000', 'www.leadstrack.in', 'leadstrack.in'];
  const isAllowedDomain = allowedDomains.some(domain => hostname?.includes(domain));

  if (!isAllowedDomain) {
    return NextResponse.redirect(new URL('https://www.leadstrack.in'));
  }

  // If on leadstrack.in without www, redirect to www
  if (hostname === 'leadstrack.in') {
    const newUrl = new URL(request.nextUrl.pathname, `https://www.${hostname}`);
    return NextResponse.redirect(newUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /.next (Next.js internals)
     * 4. /static (static files)
     * 5. all root files inside public (e.g. /favicon.ico)
     */
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};