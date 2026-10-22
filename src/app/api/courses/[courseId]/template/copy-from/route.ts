import { copyTemplateSchema } from '@/shared';
import { copyTemplateFromCourse } from '@/server/templates';
import { requireSession } from '@/server/auth/session';
import { readJson } from '@/server/http/parse';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';


export const POST = withHandler(async (request, context) => {
  await requireSession();
  const { courseId } = await context.params;
  const body = await readJson(request, copyTemplateSchema);
  return json(await copyTemplateFromCourse(courseId, body.sourceCourseId));
});
