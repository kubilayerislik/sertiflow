import { getTemplateFile } from '@/server/templates';
import { requireSession } from '@/server/auth/session';
import { withHandler } from '@/server/http/wrap';
import { binary } from '@/server/http/response';


export const GET = withHandler(async (_request, context) => {
  await requireSession();
  const { courseId } = await context.params;
  const { buffer, fileName } = await getTemplateFile(courseId);
  return binary(buffer, 'application/pdf', {
    'Content-Disposition': `inline; filename="${fileName}"`,
  });
});
