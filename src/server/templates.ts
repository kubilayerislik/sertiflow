import { getPrisma } from './db/prisma';
import { badRequest, notFound } from './http/errors';
import { storage } from './storage';
import { dropInactiveTemplates, withStorageLock } from './template-storage';
import { resolveFontFile } from './certificates/fonts';
import { signatureImageKind } from './templates/signature-image';
import { validateTemplatePdf } from './templates/pdf-utils';

type TemplateFieldRow = {
  fieldType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontKey: string;
  fontSize: number;
  minFontSize: number;
  color: string;
  align: string;
  dateFormat: string | null;
  staticText: string | null;
  uppercase: boolean;
};

function fieldRowsToCreate(templateId: string, fields: TemplateFieldRow[]) {
  return fields.map((f) => ({
    templateId,
    fieldType: f.fieldType,
    x: f.x,
    y: f.y,
    width: f.width,
    height: f.height,
    fontKey: f.fontKey,
    fontSize: f.fontSize,
    minFontSize: f.minFontSize,
    color: f.color,
    align: f.align,
    dateFormat: f.dateFormat,
    staticText: f.staticText,
    uppercase: f.uppercase,
  }));
}

export async function copyTemplateFromCourse(targetCourseId: string, sourceCourseId: string) {
  const prisma = getPrisma();
  if (targetCourseId === sourceCourseId) {
    throw badRequest('Kaynak ve hedef kurs aynı olamaz');
  }
  const target = await prisma.course.findFirst({
    where: { id: targetCourseId, deletedAt: null },
  });
  if (!target) throw notFound();
  const source = await prisma.certificateTemplate.findFirst({
    where: { courseId: sourceCourseId, isActive: true },
    include: { fields: true },
  });
  if (!source) throw badRequest('Kaynak kursun aktif şablonu bulunamadı');
  const sourceCourse = await prisma.course.findFirst({
    where: { id: sourceCourseId, deletedAt: null },
  });
  if (!sourceCourse) throw notFound();
  for (const field of source.fields) resolveFontFile(field.fontKey);

  return withStorageLock(async () => {
    const pdfBuffer = await storage.read(source.storageKey);
    const storageKey = await storage.save(targetCourseId, pdfBuffer, '.pdf');
    let signatureStorageKey: string | null = null;
    if (source.signatureStorageKey) {
      const sigBuffer = await storage.read(source.signatureStorageKey);
      const ext = source.signatureStorageKey.endsWith('.png') ? '.png' : '.jpg';
      signatureStorageKey = await storage.save(targetCourseId, sigBuffer, ext);
    }

    let committed = false;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.certificateTemplate.updateMany({
          where: { courseId: targetCourseId, isActive: true },
          data: { isActive: false },
        });
        const created = await tx.certificateTemplate.create({
          data: {
            courseId: targetCourseId,
            fileName: source.fileName,
            storageKey,
            pageWidth: source.pageWidth,
            pageHeight: source.pageHeight,
            isActive: true,
            signatureStorageKey,
          },
        });
        if (source.fields.length) {
          await tx.templateField.createMany({
            data: fieldRowsToCreate(created.id, source.fields),
          });
        }
      });
      committed = true;
      await dropInactiveTemplates(targetCourseId);
      return getActiveTemplate(targetCourseId);
    } catch (e) {
      if (!committed) {
        await storage.delete(storageKey);
        if (signatureStorageKey) await storage.delete(signatureStorageKey);
      }
      throw e;
    }

  });
}

export async function uploadTemplate(courseId: string, fileName: string, buffer: Buffer) {
  const prisma = getPrisma();
  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null },
  });
  if (!course) throw notFound();
  const dims = await validateTemplatePdf(buffer);
  return withStorageLock(async () => {
    const storageKey = await storage.save(courseId, buffer, '.pdf');
    let committed = false;
    try {
      const created = await prisma.$transaction(async (tx) => {
        const prev = await tx.certificateTemplate.findFirst({
          where: { courseId, isActive: true },
          include: { fields: true },
        });
        if (prev) {
          await tx.certificateTemplate.update({
            where: { id: prev.id },
            data: { isActive: false },
          });
        }
        const sameSize =
          prev &&
          Math.abs(prev.pageWidth - dims.pageWidth) < 0.5 &&
          Math.abs(prev.pageHeight - dims.pageHeight) < 0.5;
        const row = await tx.certificateTemplate.create({
          data: {
            courseId,
            fileName,
            storageKey,
            pageWidth: dims.pageWidth,
            pageHeight: dims.pageHeight,
            isActive: true,
            signatureStorageKey: prev?.signatureStorageKey ?? null,
          },
        });
        if (sameSize && prev?.fields.length) {
          await tx.templateField.createMany({
            data: fieldRowsToCreate(row.id, prev.fields),
          });
        }
        return row;
      });
      committed = true;
      await dropInactiveTemplates(courseId);
      return created;
    } catch (e) {
      if (!committed) await storage.delete(storageKey);
      throw e;
    }
  });
}

