import { uploadTemplate } from '@/server/templates';
import { requireSession } from '@/server/auth/session';
import { readFormFile } from '@/server/http/form';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';


export const POST = withHandler(async (request, context) => {
  await requireSession();
  const { courseId } = await context.params;
  const form = await request.formData();
  const { buffer, fileName } = await readFormFile(form, 'file', 2 * 1024 * 1024);
  return json(await uploadTemplate(courseId, fileName ?? 'template.pdf', buffer));
});
