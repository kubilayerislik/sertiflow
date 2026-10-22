import { isPublicPagePath } from '@/server/auth/public-paths';

export async function api<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  let body = options.body;
  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.json);
  }
  const res = await fetch(path, {
    ...options,
    headers,
    body,
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const data = err.message && typeof err.message === 'object' ? err.message : err;
    const summary =
      typeof err.message === 'string'
        ? err.message
        : typeof (data as { message?: string })?.message === 'string'
          ? (data as { message: string }).message
          : 'İstek başarısız';
    if (
      res.status === 401 &&
      typeof window !== 'undefined' &&
      !isPublicPagePath(window.location.pathname)
    ) {
      window.location.replace('/giris');
    }
    throw Object.assign(new Error(summary), { status: res.status, data });
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}

