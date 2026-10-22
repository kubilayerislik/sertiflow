import * as argon2 from 'argon2';
import type { UserRole } from '@prisma/client';
import { getEnv } from './config/env';
import { getPrisma } from './db/prisma';
import { badRequest, conflict, notFound } from './http/errors';

export function listUsers() {
  return getPrisma().user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
}

export async function createUser(data: {
  email: string;
  fullName: string;
  role: UserRole;
  password?: string;
}) {
  const env = getEnv();
  if (env.NODE_ENV === 'development') {
    if (!data.password) {
      throw badRequest('Geliştirme ortamında parola gereklidir');
    }
  }
  const passwordHash = data.password ? await argon2.hash(data.password) : null;
  try {
    return await getPrisma().user.create({
      data: {
        email: data.email.toLowerCase(),
        fullName: data.fullName.trim(),
        role: data.role,
        passwordHash,
      },
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });
  } catch {
    throw conflict('Bu e-posta zaten kayıtlı');
  }
}

async function countActiveAdmins(excludeId?: string) {
  return getPrisma().user.count({
    where: {
      role: 'ADMIN',
      isActive: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
}

export async function updateUser(
  id: string,
  data: { fullName?: string; isActive?: boolean; role?: UserRole },
  currentUserId?: string,
) {
  const user = await getPrisma().user.findUnique({ where: { id } });
  if (!user) throw notFound();
  if (data.isActive === false && id === currentUserId) {
    throw badRequest('Kendi hesabınızı pasife alamazsınız');
  }
  if (user.role === 'ADMIN') {
    const demoting = data.role === 'USER';
    const deactivating = data.isActive === false;
    if (demoting || deactivating) {
      const others = await countActiveAdmins(id);
      if (others === 0) {
        throw badRequest('Son aktif yönetici pasife alınamaz veya kullanıcı yapılamaz');
      }
    }
  }
  return getPrisma().user.update({
    where: { id },
    data: {
      fullName: data.fullName?.trim(),
      isActive: data.isActive,
      role: data.role,
    },
    select: { id: true, email: true, fullName: true, role: true, isActive: true },
  });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const env = getEnv();
  if (env.NODE_ENV === 'production') {
    throw badRequest('Parola değiştirme üretim ortamında kullanılamaz');
  }
  const user = await getPrisma().user.findUnique({ where: { id: userId } });
  if (!user) throw notFound();
  if (!user.passwordHash) {
    throw badRequest('Bu hesap için parola girişi tanımlı değil');
  }
  const ok = await argon2.verify(user.passwordHash, currentPassword);
  if (!ok) throw badRequest('Mevcut parola hatalı');
  const passwordHash = await argon2.hash(newPassword);
  await getPrisma().user.update({ where: { id: userId }, data: { passwordHash } });
  return { ok: true };
}
