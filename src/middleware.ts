import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? 'dev-secret-change-me'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('admin-session')?.value;
  const isValid = token ? await jwtVerify(token, SECRET).then(() => true).catch(() => false) : false;

  if (!isValid) {
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/surveys/:path*', '/api/auth/logout'],
};
