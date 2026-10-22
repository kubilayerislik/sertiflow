import { DEFAULT_MAIL_BODY, DEFAULT_MAIL_SUBJECT, toUtcDateOnly } from '@/shared';
import { getPrisma } from './db/prisma';
import { badRequest, conflict, notFound } from './http/errors';
import { isPrismaUniqueViolation } from './prisma-errors';

export async function listCourses(params: { search?: string; page?: number; pageSize?: number }) {
  const prisma = getPrisma();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;
  const term = params.search?.trim();
  const where = {
    deletedAt: null,
    ...(term
      ? {
          OR: [
            { name: { contains: term, mode: 'insensitive' as const } },
            { shortName: { contains: term, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: 'asc' },
      include: {
        templates: {
          where: { isActive: true },
          include: { fields: true },
        },
      },
    }),
    prisma.course.count({ where }),
  ]);
  const withCounts = await Promise.all(
    items.map(async (c) => {
      const activeStudentCount = await prisma.enrollment.count({
        where: { courseId: c.id, deletedAt: null, anonymizedAt: null },
      });
      return mapListItem({ ...c, activeStudentCount });
    }),
  );
  return { items: withCounts, total, page, pageSize };
}

function mapListItem(
  c: {
    id: string;
    name: string;
    shortName: string;
    startDate: Date;
    endDate: Date;
    templates: { fields: unknown[] }[];
    activeStudentCount?: number;
  },
) {
  const activeTemplate = c.templates[0];
  const fieldCount = activeTemplate?.fields.length ?? 0;
  return {
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    startDate: c.startDate,
    endDate: c.endDate,
    activeStudentCount: c.activeStudentCount ?? 0,
    templateStatus: activeTemplate && fieldCount > 0 ? 'READY' : 'INCOMPLETE',
    hasActiveTemplate: Boolean(activeTemplate),
  };
}

export async function getCourse(id: string) {
  const prisma = getPrisma();
  const course = await prisma.course.findFirst({
    where: { id, deletedAt: null },
    include: {
      templates: { where: { isActive: true }, include: { fields: true } },
    },
  });
  if (!course) throw notFound();
  const activeCount = await prisma.enrollment.count({
    where: { courseId: id, deletedAt: null, anonymizedAt: null },
  });
  const mapped = mapListItem({ ...course, activeStudentCount: activeCount });
  return {
    ...mapped,
    description: course.description,
    mailSubject: course.mailSubject,
    mailBody: course.mailBody,
    certificateSeq: course.certificateSeq,
  };
}

export async function createCourse(
  userId: string,
  data: {
    name: string;
    shortName: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    mailSubject?: string;
    mailBody?: string;
  },
) {
  const prisma = getPrisma();
  if (data.endDate < data.startDate) {
    throw badRequest('Bitiş tarihi başlangıçtan önce olamaz');
  }
  const shortName = data.shortName.trim().toUpperCase();
  const active = await prisma.course.findFirst({
    where: { shortName, deletedAt: null },
  });
  if (active) {
    throw conflict(
      'Bu kısa ad aktif bir kursta kullanılıyor. Kurs adı tekrar edebilir; benzersiz olan kısa addır (ör. PYT).',
    );
  }
  const lastWithShort = await prisma.course.findFirst({
    where: { shortName },
    orderBy: { certificateSeq: 'desc' },
    select: { certificateSeq: true },
  });
  try {
    return await prisma.course.create({
      data: {
        name: data.name.trim(),
        shortName,
        description: data.description?.trim(),
        startDate: toUtcDateOnly(data.startDate),
        endDate: toUtcDateOnly(data.endDate),
        mailSubject: data.mailSubject?.trim() || DEFAULT_MAIL_SUBJECT,
        mailBody: data.mailBody?.trim() || DEFAULT_MAIL_BODY,
        certificateSeq: lastWithShort?.certificateSeq ?? 0,
        createdById: userId,
      },
    });
  } catch (e) {
    if (isPrismaUniqueViolation(e)) throw conflict('Kurs kaydedilemedi');
    throw e;
  }
}

export async function updateCourse(
  id: string,
  data: Partial<{
    name: string;
    shortName: string;
    description: string;
    startDate: Date;
    endDate: Date;
    mailSubject: string;
    mailBody: string;
  }>,
) {
  const prisma = getPrisma();
  const course = await prisma.course.findFirst({ where: { id, deletedAt: null } });
  if (!course) throw notFound();
  if (data.shortName && data.shortName !== course.shortName) {
    const hasStudents = await prisma.enrollment.count({ where: { courseId: id } });
    if (hasStudents > 0) {
      throw badRequest('Öğrenci eklendikten sonra kısa ad değiştirilemez');
    }
  }
  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    throw badRequest('Bitiş tarihi başlangıçtan önce olamaz');
  }
  try {
    return await prisma.course.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        shortName: data.shortName,
        description: data.description?.trim(),
        startDate: data.startDate ? toUtcDateOnly(data.startDate) : undefined,
        endDate: data.endDate ? toUtcDateOnly(data.endDate) : undefined,
        mailSubject: data.mailSubject,
        mailBody: data.mailBody,
      },
    });
  } catch (e) {
    if (isPrismaUniqueViolation(e)) throw conflict('Kısa ad zaten kullanılıyor');
    throw e;
  }
}

export async function softDeleteCourse(id: string) {
  const prisma = getPrisma();
  const course = await prisma.course.findFirst({ where: { id, deletedAt: null } });
  if (!course) throw notFound();
  await prisma.course.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return { ok: true };
}
