import { clearSessionCookie } from '@/server/auth/session';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';

export const POST = withHandler(async () => {
  const res = json({ ok: true });
  clearSessionCookie(res);
  return res;
});
