import {
  formatUtcDate,
  MAIL_BATCH_STATUSES,
  resolveMailBody,
  resolveMailSubject,
} from '@/shared';
import { generateCertificateForEnrollment } from './certificates';
import { getEnv } from './config/env';
import { getPrisma } from './db/prisma';
import { forbidden, notFound } from './http/errors';
import { escapeHtml, maskEmailInError, stripHtml } from './mail/html';
import { SmtpTransport, isRetryableSmtpError } from './mail/smtp.transport';
import { getPublicBaseUrl } from './public-base-url';

const RETRY_MINUTES = [1, 5, 15];
let transport: SmtpTransport | null = null;

function getTransport() {
  if (!transport) transport = new SmtpTransport();
  return transport;
}

export function isMailEnabled() {
  return getEnv().MAIL_ENABLED === true;
}

export function assertMailEnabled() {
  if (!isMailEnabled()) throw forbidden('Mail özelliği kapalı');
}

export async function initMail() {
  if (!isMailEnabled()) return;
  try {
    await getTransport().verify?.();
  } catch (e) {
    console.warn('[mail] SMTP verify başarısız:', e instanceof Error ? e.message : e);
  }
  await recoverStuckSending();
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
}

function templateVars(enrollment: {
  firstName: string;
  lastName: string;
  certificateDate: Date;
  verificationCode: string;
  course: { name: string };
}) {
  const baseUrl = getPublicBaseUrl();
  const dateStr = formatUtcDate(enrollment.certificateDate, 'DD.MM.YYYY');
  const raw = {
    ad: enrollment.firstName,
    soyad: enrollment.lastName,
    kurs_adi: enrollment.course.name,
    sertifika_tarihi: dateStr,
    dogrulama_linki: `${baseUrl}/dogrula/${enrollment.verificationCode}`,
  };
  const escaped: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    escaped[k] = escapeHtml(v);
  }
  return { raw, escaped };
}

export async function recoverStuckSending() {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000);
  await getPrisma().mailLog.updateMany({
    where: { status: 'SENDING', queuedAt: { lt: cutoff } },
    data: { status: 'QUEUED', nextAttemptAt: new Date() },
  });
}

export async function processQueuedLog(logId: string) {
  assertMailEnabled();
  const prisma = getPrisma();
  const log = await prisma.mailLog.findUnique({ where: { id: logId } });
  if (!log || log.status !== 'QUEUED') return;
  if (log.nextAttemptAt && log.nextAttemptAt > new Date()) return;

  await prisma.mailLog.update({
    where: { id: logId },
    data: { status: 'SENDING', attempts: { increment: 1 } },
  });
  try {
    await deliverEnrollment(log.enrollmentId);
    await prisma.mailLog.update({
      where: { id: logId },
      data: { status: 'SENT', sentAt: new Date(), errorMessage: null, nextAttemptAt: null },
    });
    if (log.mailBatchId) await refreshBatchCounts(log.mailBatchId);
  } catch (e) {
    const updated = await prisma.mailLog.findUnique({ where: { id: logId } });
    const attempts = updated?.attempts ?? 1;
    const rawMsg = e instanceof Error ? e.message : 'Gönderim hatası';
    const errorMessage = maskEmailInError(rawMsg);
    const retryable = isRetryableSmtpError(rawMsg);
    const failed = !retryable || attempts >= 3;
    const nextAttemptAt = failed
      ? null
      : new Date(
          Date.now() +
            RETRY_MINUTES[Math.min(attempts - 1, RETRY_MINUTES.length - 1)] * 60_000,
        );
    await prisma.mailLog.update({
      where: { id: logId },
      data: {
        status: failed ? 'FAILED' : 'QUEUED',
        errorMessage,
        nextAttemptAt,
      },
    });
    if (log.mailBatchId) await refreshBatchCounts(log.mailBatchId);
  }
}

async function refreshBatchCounts(batchId: string) {
  const prisma = getPrisma();
  const logs = await prisma.mailLog.findMany({
    where: { mailBatchId: batchId },
    select: { status: true },
  });
  const sentCount = logs.filter((l) => l.status === 'SENT').length;
  const failedCount = logs.filter((l) => l.status === 'FAILED').length;
  const pending = logs.some((l) => l.status === 'QUEUED' || l.status === 'SENDING');
  const status = pending
    ? MAIL_BATCH_STATUSES[1]
    : failedCount > 0 && sentCount === 0
      ? MAIL_BATCH_STATUSES[3]
      : MAIL_BATCH_STATUSES[2];
  await prisma.mailBatch.update({
    where: { id: batchId },
    data: {
      sentCount,
      failedCount,
      status,
      finishedAt: pending ? null : new Date(),
    },
  });
}

export async function sendOneMail(enrollmentId: string, userId: string) {
  const enrollment = await getPrisma().enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true },
  });
  if (!enrollment || enrollment.deletedAt) throw notFound();

  if (!isMailEnabled()) {
    if (getEnv().NODE_ENV === 'production') {
      throw forbidden('Mail özelliği kapalı');
    }
    await getPrisma().mailLog.create({
      data: {
        enrollmentId,
        toEmail: enrollment.email,
        status: 'SENT',
        attempts: 1,
        sentById: userId,
        sentAt: new Date(),
      },
    });
    return { ok: true, simulated: true, toEmail: enrollment.email };
  }

  const log = await getPrisma().mailLog.create({
    data: {
      enrollmentId,
      toEmail: enrollment.email,
      status: 'QUEUED',
      attempts: 0,
      sentById: userId,
      nextAttemptAt: new Date(),
    },
  });
  return { ok: true, logId: log.id, toEmail: enrollment.email };
}

