import { importConfirmSchema } from '@/shared';
import { confirmImport } from '@/server/import';
import { requireSession } from '@/server/auth/session';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';


export const POST = withHandler(async (request, context) => {
  const user = await requireSession();
  const { courseId } = await context.params;
  const raw = (await request.json()) as Record<string, unknown>;
  const body = importConfirmSchema.parse(raw);
  const fileName = typeof raw.fileName === 'string' ? raw.fileName : 'import.xlsx';
  return json(
    await confirmImport(courseId, user.id, fileName, body.certificateDate, body.rows),
  );
});
