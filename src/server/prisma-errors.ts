export function isPrismaUniqueViolation(e: unknown): boolean {
  return (e as { code?: string })?.code === 'P2002';
}
