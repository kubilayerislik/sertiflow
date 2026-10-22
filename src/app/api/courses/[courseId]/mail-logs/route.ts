import { listMailLogsForCourse } from '@/server/mail';
import { requireSession } from '@/server/auth/session';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';


export const GET = withHandler(async (request, context) => {
  await requireSession();
  const { courseId } = await context.params;
  const status = new URL(request.url).searchParams.get('status') ?? undefined;
  return json(await listMailLogsForCourse(courseId, status));
});
