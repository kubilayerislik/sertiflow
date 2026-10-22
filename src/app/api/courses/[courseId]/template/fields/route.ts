import { templateFieldsSchema } from '@/shared';
import { getActiveTemplate, saveTemplateFields } from '@/server/templates';
import { requireSession } from '@/server/auth/session';
import { readJson } from '@/server/http/parse';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';


export const GET = withHandler(async (_request, context) => {
  await requireSession();
  const { courseId } = await context.params;
  return json(await getActiveTemplate(courseId));
});

export const PUT = withHandler(async (request, context) => {
  await requireSession();
  const { courseId } = await context.params;
  const body = await readJson(request, templateFieldsSchema);
  return json(await saveTemplateFields(courseId, body.fields as Array<Record<string, unknown>>));
});
