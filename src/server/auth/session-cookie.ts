import { SignJWT, jwtVerify } from 'jose';
export const SESSION_COOKIE = 'sertiflow.session';
const MAX_AGE_SEC = 7 * 24 * 60 * 60;

export type UserRole = 'ADMIN' | 'USER';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET en az 32 karakter olmalı');
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const user = payload.user as SessionUser | undefined;
    if (!user?.id) return null;
    return user;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE_SEC,
  };
}

type SessionCookieResponse = {
  cookies: {
    set: (
      name: string,
      value: string,
      options: ReturnType<typeof sessionCookieOptions>,
    ) => void;
  };
};

export function clearSessionCookie(response: SessionCookieResponse) {
  const secure = process.env.NODE_ENV === 'production';
  response.cookies.set(SESSION_COOKIE, '', {
    ...sessionCookieOptions(secure),
    maxAge: 0,
  });
}
