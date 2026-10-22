import * as argon2 from 'argon2';
import { getPrisma } from '../db/prisma';
import { ApiError } from '../http/errors';
import type { SessionUser } from './session';

const failedAttempts = new Map<string, { count: number; until?: number }>();

export async function login(email: string, password: string): Promise<SessionUser> {
  const key = email.toLowerCase();
  const state = failedAttempts.get(key);
  if (state?.until && Date.now() < state.until) {
    throw new ApiError(401, 'Çok fazla hatalı deneme. Lütfen bekleyin.');
  }
  const user = await getPrisma().user.findUnique({ where: { email: key } });
  if (!user || !user.isActive) {
    recordFailure(key);
    throw new ApiError(401, 'Geçersiz e-posta veya parola');
  }
  if (!user.passwordHash) {
    recordFailure(key);
    throw new ApiError(401, 'Geçersiz e-posta veya parola');
  }
  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) {
    recordFailure(key);
    throw new ApiError(401, 'Geçersiz e-posta veya parola');
  }
  failedAttempts.delete(key);
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

function recordFailure(key: string) {
  const prev = failedAttempts.get(key) ?? { count: 0 };
  const count = prev.count + 1;
  if (count >= 5) {
    failedAttempts.set(key, { count, until: Date.now() + 60_000 });
  } else {
    failedAttempts.set(key, { count });
  }
}
