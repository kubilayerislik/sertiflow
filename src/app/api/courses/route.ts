import { createCourseSchema } from '@/shared';
import { createCourse, listCourses } from '@/server/courses';
import { requireSession } from '@/server/auth/session';
import { readJson } from '@/server/http/parse';
import { parsePagination } from '@/server/pagination';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';

export const GET = withHandler(async (request) => {
  await requireSession();
  const { searchParams } = new URL(request.url);
  const p = parsePagination(searchParams.get('page') ?? undefined, searchParams.get('pageSize') ?? undefined);
  return json(
    await listCourses({
      search: searchParams.get('search') ?? undefined,
      page: p.page,
      pageSize: p.pageSize,
    }),
  );
});

export const POST = withHandler(async (request) => {
  const user = await requireSession();
  const body = await readJson(request, createCourseSchema);
  return json(await createCourse(user.id, body));
});
