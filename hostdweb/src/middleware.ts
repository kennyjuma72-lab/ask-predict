import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/' || pathname === '') {
    const hasAuth = req.cookies.has('__session') || req.cookies.has('firebase:hostdweb');
    const url = req.nextUrl.clone();
    url.pathname = hasAuth ? '/dashboard' : '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
