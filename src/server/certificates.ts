import { asciiFileName } from '@/shared';
import { renderCertificatePdf } from './certificates/engine';
import type { TemplateFieldInput } from './certificates/engine';
import { getPrisma } from './db/prisma';
import { badRequest, notFound } from './http/errors';
import { getPublicBaseUrl } from './public-base-url';
import { storage } from './storage';
import { assertTemplateReady } from './templates';

export async function generateCertificateForEnrollment(enrollmentId: string) {
  const enrollment = await getPrisma().enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true },
  });
  if (!enrollment || enrollment.deletedAt || enrollment.anonymizedAt) {
    throw badRequest('Kayıt geçersiz');
  }
  if (enrollment.course.deletedAt) throw badRequest('Kurs silinmiş');
  const template = await assertTemplateReady(enrollment.courseId);
  const bytes = await renderPdf(template, {
    firstName: enrollment.firstName,
    lastName: enrollment.lastName,
    studentNo: enrollment.studentNo,
    certificateNo: enrollment.certificateNo,
    courseName: enrollment.course.name,
    certificateDate: enrollment.certificateDate,
    courseStart: enrollment.course.startDate,
    courseEnd: enrollment.course.endDate,
    verificationCode: enrollment.verificationCode,
  });
  const fileName = `Sertifika_${asciiFileName(`${enrollment.firstName}_${enrollment.lastName}`)}.pdf`;
  return { bytes, fileName };
}

export async function generateSamplePdf(courseId: string) {
  const course = await getPrisma().course.findFirst({
    where: { id: courseId, deletedAt: null },
  });
  if (!course) throw notFound();
  const template = await assertTemplateReady(courseId);
  const enrollment = await getPrisma().enrollment.findFirst({
    where: { courseId, deletedAt: null, anonymizedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  const verificationCode = enrollment?.verificationCode ?? 'K7M2-QX9P-4TRA';
  if (!enrollment && process.env.NODE_ENV === 'development') {
    console.warn(
      '[sample-pdf] Kursa öğrenci ekleyin; örnek QR doğrulaması geçerli kayıt bulamaz.',
    );
  }
  return renderPdf(template, {
    firstName: enrollment?.firstName ?? 'İsim',
    lastName: enrollment?.lastName ?? 'Soyisim',
    studentNo: enrollment?.studentNo ?? '20240001',
    certificateNo: enrollment?.certificateNo ?? `${course.shortName}-0001`,
    courseName: course.name,
    certificateDate: enrollment?.certificateDate ?? course.endDate,
    courseStart: course.startDate,
    courseEnd: course.endDate,
    verificationCode,
  });
}

async function renderPdf(
  template: {
    storageKey: string;
    signatureStorageKey?: string | null;
    pageWidth: number;
    pageHeight: number;
    fields: Array<Record<string, unknown>>;
  },
  data: {
    firstName: string;
    lastName: string;
    studentNo: string;
    certificateNo: string;
    courseName: string;
    certificateDate: Date;
    courseStart: Date;
    courseEnd: Date;
    verificationCode: string;
    verificationUrl?: string;
  },
) {
  const actualBytes = await storage.read(template.storageKey);
  const verificationUrl =
    data.verificationUrl ?? `${getPublicBaseUrl()}/dogrula/${data.verificationCode}`;
  let signatureImageBytes: Buffer | null = null;
  if (template.signatureStorageKey) {
    signatureImageBytes = await storage.read(template.signatureStorageKey);
  }
  return renderCertificatePdf(
    actualBytes,
    template.fields as unknown as TemplateFieldInput[],
    template.pageWidth,
    template.pageHeight,
    { ...data, verificationUrl, signatureImageBytes },
  );
}
