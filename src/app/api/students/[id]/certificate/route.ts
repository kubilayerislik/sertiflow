import { generateCertificateForEnrollment } from '@/server/certificates';
import { requireSession } from '@/server/auth/session';
import { withHandler } from '@/server/http/wrap';
import { binary } from '@/server/http/response';


export const GET = withHandler(async (_request, context) => {
  await requireSession();
  const { id } = await context.params;
  const { bytes, fileName } = await generateCertificateForEnrollment(id);
  return binary(Buffer.from(bytes), 'application/pdf', {
    'Content-Disposition': `inline; filename="${fileName}"`,
    'Cache-Control': 'no-store',
  });
});
