import { maskName } from '@/shared';
import { getPrisma } from './db/prisma';

export async function verifyCertificate(code: string) {
  const enrollment = await getPrisma().enrollment.findUnique({
    where: { verificationCode: code },
    include: { course: true },
  });
  if (
    !enrollment ||
    enrollment.deletedAt ||
    enrollment.anonymizedAt ||
    enrollment.course.deletedAt
  ) {
    return { valid: false, message: 'Bu sertifika geçerli değil' };
  }
  return {
    valid: true,
    maskedName: maskName(`${enrollment.firstName} ${enrollment.lastName}`),
    courseName: enrollment.course.name,
    certificateNo: enrollment.certificateNo,
    certificateDate: enrollment.certificateDate,
  };
}
