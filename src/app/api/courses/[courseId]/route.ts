import { updateCourseSchema } from '@/shared';
import { getCourse, softDeleteCourse, updateCourse } from '@/server/courses';
import { requireSession } from '@/server/auth/session';
import { readJson } from '@/server/http/parse';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';

export const GET = withHandler(async (_request, context) => {
  await requireSession();
  const { courseId } = await context.params;
  return json(await getCourse(courseId));
});

export const PATCH = withHandler(async (request, context) => {
  await requireSession();
  const { courseId } = await context.params;
  const body = await readJson(request, updateCourseSchema);
  return json(await updateCourse(courseId, body));
});

export const DELETE = withHandler(async (_request, context) => {
  await requireSession();
  const { courseId } = await context.params;
  return json(await softDeleteCourse(courseId));
});
