import { cookies } from 'next/headers';
import { getPrisma } from '../db/prisma';
import { forbidden, unauthorized } from '../http/errors';
import {
  SESSION_COOKIE,
  SessionUser,
  UserRole,
  verifySessionToken,
} from './session-cookie';

export type { SessionUser, UserRole };
export {
  SESSION_COOKIE,
  clearSessionCookie,
  sessionCookieOptions,
  signSession,
  verifySessionToken,
} from './session-cookie';

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  const dbUser = await getPrisma().user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, fullName: true, role: true, isActive: true },
  });
  if (!dbUser?.isActive) return null;
  return {
    id: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.fullName,
    role: dbUser.role as UserRole,
  };
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw unauthorized();
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireSession();
  if (user.role !== 'ADMIN') throw forbidden('Bu işlem için yönetici yetkisi gerekli');
  return user;
}
