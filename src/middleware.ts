import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isPublicApiPath, isPublicPagePath } from '@/server/auth/public-paths';
import { SESSION_COOKIE, clearSessionCookie, verifySessionToken } from '@/server/auth/session-cookie';

function unauthorizedApi() {
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPagePath(pathname) || isPublicApiPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifySessionToken(token) : null;
  if (user) return NextResponse.next();

  if (pathname === '/api' || pathname.startsWith('/api/')) {
    const res = unauthorizedApi();
    if (token) clearSessionCookie(res);
    return res;
  }

  const res = NextResponse.redirect(new URL('/giris', request.url));
  if (token) clearSessionCookie(res);
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg$|pdf.worker).*)'],
};
