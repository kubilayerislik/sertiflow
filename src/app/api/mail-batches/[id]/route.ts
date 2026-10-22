import { getMailBatch } from '@/server/mail';
import { requireSession } from '@/server/auth/session';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';


export const GET = withHandler(async (_request, context) => {
  await requireSession();
  const { id } = await context.params;
  return json(await getMailBatch(id));
});
