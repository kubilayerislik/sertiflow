import { getEnv } from '../config/env';
import { getPrisma } from '../db/prisma';
import { ApiError } from '../http/errors';
import type { SessionUser } from './session-cookie';

function pickEmailFromAssertion(profile: Record<string, unknown>): string | null {
  const env = getEnv();
  const preferred = env.SAML_EMAIL_ATTRIBUTE?.trim();
  const candidates: unknown[] = [];

  if (preferred && profile[preferred] !== undefined) {
    candidates.push(profile[preferred]);
  }
  candidates.push(
    profile.email,
    profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
    profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn'],
    profile.nameID,
  );

  for (const c of candidates) {
    if (typeof c === 'string' && c.includes('@')) {
      return c.toLowerCase().trim();
    }
  }
  return null;
}

export const SAML_LOGIN_REJECTED = 'Giriş kabul edilmedi';

export function samlRedirectErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  console.error(error);
  return SAML_LOGIN_REJECTED;
}

export async function loginFromSamlAssertion(
  profile: Record<string, unknown>,
): Promise<SessionUser> {
  const email = pickEmailFromAssertion(profile);
  if (!email) {
    throw new ApiError(401, 'SAML yanıtında e-posta bulunamadı');
  }
  const user = await getPrisma().user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw new ApiError(403, 'Hesabınız sisteme tanımlı değil veya pasif');
  }
  await getPrisma().user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role as SessionUser['role'],
  };
}
