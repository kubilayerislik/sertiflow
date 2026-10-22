import { generateSamplePdf } from '@/server/certificates';
import { requireSession } from '@/server/auth/session';
import { RouteContext, withHandler } from '@/server/http/wrap';
import { binary } from '@/server/http/response';


async function preview(_request: Request, context: RouteContext) {
  await requireSession();
  const { courseId } = await context.params;
  const pdf = await generateSamplePdf(courseId);
  return binary(Buffer.from(pdf), 'application/pdf', { 'Cache-Control': 'no-store' });
}

export const GET = withHandler(preview);
export const POST = withHandler(preview);
