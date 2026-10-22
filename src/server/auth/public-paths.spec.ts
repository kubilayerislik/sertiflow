import { describe, expect, it } from 'vitest';
import { isPublicApiPath, isPublicPagePath } from './public-paths';

describe('public paths', () => {
  it('leaves session-free API routes open', () => {
    expect(isPublicApiPath('/api/health')).toBe(true);
    expect(isPublicApiPath('/api/config')).toBe(true);
    expect(isPublicApiPath('/api/auth/login')).toBe(true);
    expect(isPublicApiPath('/api/auth/saml/acs')).toBe(true);
    expect(isPublicApiPath('/api/public/verify/ABC123')).toBe(true);
  });

  it('closes every other API route', () => {
    expect(isPublicApiPath('/api/courses')).toBe(false);
    expect(isPublicApiPath('/api/auth/me')).toBe(false);
    expect(isPublicApiPath('/api/auth/logout')).toBe(false);
    expect(isPublicApiPath('/api/public/verify')).toBe(false);
    expect(isPublicApiPath('/api/mail/test')).toBe(false);
  });

  it('treats login and verification pages as public', () => {
    expect(isPublicPagePath('/giris')).toBe(true);
    expect(isPublicPagePath('/dogrula/ABC')).toBe(true);
    expect(isPublicPagePath('/kurslar')).toBe(false);
  });
});
