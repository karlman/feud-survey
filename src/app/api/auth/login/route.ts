import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? 'dev-secret-change-me'
);

export async function POST(request: Request) {
  const { password } = await request.json() as { password: string };

  if (password !== (process.env.ADMIN_PASSWORD ?? 'changeme')) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET);

  const response = NextResponse.json({ ok: true });
  response.cookies.set('admin-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return response;
}
