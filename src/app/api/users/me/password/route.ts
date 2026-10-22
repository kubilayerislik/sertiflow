import { changePasswordSchema } from '@/shared';
import { changePassword } from '@/server/users';
import { requireSession } from '@/server/auth/session';
import { getEnv } from '@/server/config/env';
import { readJson } from '@/server/http/parse';
import { notFound } from '@/server/http/errors';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';

export const POST = withHandler(async (request) => {
  if (getEnv().NODE_ENV === 'production') {
    throw notFound();
  }
  const user = await requireSession();
  const body = await readJson(request, changePasswordSchema);
  return json(await changePassword(user.id, body.currentPassword, body.newPassword));
});