export async function getActiveTemplate(courseId: string) {
  const template = await getPrisma().certificateTemplate.findFirst({
    where: { courseId, isActive: true },
    include: { fields: true },
  });
  if (!template) throw notFound();
  return template;
}

export async function getTemplateFile(courseId: string) {
  const template = await getActiveTemplate(courseId);
  const buffer = await storage.read(template.storageKey);
  return { buffer, fileName: template.fileName };
}

export async function saveTemplateFields(courseId: string, fields: Array<Record<string, unknown>>) {
  const template = await getActiveTemplate(courseId);
  for (const field of fields) resolveFontFile(String(field.fontKey));
  const prisma = getPrisma();
  await prisma.templateField.deleteMany({ where: { templateId: template.id } });
  if (fields.length) {
    await prisma.templateField.createMany({
      data: fields.map((f) => ({
        templateId: template.id,
        fieldType: String(f.fieldType),
        x: Number(f.x),
        y: Number(f.y),
        width: Number(f.width),
        height: Number(f.height),
        fontKey: String(f.fontKey),
        fontSize: Number(f.fontSize),
        minFontSize: Number(f.minFontSize),
        color: String(f.color),
        align: String(f.align),
        dateFormat: f.dateFormat ? String(f.dateFormat) : null,
        staticText: f.staticText ? String(f.staticText) : null,
        uppercase: Boolean(f.uppercase),
      })),
    });
  }
  return getActiveTemplate(courseId);
}

export async function assertTemplateReady(courseId: string) {
  const template = await getPrisma().certificateTemplate.findFirst({
    where: { courseId, isActive: true },
    include: { fields: true },
  });
  if (!template || template.fields.length === 0) {
    throw badRequest('Şablon yerleşimi tamamlanmamış');
  }
  const needsSignature = template.fields.some((f) => f.fieldType === 'SIGNATURE');
  if (needsSignature && !template.signatureStorageKey) {
    throw badRequest('Şablonda yetkili imza alanı var; önce imza görseli yükleyin');
  }
  return template;
}

export async function uploadTemplateSignature(courseId: string, buffer: Buffer, mime: string) {
  const kind = signatureImageKind(buffer);
  const mimeOk =
    kind === 'png'
      ? mime === 'image/png'
      : kind === 'jpeg'
        ? mime === 'image/jpeg' || mime === 'image/jpg'
        : false;
  if (!mimeOk) throw badRequest('İmza dosyası PNG veya JPEG olmalıdır');
  if (buffer.length > 1024 * 1024) throw badRequest('İmza dosyası en fazla 1 MB olabilir');
  await getActiveTemplate(courseId);
  const ext = kind === 'png' ? '.png' : '.jpg';
  return withStorageLock(async () => {
    const current = await getPrisma().certificateTemplate.findFirst({
      where: { courseId, isActive: true },
    });
    if (!current) throw notFound();
    const previous = current.signatureStorageKey;
    const key = await storage.save(courseId, buffer, ext);
    let committed = false;
    try {
      const updated = await getPrisma().certificateTemplate.update({
        where: { id: current.id },
        data: { signatureStorageKey: key },
      });
      committed = true;
      await dropInactiveTemplates(courseId);
      if (previous && previous !== key) {
        const stillUsed = await getPrisma().certificateTemplate.count({
          where: { OR: [{ storageKey: previous }, { signatureStorageKey: previous }] },
        });
        if (!stillUsed) await storage.delete(previous);
      }
      return updated;
    } catch (e) {
      if (!committed) await storage.delete(key);
      throw e;
    }
  });
}

export async function getTemplateSignatureFile(courseId: string) {
  const template = await getActiveTemplate(courseId);
  if (!template.signatureStorageKey) throw notFound();
  const buffer = await storage.read(template.signatureStorageKey);
  const mime = template.signatureStorageKey.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return { buffer, mime };
}
