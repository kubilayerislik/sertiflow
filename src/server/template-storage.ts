import { getPrisma } from './db/prisma';
import { storage, unreferencedKeys } from './storage';

const DELETED_COURSE_FILE_DAYS = 90;

let tail: Promise<unknown> = Promise.resolve();

export function withStorageLock<T>(task: () => Promise<T>): Promise<T> {
  const run = tail.then(task, task);
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function releaseUnusedKeys(keys: Array<string | null | undefined>) {
  const unique = [...new Set(keys.filter((key): key is string => Boolean(key)))];
  if (!unique.length) return 0;
  const stillUsed = await getPrisma().certificateTemplate.findMany({
    where: {
      OR: [{ storageKey: { in: unique } }, { signatureStorageKey: { in: unique } }],
    },
    select: { storageKey: true, signatureStorageKey: true },
  });
  const live = new Set<string>();
  for (const row of stillUsed) {
    live.add(row.storageKey);
    if (row.signatureStorageKey) live.add(row.signatureStorageKey);
  }
  let removed = 0;
  for (const key of unique) {
    if (live.has(key)) continue;
    await storage.delete(key);
    removed += 1;
  }
  return removed;
}

export async function dropInactiveTemplates(courseId?: string) {
  const prisma = getPrisma();
  const where = { isActive: false, ...(courseId ? { courseId } : {}) };
  const stale = await prisma.certificateTemplate.findMany({
    where,
    select: { storageKey: true, signatureStorageKey: true },
  });
  if (!stale.length) return 0;
  await prisma.certificateTemplate.deleteMany({ where });
  await releaseUnusedKeys(stale.flatMap((row) => [row.storageKey, row.signatureStorageKey]));
  return stale.length;
}

async function dropExpiredCourseTemplates() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DELETED_COURSE_FILE_DAYS);
  const prisma = getPrisma();
  const courses = await prisma.course.findMany({
    where: { deletedAt: { lte: cutoff } },
    select: { id: true },
  });
  if (!courses.length) return 0;
  const ids = courses.map((course) => course.id);
  const stale = await prisma.certificateTemplate.findMany({
    where: { courseId: { in: ids } },
    select: { storageKey: true, signatureStorageKey: true },
  });
  if (!stale.length) return 0;
  await prisma.certificateTemplate.deleteMany({ where: { courseId: { in: ids } } });
  await releaseUnusedKeys(stale.flatMap((row) => [row.storageKey, row.signatureStorageKey]));
  return stale.length;
}

async function sweepOrphanFiles() {
  const rows = await getPrisma().certificateTemplate.findMany({
    select: { storageKey: true, signatureStorageKey: true },
  });
  const live = new Set<string>();
  for (const row of rows) {
    live.add(row.storageKey);
    if (row.signatureStorageKey) live.add(row.signatureStorageKey);
  }
  const orphans = unreferencedKeys(await storage.listFiles(), live);
  for (const key of orphans) await storage.delete(key);
  return orphans.length;
}

export function reclaimTemplateStorage() {
  return withStorageLock(async () => {
    const inactive = await dropInactiveTemplates();
    const expired = await dropExpiredCourseTemplates();
    const orphans = await sweepOrphanFiles();
    if (inactive || expired || orphans) {
      console.log(
        `[storage] pasif şablon: ${inactive}, süresi dolmuş kurs: ${expired}, artık dosya: ${orphans}`,
      );
    }
    return { inactive, expired, orphans };
  });
}
