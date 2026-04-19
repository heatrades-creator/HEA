import { NextRequest, NextResponse } from 'next/server';

// next-auth v4 stores the session JWT in this cookie.
// Production (HTTPS) uses the __Secure- prefix; dev uses the plain name.
function hasSessionCookie(req: NextRequest): boolean {
  return (
    req.cookies.has('next-auth.session-token') ||
    req.cookies.has('__Secure-next-auth.session-token')
  );
}

// Default export required — Next.js only recognises middleware.ts with
// a default export. proxy.ts with a named export is NOT picked up.
export default function middleware(req: NextRequest) {
  if (!hasSessionCookie(req)) {
    return NextResponse.redirect(new URL('/dashboard/login', req.url));
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
