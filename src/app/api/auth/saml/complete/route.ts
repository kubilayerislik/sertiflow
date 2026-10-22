import { NextResponse } from 'next/server';
import { consumeSamlCompleteCode } from '@/server/auth/saml-complete-codes';
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from '@/server/auth/session';
import { getEnv } from '@/server/config/env';
import { getPublicBaseUrl } from '@/server/public-base-url';

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code');
  const failUrl = new URL('/giris', getPublicBaseUrl());
  failUrl.searchParams.set('error', 'Oturum tamamlanamadı');
  if (!code) {
    return NextResponse.redirect(failUrl.toString(), 303);
  }
  const user = consumeSamlCompleteCode(code);
  if (!user) {
    return NextResponse.redirect(failUrl.toString(), 303);
  }
  const token = await signSession(user);
  const secure = getEnv().NODE_ENV === 'production';
  const res = NextResponse.redirect(new URL('/kurslar', getPublicBaseUrl()).toString(), 303);
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(secure));
  return res;
}
