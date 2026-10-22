import { studentSchema } from '@/shared';
import { createStudent, listStudents } from '@/server/students';
import { requireSession } from '@/server/auth/session';
import { readJson } from '@/server/http/parse';
import { parsePagination } from '@/server/pagination';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';


export const GET = withHandler(async (request, context) => {
  await requireSession();
  const { courseId } = await context.params;
  const { searchParams } = new URL(request.url);
  const p = parsePagination(searchParams.get('page') ?? undefined, searchParams.get('pageSize') ?? undefined);
  return json(
    await listStudents(courseId, {
      search: searchParams.get('search') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
      page: p.page,
      pageSize: p.pageSize,
      deleted: searchParams.get('deleted') === 'true',
    }),
  );
});

export const POST = withHandler(async (request, context) => {
  const user = await requireSession();
  const { courseId } = await context.params;
  const body = await readJson(request, studentSchema);
  return json(await createStudent(courseId, user.id, body));
});
