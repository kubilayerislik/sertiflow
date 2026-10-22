import { loginSchema } from '@/shared';
import { login } from '@/server/auth/auth-service';
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from '@/server/auth/session';
import { getEnv } from '@/server/config/env';
import { readJson } from '@/server/http/parse';
import { notFound, tooManyRequests } from '@/server/http/errors';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';
import { checkRateLimit, clientAddress } from '@/server/rate-limit';

export const POST = withHandler(async (request) => {
  if (getEnv().NODE_ENV === 'production') {
    throw notFound();
  }
  const ip = clientAddress(request.headers.get('x-forwarded-for'), getEnv().TRUST_PROXY);
  if (!checkRateLimit('login', ip, 30, 15 * 60 * 1000)) {
    throw tooManyRequests('Çok fazla istek');
  }
  const body = await readJson(request, loginSchema);
  const user = await login(body.email.toLowerCase(), body.password);
  const token = await signSession(user);
  const secure = getEnv().NODE_ENV === 'production';
  const res = json({ user });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(secure));
  return res;
});
