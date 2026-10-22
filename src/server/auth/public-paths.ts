const PUBLIC_PAGES = ['/giris', '/dogrula'];

const PUBLIC_API = new Set([
  '/api/health',
  '/api/config',
  '/api/auth/login',
  '/api/auth/saml/login',
  '/api/auth/saml/acs',
  '/api/auth/saml/metadata',
  '/api/auth/saml/complete',
]);

export function isPublicPagePath(pathname: string): boolean {
  return PUBLIC_PAGES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isPublicApiPath(pathname: string): boolean {
  if (PUBLIC_API.has(pathname)) return true;
  return pathname.startsWith('/api/public/verify/');
}
