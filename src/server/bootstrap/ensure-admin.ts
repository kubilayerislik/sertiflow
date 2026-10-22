import * as argon2 from 'argon2';
import { getEnv } from '../config/env';
import { getPrisma } from '../db/prisma';

export async function ensureAdminUser() {
  const prisma = getPrisma();
  const env = getEnv();
  const email = (env.ADMIN_EMAIL ?? 'sertiflow@sertiflow.com').toLowerCase();
  const password = env.ADMIN_PASSWORD;

  const count = await prisma.user.count();

  if (count === 0) {
    if (env.NODE_ENV === 'production') {
      await prisma.user.create({
        data: {
          email,
          fullName: 'Sistem Yöneticisi',
          role: 'ADMIN',
          isActive: true,
        },
      });
      console.log(`[bootstrap] İlk yönetici oluşturuldu (SAML): ${email}`);
      return;
    }
    if (!password) {
      console.warn('[bootstrap] Kullanıcı yok; ADMIN_PASSWORD tanımlayın veya manuel ekleyin.');
      return;
    }
    const passwordHash = await argon2.hash(password);
    await prisma.user.create({
      data: {
        email,
        fullName: 'Sistem Yöneticisi',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log(`[bootstrap] İlk yönetici oluşturuldu: ${email}`);
    return;
  }

  if (env.NODE_ENV === 'development' && password) {
    const admin = await prisma.user.findUnique({ where: { email } });
    if (admin) {
      const passwordHash = await argon2.hash(password);
      await prisma.user.update({
        where: { id: admin.id },
        data: { passwordHash, isActive: true },
      });
      console.log(`[bootstrap] Yönetici parolası .env ile güncellendi: ${email}`);
    }
  }
}
