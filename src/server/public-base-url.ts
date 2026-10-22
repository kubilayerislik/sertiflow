export function getPublicBaseUrl(): string {
  const fromEnv = process.env.PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT ?? '3000';
    return `http://localhost:${port}`;
  }
  throw new Error('PUBLIC_BASE_URL gerekli');
}
