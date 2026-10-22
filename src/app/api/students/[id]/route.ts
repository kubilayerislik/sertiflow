import { studentSchema } from '@/shared';
import { softDeleteStudent, updateStudent } from '@/server/students';
import { requireSession } from '@/server/auth/session';
import { readJson } from '@/server/http/parse';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';


export const PATCH = withHandler(async (request, context) => {
  await requireSession();
  const { id } = await context.params;
  const body = await readJson(request, studentSchema.partial());
  return json(await updateStudent(id, body));
});

export const DELETE = withHandler(async (_request, context) => {
  const user = await requireSession();
  const { id } = await context.params;
  return json(await softDeleteStudent(id, user.id));
});
