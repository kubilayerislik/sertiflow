import { updateUserSchema } from '@/shared';
import { updateUser } from '@/server/users';
import { requireAdmin } from '@/server/auth/session';
import { readJson } from '@/server/http/parse';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';


export const PATCH = withHandler(async (request, context) => {
  const current = await requireAdmin();
  const { id } = await context.params;
  const body = await readJson(request, updateUserSchema);
  return json(await updateUser(id, body, current.id));
});
