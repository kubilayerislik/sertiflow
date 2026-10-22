import * as XLSX from 'xlsx';
import {
  buildSearchText,
  emailSchema,
  formatCertificateNo,
  generateVerificationCode,
  toUtcDateOnly,
  trLower,
} from '@/shared';
import { getEnv } from './config/env';
import { getPrisma } from './db/prisma';
import { badRequest, notFound } from './http/errors';
import { assertTemplateReady } from './templates';

const MAX_BYTES = 5 * 1024 * 1024;

type RowStatus = 'OK' | 'ERROR' | 'EXISTS' | 'DUPLICATE';

export interface PreviewRow {
  rowNumber: number;
  firstName: string;
  lastName: string;
  studentNo: string;
  email: string;
  status: RowStatus;
  reason?: string;
}

export function generateImportSample(): Buffer {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Ad', 'Soyad', 'Öğrenci No', 'E-posta'],
    ['İsim', 'Soyisim', '20240001', 'kisi@ornek.com'],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Öğrenciler');
  ws['C2'].z = '@';
  ws['C2'].t = 's';
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

function normalizeHeader(h: string): string {
  return trLower(h).replace(/\s+/g, '').replace(/_/g, '');
}

function mapHeaders(headers: string[]) {
  const map: Record<string, number> = {};
  headers.forEach((h, i) => {
    const key = normalizeHeader(h);
    if (['ad', 'firstname'].includes(key)) map.firstName = i;
    if (['soyad', 'lastname'].includes(key)) map.lastName = i;
    if (['ogrencino', 'ogrencinumarasi', 'studentno'].includes(key)) map.studentNo = i;
    if (['eposta', 'email', 'mail'].includes(key)) map.email = i;
  });
  return map;
}

export async function previewImport(courseId: string, buffer: Buffer, certificateDate: Date) {
  if (buffer.length > MAX_BYTES) throw badRequest('Dosya en fazla 5 MB olabilir');
  const prisma = getPrisma();
  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null },
  });
  if (!course) throw notFound();
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as (string | number)[][];

  if (rows.length < 2) throw badRequest('Dosya boş');
  const header = rows[0].map((c) => String(c));
  const col = mapHeaders(header);
  if (
    col.firstName === undefined ||
    col.lastName === undefined ||
    col.studentNo === undefined ||
    col.email === undefined
  ) {
    throw badRequest('Gerekli sütunlar bulunamadı');
  }

  const maxRows = getEnv().IMPORT_MAX_ROWS ?? 2000;
  const dataRows = rows.slice(1).filter((r) => r.some((c) => String(c).trim()));
  if (dataRows.length > maxRows) {
    throw badRequest(`En fazla ${maxRows} satır yüklenebilir`);
  }

  const existing = await prisma.enrollment.findMany({
    where: { courseId, deletedAt: null, anonymizedAt: null },
    select: { studentNo: true },
  });
  const existingSet = new Set(existing.map((e) => e.studentNo));
  const seen = new Set<string>();
  const preview: PreviewRow[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i];
    const firstName = String(r[col.firstName] ?? '').trim();
    const lastName = String(r[col.lastName] ?? '').trim();
    let studentNo = String(r[col.studentNo] ?? '').trim();
    const email = String(r[col.email] ?? '').trim().toLowerCase();
    const rowNumber = i + 2;

    if (/[eE][+-]?\d+/.test(studentNo)) {
      preview.push({
        rowNumber,
        firstName,
        lastName,
        studentNo,
        email,
        status: 'ERROR',
        reason: 'Öğrenci no bilimsel gösterimde',
      });
      continue;
    }
    if (!firstName || !lastName || !studentNo || !email) {
      preview.push({
        rowNumber,
        firstName,
        lastName,
        studentNo,
        email,
        status: 'ERROR',
        reason: 'Ad, soyad, öğrenci no veya e-posta eksik',
      });
      continue;
    }
    const emailCheck = emailSchema.safeParse(email);
    if (!emailCheck.success) {
      const reason =
        emailCheck.error.issues[0]?.message ?? 'E-posta geçersiz veya Türkçe karakter içeriyor';
      preview.push({
        rowNumber,
        firstName,
        lastName,
        studentNo,
        email,
        status: 'ERROR',
        reason,
      });
      continue;
    }
    if (seen.has(studentNo)) {
      preview.push({
        rowNumber,
        firstName,
        lastName,
        studentNo,
        email,
        status: 'DUPLICATE',
        reason: 'Dosyada tekrar ediyor',
      });
      continue;
    }
    seen.add(studentNo);
    if (existingSet.has(studentNo)) {
      preview.push({
        rowNumber,
        firstName,
        lastName,
        studentNo,
        email,
        status: 'EXISTS',
        reason: 'Kursta zaten var',
      });
      continue;
    }
    preview.push({ rowNumber, firstName, lastName, studentNo, email, status: 'OK' });
  }

  return { certificateDate: toUtcDateOnly(certificateDate), rows: preview };
}

export async function confirmImport(
  courseId: string,
  userId: string,
  fileName: string,
  certificateDate: Date,
  rows: Array<{ firstName: string; lastName: string; studentNo: string; email: string }>,
) {
  await assertTemplateReady(courseId);
  const prisma = getPrisma();
  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null },
  });
  if (!course) throw notFound();
  const certDate = toUtcDateOnly(certificateDate);

  const revalidated = await previewImport(courseId, rowsToBuffer(rows), certDate);
  const okRows = revalidated.rows.filter((r) => r.status === 'OK');
  if (okRows.length !== rows.length) {
    throw badRequest('Önizleme doğrulaması başarısız');
  }

  return prisma.$transaction(
    async (tx) => {
      const batch = await tx.importBatch.create({
        data: {
          courseId,
          fileName,
          certificateDate: certDate,
          totalRows: rows.length,
          insertedRows: rows.length,
          skippedRows: 0,
          createdById: userId,
        },
      });
      const updatedCourse = await tx.course.update({
        where: { id: courseId },
        data: { certificateSeq: { increment: rows.length } },
      });
      const startSeq = updatedCourse.certificateSeq - rows.length + 1;
      const enrollments = rows.map((row, idx) => {
        const certificateNo = formatCertificateNo(course.shortName, startSeq + idx);
        return {
          courseId,
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          studentNo: row.studentNo.trim(),
          email: row.email.trim().toLowerCase(),
          certificateDate: certDate,
          certificateNo,
          verificationCode: generateVerificationCode(),
          searchText: buildSearchText([
            row.firstName,
            row.lastName,
            row.studentNo,
            certificateNo,
            row.email,
          ]),
          importBatchId: batch.id,
          createdById: userId,
        };
      });
      await tx.enrollment.createMany({ data: enrollments });
      return { batch, inserted: rows.length };
    },
    { timeout: 120_000 },
  );
}

function rowsToBuffer(
  rows: Array<{ firstName: string; lastName: string; studentNo: string; email: string }>,
): Buffer {
  const data = [
    ['Ad', 'Soyad', 'Öğrenci No', 'E-posta'],
    ...rows.map((r) => [r.firstName, r.lastName, r.studentNo, r.email]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
