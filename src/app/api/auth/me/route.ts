import { NextResponse } from 'next/server';
import { clearSessionCookie, requireSession } from '@/server/auth/session';
import { ApiError } from '@/server/http/errors';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';

export const GET = withHandler(async () => {
  try {
    const user = await requireSession();
    return json({ user });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      const res = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      clearSessionCookie(res);
      return res;
    }
    throw e;
  }
});
