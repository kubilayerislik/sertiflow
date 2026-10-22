import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearSessionCookie, SESSION_COOKIE } from './session-cookie';

describe('clearSessionCookie', () => {
  const previous = process.env.NODE_ENV;

  afterEach(() => {
    (process.env as { NODE_ENV?: string }).NODE_ENV = previous;
  });

  it('repeats the production cookie flags with maxAge 0', () => {
    (process.env as { NODE_ENV?: string }).NODE_ENV = 'production';
    const set = vi.fn();
    clearSessionCookie({ cookies: { set } });
    expect(set).toHaveBeenCalledWith(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  });
});
