import { mailBatchSchema } from '@/shared';
import { createMailBatch } from '@/server/mail';
import { requireSession } from '@/server/auth/session';
import { readJson } from '@/server/http/parse';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';


export const POST = withHandler(async (request, context) => {
  const user = await requireSession();
  const { courseId } = await context.params;
  const body = await readJson(request, mailBatchSchema);
  return json(
    await createMailBatch(
      courseId,
      user.id,
      body.enrollmentIds,
      body.skipAlreadySent ?? true,
    ),
  );
});
