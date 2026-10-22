import {
  buildSearchText,
  formatCertificateNo,
  generateVerificationCode,
  toUtcDateOnly,
  trLower,
} from '@/shared';
import { getPrisma } from './db/prisma';
import { badRequest, conflict, notFound } from './http/errors';
import { isPrismaUniqueViolation } from './prisma-errors';

function daysUntilAnonymize(deletedAt: Date): number {
  const cutoff = new Date(deletedAt);
  cutoff.setDate(cutoff.getDate() + 90);
  return Math.max(0, Math.ceil((cutoff.getTime() - Date.now()) / 86_400_000));
}

export async function listStudents(
  courseId: string,
  params: {
    search?: string;
    sort?: string;
    page?: number;
    pageSize?: number;
    deleted?: boolean;
  },
) {
  const prisma = getPrisma();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;
  const deleted = params.deleted ?? false;
  const where = {
    courseId,
    ...(deleted
      ? { deletedAt: { not: null }, anonymizedAt: null }
      : { deletedAt: null, anonymizedAt: null }),
    ...(params.search ? { searchText: { contains: trLower(params.search) } } : {}),
  };
  const orderBy = parseSort(params.sort);
  const [items, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
      include: {
        mailLogs: { orderBy: { queuedAt: 'desc' }, take: 1 },
        deletedBy: { select: { fullName: true } },
      },
    }),
    prisma.enrollment.count({ where }),
  ]);
  return {
    items: items.map((e) => ({
      id: e.id,
      firstName: e.firstName,
      lastName: e.lastName,
      studentNo: e.studentNo,
      email: e.email,
      certificateNo: e.certificateNo,
      certificateDate: e.certificateDate,
      deletedAt: e.deletedAt,
      deletedBy: e.deletedBy?.fullName,
      daysUntilAnonymize: e.deletedAt ? daysUntilAnonymize(e.deletedAt) : null,
      anonymizedAt: e.anonymizedAt,
      lastMailStatus: e.mailLogs[0]?.status ?? null,
    })),
    total,
    page,
    pageSize,
  };
}

function parseSort(sort?: string) {
  if (!sort) return { lastName: 'asc' as const };
  const [field, dir] = sort.split(':');
  const direction = dir === 'desc' ? 'desc' : 'asc';
  const allowed = ['firstName', 'lastName', 'studentNo', 'email', 'certificateNo', 'certificateDate'];
  if (!allowed.includes(field)) return { lastName: 'asc' as const };
  return { [field]: direction };
}

export async function createStudent(
  courseId: string,
  userId: string,
  data: {
    firstName: string;
    lastName: string;
    studentNo: string;
    email: string;
    certificateDate: Date;
  },
) {
  const prisma = getPrisma();
  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null },
  });
  if (!course) throw notFound();
  const normalized = {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    studentNo: data.studentNo.trim(),
    email: data.email.trim().toLowerCase(),
    certificateDate: toUtcDateOnly(data.certificateDate),
  };
  const deletedMatch = await prisma.enrollment.findFirst({
    where: {
      courseId,
      studentNo: normalized.studentNo,
      deletedAt: { not: null },
      anonymizedAt: null,
    },
  });
  if (deletedMatch) {
    throw conflict({
      message: 'Bu öğrenci no silinmiş bir kayıtta var',
      restoreId: deletedMatch.id,
    });
  }
  const duplicateEmail = await prisma.enrollment.findFirst({
    where: {
      courseId,
      email: normalized.email,
      deletedAt: null,
      anonymizedAt: null,
    },
  });
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const updated = await tx.course.update({
          where: { id: courseId },
          data: { certificateSeq: { increment: 1 } },
        });
        const certificateNo = formatCertificateNo(course.shortName, updated.certificateSeq);
        const enrollment = await tx.enrollment.create({
          data: {
            courseId,
            ...normalized,
            certificateNo,
            verificationCode: generateVerificationCode(),
            searchText: buildSearchText([
              normalized.firstName,
              normalized.lastName,
              normalized.studentNo,
              certificateNo,
              normalized.email,
            ]),
            createdById: userId,
          },
        });
        return { enrollment, emailWarning: duplicateEmail ? true : false };
      });
    } catch (e: unknown) {
      const target = (e as { meta?: { target?: string[] } })?.meta?.target;
      if (isPrismaUniqueViolation(e) && target?.includes('verificationCode') && attempt < 4) {
        continue;
      }
      if (isPrismaUniqueViolation(e) && target?.includes('studentNo')) {
        throw conflict('Öğrenci no bu kursta zaten kayıtlı');
      }
      throw e;
    }
  }
  throw conflict('Kayıt oluşturulamadı');
}

