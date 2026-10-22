import { getPrisma } from '../db/prisma';

export async function runAnonymizeJob() {
  const prisma = getPrisma();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const deletedEnrollments = await prisma.enrollment.findMany({
    where: {
      deletedAt: { lte: cutoff },
      anonymizedAt: null,
    },
    select: { id: true },
  });

  const fromDeletedCourses = await prisma.enrollment.findMany({
    where: {
      anonymizedAt: null,
      deletedAt: null,
      course: { deletedAt: { lte: cutoff } },
    },
    select: { id: true },
  });

  const ids = [...new Set([...deletedEnrollments, ...fromDeletedCourses].map((r) => r.id))];
  if (!ids.length) return;

  for (const id of ids) {
    await prisma.enrollment.update({
      where: { id },
      data: {
        firstName: 'Anonim',
        lastName: 'Anonim',
        studentNo: '',
        email: '',
        searchText: '',
        anonymizedAt: new Date(),
      },
    });
    await prisma.mailLog.updateMany({
      where: { enrollmentId: id },
      data: { toEmail: '', errorMessage: null },
    });
  }
  console.log(`[anonymize] Anonimleştirilen kayıt sayısı: ${ids.length}`);
}
