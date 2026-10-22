import { previewImport } from '@/server/import';
import { requireSession } from '@/server/auth/session';
import { badRequest } from '@/server/http/errors';
import { readFormFile } from '@/server/http/form';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';


export const POST = withHandler(async (request, context) => {
  await requireSession();
  const { courseId } = await context.params;
  const form = await request.formData();
  const { buffer } = await readFormFile(form, 'file', 5 * 1024 * 1024);
  const certificateDate = form.get('certificateDate');
  if (!certificateDate || typeof certificateDate !== 'string') {
    throw badRequest('Sertifika tarihi gerekli');
  }
  return json(await previewImport(courseId, buffer, new Date(certificateDate)));
});
