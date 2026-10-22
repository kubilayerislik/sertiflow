import { sendTestMail } from '@/server/mail';
import { requireSession } from '@/server/auth/session';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';

export const POST = withHandler(async () => {
  const user = await requireSession();
  return json(await sendTestMail(user.email));
});