export async function sendTestMail(userEmail: string) {
  assertMailEnabled();
  const env = getEnv();
  const from = env.MAIL_FROM ?? 'sertiflow@sertiflow.com';
  await getTransport().send({
    to: userEmail,
    subject: 'Sertiflow test maili',
    html: '<p>Bu bir test mesajıdır. SMTP yapılandırması çalışıyor.</p>',
    text: 'Bu bir test mesajıdır. SMTP yapılandırması çalışıyor.',
  });
  return { ok: true, from };
}

async function deliverEnrollment(enrollmentId: string) {
  const enrollment = await getPrisma().enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true },
  });
  if (!enrollment || enrollment.deletedAt) throw notFound();
  const { bytes, fileName } = await generateCertificateForEnrollment(enrollmentId);
  const { raw, escaped } = templateVars(enrollment);
  const subject = renderTemplate(resolveMailSubject(enrollment.course.mailSubject), raw);
  const htmlBody = renderTemplate(resolveMailBody(enrollment.course.mailBody), escaped);
  await getTransport().send({
    to: enrollment.email,
    subject,
    html: htmlBody,
    text: stripHtml(htmlBody),
    attachments: [
      { filename: fileName, content: Buffer.from(bytes), contentType: 'application/pdf' },
    ],
  });
}

export async function createMailBatch(
  courseId: string,
  userId: string,
  enrollmentIds?: string[],
  skipAlreadySent = true,
) {
  assertMailEnabled();
  const prisma = getPrisma();
  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId,
      deletedAt: null,
      anonymizedAt: null,
      ...(enrollmentIds?.length ? { id: { in: enrollmentIds } } : {}),
    },
  });
  let targets = enrollments;
  if (skipAlreadySent) {
    const sent = await prisma.mailLog.findMany({
      where: { enrollmentId: { in: enrollments.map((e) => e.id) }, status: 'SENT' },
      select: { enrollmentId: true },
    });
    const sentSet = new Set(sent.map((s) => s.enrollmentId));
    targets = enrollments.filter((e) => !sentSet.has(e.id));
  }
  const batch = await prisma.mailBatch.create({
    data: {
      courseId,
      total: targets.length,
      status: MAIL_BATCH_STATUSES[0],
      createdById: userId,
    },
  });
  if (targets.length) {
    await prisma.mailLog.createMany({
      data: targets.map((e) => ({
        enrollmentId: e.id,
        mailBatchId: batch.id,
        toEmail: e.email,
        status: 'QUEUED',
        sentById: userId,
        nextAttemptAt: new Date(),
      })),
    });
  } else {
    await prisma.mailBatch.update({
      where: { id: batch.id },
      data: { status: MAIL_BATCH_STATUSES[2], finishedAt: new Date() },
    });
  }
  return batch;
}

export async function getMailBatch(id: string) {
  const batch = await getPrisma().mailBatch.findUnique({
    where: { id },
    include: { mailLogs: true },
  });
  if (!batch) throw notFound();
  const remaining = batch.mailLogs.filter(
    (l) => l.status === 'QUEUED' || l.status === 'SENDING',
  ).length;
  return { ...batch, remaining };
}

export async function retryFailedMailBatch(batchId: string) {
  assertMailEnabled();
  await getPrisma().mailLog.updateMany({
    where: { mailBatchId: batchId, status: 'FAILED' },
    data: {
      status: 'QUEUED',
      attempts: 0,
      errorMessage: null,
      nextAttemptAt: new Date(),
    },
  });
  await getPrisma().mailBatch.update({
    where: { id: batchId },
    data: { status: MAIL_BATCH_STATUSES[0], finishedAt: null },
  });
  return { ok: true };
}

export async function listMailLogsForStudent(enrollmentId: string) {
  return getPrisma().mailLog.findMany({
    where: { enrollmentId },
    orderBy: { queuedAt: 'desc' },
    include: { sentBy: { select: { fullName: true } } },
  });
}

export async function listMailLogsForCourse(courseId: string, status?: string) {
  return getPrisma().mailLog.findMany({
    where: {
      enrollment: { courseId },
      ...(status ? { status } : {}),
    },
    orderBy: { queuedAt: 'desc' },
    take: 200,
    include: {
      enrollment: { select: { firstName: true, lastName: true, studentNo: true } },
    },
  });
}

export async function processMailQueue() {
  if (!isMailEnabled()) return;
  const rate = getEnv().MAIL_RATE_PER_MINUTE;
  const prisma = getPrisma();
  const logs = await prisma.mailLog.findMany({
    where: {
      status: 'QUEUED',
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
    },
    orderBy: { queuedAt: 'asc' },
    take: rate,
  });
  for (const log of logs) {
    try {
      await processQueuedLog(log.id);
    } catch {
      // processQueuedLog updates log state
    }
  }
}
