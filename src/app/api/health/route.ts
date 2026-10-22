import { getPrisma } from '@/server/db/prisma';
import { serviceUnavailable } from '@/server/http/errors';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';

export const GET = withHandler(async () => {
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return json({ ok: true });
  } catch {
    throw serviceUnavailable({ ok: false });
  }
});
