import type { SessionUser } from './session-cookie';

const TTL_MS = 2 * 60 * 1000;
const codes = new Map<string, { user: SessionUser; expiresAt: number }>();

export function issueSamlCompleteCode(user: SessionUser): string {
  const code = crypto.randomUUID();
  codes.set(code, { user, expiresAt: Date.now() + TTL_MS });
  return code;
}

export function consumeSamlCompleteCode(code: string): SessionUser | null {
  const entry = codes.get(code);
  codes.delete(code);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.user;
}
