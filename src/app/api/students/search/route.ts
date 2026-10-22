import { searchStudentsGlobal } from '@/server/students';
import { requireSession } from '@/server/auth/session';
import { parsePagination } from '@/server/pagination';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';

export const GET = withHandler(async (request) => {
  await requireSession();
  const { searchParams } = new URL(request.url);
  const p = parsePagination(searchParams.get('page') ?? undefined, searchParams.get('pageSize') ?? undefined);
  return json(
    await searchStudentsGlobal({
      search: searchParams.get('search') ?? '',
      page: p.page,
      pageSize: p.pageSize,
    }),
  );
});
