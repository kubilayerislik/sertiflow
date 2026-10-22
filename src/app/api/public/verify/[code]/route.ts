import { verifyCertificate } from '@/server/verify';
import { tooManyRequests } from '@/server/http/errors';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';
import { getEnv } from '@/server/config/env';
import { checkRateLimit, clientAddress } from '@/server/rate-limit';

export const GET = withHandler(async (request, context) => {
  const ip = clientAddress(request.headers.get('x-forwarded-for'), getEnv().TRUST_PROXY);
  if (!checkRateLimit('verify', ip, 100, 15 * 60 * 1000)) {
    throw tooManyRequests('Çok fazla istek');
  }
  const { code } = await context.params;
  return json(await verifyCertificate(code));
});
