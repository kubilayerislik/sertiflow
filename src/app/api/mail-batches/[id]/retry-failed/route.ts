import { retryFailedMailBatch } from '@/server/mail';
import { requireSession } from '@/server/auth/session';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';


export const POST = withHandler(async (_request, context) => {
  await requireSession();
  const { id } = await context.params;
  return json(await retryFailedMailBatch(id));
});
