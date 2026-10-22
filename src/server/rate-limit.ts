type Entry = { count: number; resetAt: number };

const stores = new Map<string, Map<string, Entry>>();

function getStore(name: string) {
  let s = stores.get(name);
  if (!s) {
    s = new Map();
    stores.set(name, s);
  }
  return s;
}

export function clientAddress(forwardedFor: string | null, trustProxy: boolean): string {
  if (!trustProxy) return 'direct';
  const hops = (forwardedFor ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return hops[hops.length - 1] ?? 'unknown';
}

export function checkRateLimit(
  name: string,
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const store = getStore(name);
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}
