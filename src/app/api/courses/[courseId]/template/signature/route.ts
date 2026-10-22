import {
  getTemplateSignatureFile,
  uploadTemplateSignature,
} from '@/server/templates';
import { requireSession } from '@/server/auth/session';
import { readFormFile } from '@/server/http/form';
import { withHandler } from '@/server/http/wrap';
import { binary, json } from '@/server/http/response';


export const POST = withHandler(async (request, context) => {
  await requireSession();
  const { courseId } = await context.params;
  const form = await request.formData();
  const { buffer, mime } = await readFormFile(form, 'file', 1024 * 1024);
  return json(await uploadTemplateSignature(courseId, buffer, mime ?? 'image/png'));
});

export const GET = withHandler(async (_request, context) => {
  await requireSession();
  const { courseId } = await context.params;
  const { buffer, mime } = await getTemplateSignatureFile(courseId);
  return binary(buffer, mime, { 'Cache-Control': 'no-store' });
});
