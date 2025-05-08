import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get hostname (e.g. vercel.com, test.vercel.app, etc.)
  const hostname = request.headers.get('host');

  // Validate allowed domains
  const allowedDomains = ['localhost:3000', 'www.leadstrack.in', 'leadstrack.in'];
  const isAllowedDomain = allowedDomains.some(domain => hostname?.includes(domain));

  if (!isAllowedDomain) {
    return NextResponse.redirect(new URL('https://www.leadstrack.in'));
  }

  // If on leadstrack.in without www, redirect to www
  if (hostname === 'leadstrack.in') {
    return NextResponse.redirect(new URL(`https://www.${hostname}${request.nextUrl.pathname}`));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};