export async function updateStudent(
  id: string,
  data: Partial<{
    firstName: string;
    lastName: string;
    studentNo: string;
    email: string;
    certificateDate: Date;
  }>,
) {
  const prisma = getPrisma();
  const enrollment = await prisma.enrollment.findUnique({ where: { id } });
  if (!enrollment || enrollment.deletedAt) throw notFound();
  const next = {
    firstName: data.firstName?.trim() ?? enrollment.firstName,
    lastName: data.lastName?.trim() ?? enrollment.lastName,
    studentNo: data.studentNo?.trim() ?? enrollment.studentNo,
    email: data.email?.trim().toLowerCase() ?? enrollment.email,
    certificateDate: data.certificateDate
      ? toUtcDateOnly(data.certificateDate)
      : enrollment.certificateDate,
  };
  try {
    return await prisma.enrollment.update({
      where: { id },
      data: {
        ...next,
        searchText: buildSearchText([
          next.firstName,
          next.lastName,
          next.studentNo,
          enrollment.certificateNo,
          next.email,
        ]),
      },
    });
  } catch (e) {
    if (isPrismaUniqueViolation(e)) throw conflict('Öğrenci no çakışıyor');
    throw e;
  }
}

export async function softDeleteStudent(id: string, userId: string) {
  const prisma = getPrisma();
  const enrollment = await prisma.enrollment.findUnique({ where: { id } });
  if (!enrollment || enrollment.deletedAt) throw notFound();
  return prisma.enrollment.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: userId },
  });
}

export async function restoreStudent(id: string) {
  const prisma = getPrisma();
  const enrollment = await prisma.enrollment.findUnique({ where: { id } });
  if (!enrollment || !enrollment.deletedAt || enrollment.anonymizedAt) {
    throw badRequest('Kayıt geri getirilemez');
  }
  const conflictRow = await prisma.enrollment.findFirst({
    where: {
      courseId: enrollment.courseId,
      studentNo: enrollment.studentNo,
      deletedAt: null,
      anonymizedAt: null,
      id: { not: id },
    },
  });
  if (conflictRow) throw conflict('Aynı öğrenci no ile aktif kayıt var');
  return prisma.enrollment.update({
    where: { id },
    data: { deletedAt: null, deletedById: null },
  });
}

export async function searchStudentsGlobal(params: {
  search: string;
  page?: number;
  pageSize?: number;
}) {
  const term = params.search.trim();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;
  if (term.length < 2) {
    return { items: [], total: 0, page, pageSize };
  }
  const prisma = getPrisma();
  const where = {
    deletedAt: null,
    anonymizedAt: null,
    searchText: { contains: trLower(term) },
    course: { deletedAt: null },
  };
  const [rows, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }, { certificateDate: 'desc' }],
      include: {
        course: { select: { id: true, name: true, shortName: true } },
      },
    }),
    prisma.enrollment.count({ where }),
  ]);
  return {
    items: rows.map((e) => ({
      id: e.id,
      firstName: e.firstName,
      lastName: e.lastName,
      studentNo: e.studentNo,
      email: e.email,
      certificateNo: e.certificateNo,
      certificateDate: e.certificateDate,
      verificationCode: e.verificationCode,
      courseId: e.course.id,
      courseName: e.course.name,
      courseShortName: e.course.shortName,
    })),
    total,
    page,
    pageSize,
  };
}
