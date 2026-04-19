import { NextRequest, NextResponse } from 'next/server';

// next-auth v4 stores the session JWT in this cookie.
// Production (HTTPS) uses the __Secure- prefix; dev uses plain name.
function hasSessionCookie(request: NextRequest): boolean {
  return (
    request.cookies.has('next-auth.session-token') ||
    request.cookies.has('__Secure-next-auth.session-token')
  );
}

export function proxy(request: NextRequest) {
  if (!hasSessionCookie(request)) {
    return NextResponse.redirect(new URL('/dashboard/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/((?!login).*)',
    '/solar-analyser/:path*',
    '/admin/((?!login).*)',
  ],
};
