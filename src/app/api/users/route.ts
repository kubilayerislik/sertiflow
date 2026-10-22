import { createUserSchema, createUserSchemaDev } from '@/shared';
import { createUser, listUsers } from '@/server/users';
import { requireAdmin } from '@/server/auth/session';
import { getEnv } from '@/server/config/env';
import { readJson } from '@/server/http/parse';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';

export const GET = withHandler(async () => {
  await requireAdmin();
  return json(await listUsers());
});

export const POST = withHandler(async (request) => {
  await requireAdmin();
  const env = getEnv();
  const schema = env.NODE_ENV === 'development' ? createUserSchemaDev : createUserSchema;
  const body = await readJson(request, schema);
  return json(
    await createUser({
      email: body.email,
      fullName: body.fullName,
      role: body.role ?? 'USER',
      password: body.password,
    }),
  );
});
