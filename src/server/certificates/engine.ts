import { PDFDocument, rgb } from '@pdfme/pdf-lib';
import * as fontkit from 'fontkit';
import * as fs from 'fs';
import QRCode from 'qrcode';
import {
  FieldType,
  formatUtcDate,
  trUpper,
  type DateFormat,
} from '@/shared';
import { fieldBoxInPdf, textBaselinesInBox } from './coordinates';
import { resolveFontFile } from './fonts';
import { getTemplatePageDimensions } from '../templates/pdf-utils';

export interface TemplateFieldInput {
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
  dateFormat?: string | null;
  staticText?: string | null;
  uppercase?: boolean;
}

export interface CertificateContext {
  firstName: string;
  lastName: string;
  studentNo: string;
  certificateNo: string;
  courseName: string;
  certificateDate: Date;
  courseStart: Date;
  courseEnd: Date;
  verificationCode: string;
  verificationUrl: string;
  signatureImageBytes?: Buffer | null;
}

async function embedRasterImage(
  doc: PDFDocument,
  bytes: Buffer,
): Promise<Awaited<ReturnType<PDFDocument['embedPng']>>> {
  const u8 = new Uint8Array(bytes);
  const isPng = bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50;
  if (isPng) return doc.embedPng(u8);
  return doc.embedJpg(u8);
}

const fontCache = new Map<string, Buffer>();
function parseColor(hex: string) {
  const h = hex.replace('#', '');
  return rgb(
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  );
}

export function loadFontBytes(fontKey: string): Buffer {
  const cached = fontCache.get(fontKey);
  if (cached) return cached;
  const bytes = fs.readFileSync(resolveFontFile(fontKey));
  fontCache.set(fontKey, bytes);
  return bytes;
}

function fieldText(field: TemplateFieldInput, ctx: CertificateContext): string {
  const type = field.fieldType as FieldType;
  let text = '';
  switch (type) {
    case 'FULL_NAME':
      text = `${ctx.firstName} ${ctx.lastName}`;
      break;
    case 'FIRST_NAME':
      text = ctx.firstName;
      break;
    case 'LAST_NAME':
      text = ctx.lastName;
      break;
    case 'STUDENT_NO':
      text = ctx.studentNo;
      break;
    case 'CERTIFICATE_NO':
      text = ctx.certificateNo;
      break;
    case 'COURSE_NAME':
      text = ctx.courseName;
      break;
    case 'CERTIFICATE_DATE':
      text = formatUtcDate(ctx.certificateDate, (field.dateFormat as DateFormat) ?? 'DD.MM.YYYY');
      break;
    case 'COURSE_START':
      text = formatUtcDate(ctx.courseStart, (field.dateFormat as DateFormat) ?? 'DD.MM.YYYY');
      break;
    case 'COURSE_END':
      text = formatUtcDate(ctx.courseEnd, (field.dateFormat as DateFormat) ?? 'DD.MM.YYYY');
      break;
    case 'VERIFICATION_CODE':
      text = ctx.verificationCode;
      break;
    case 'STATIC_TEXT':
      text = field.staticText ?? '';
      break;
    default:
      text = '';
  }
  if (field.uppercase && text) text = trUpper(text);
  return text;
}

function fitText(
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  text: string,
  maxWidth: number,
  maxHeight: number,
  startSize: number,
  minSize: number,
): { lines: string[]; size: number } {
  let size = startSize;
  while (size >= minSize) {
    const lines = wrapLines(font, text, maxWidth, size);
    const lineHeight = size * 1.2;
    if (lines.length * lineHeight <= maxHeight) {
      return { lines, size };
    }
    size -= 0.5;
  }
  const lines = wrapLines(font, text, maxWidth, minSize);
  if (lines.length > 2 && text.includes(' ')) {
    const mid = Math.floor(text.length / 2);
    const splitAt = text.indexOf(' ', mid);
    if (splitAt > 0) {
      return {
        lines: [text.slice(0, splitAt), text.slice(splitAt + 1)],
        size: minSize,
      };
    }
  }
  return { lines, size: minSize };
}

function wrapLines(
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  text: string,
  maxWidth: number,
  size: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

export async function renderCertificatePdf(
  templateBytes: Buffer,
  fields: TemplateFieldInput[],
  _pageWidth: number,
  _pageHeight: number,
  ctx: CertificateContext,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(templateBytes);
  doc.registerFontkit(fontkit);
  const page = doc.getPage(0);
  const { pageWidth, pageHeight } = getTemplatePageDimensions(page);
  const fonts = new Map<string, Awaited<ReturnType<PDFDocument['embedFont']>>>();

  for (const field of fields) {
    if (field.fieldType === 'QR_CODE') {
      const box = fieldBoxInPdf(field, pageWidth, pageHeight);
      const png = await QRCode.toBuffer(ctx.verificationUrl, { type: 'png', margin: 0 });
      const img = await doc.embedPng(new Uint8Array(png));
      page.drawImage(img, {
        x: box.left,
        y: box.bottom,
        width: box.width,
        height: box.height,
      });
      continue;
    }
    if (field.fieldType === 'SIGNATURE') {
      if (!ctx.signatureImageBytes?.length) continue;
      const box = fieldBoxInPdf(field, pageWidth, pageHeight);
      const img = await embedRasterImage(doc, ctx.signatureImageBytes);
      page.drawImage(img, {
        x: box.left,
        y: box.bottom,
        width: box.width,
        height: box.height,
      });
      continue;
    }
    const box = fieldBoxInPdf(field, pageWidth, pageHeight);
    const text = fieldText(field, ctx);
    if (!text) continue;
    if (!fonts.has(field.fontKey)) {
      const bytes = loadFontBytes(field.fontKey);
      fonts.set(field.fontKey, await doc.embedFont(bytes, { subset: true }));
    }
    const font = fonts.get(field.fontKey)!;
    const minPt = Math.min(field.minFontSize, field.fontSize);
    const { lines, size } = fitText(
      font,
      text,
      box.width,
      box.height,
      field.fontSize,
      minPt,
    );
    const baselines = textBaselinesInBox(
      box.bottom,
      box.height,
      lines.length,
      size,
      1.2,
      field.fontKey,
    );
    lines.forEach((line, lineIndex) => {
      const textWidth = font.widthOfTextAtSize(line, size);
      let x = box.left;
      if (field.align === 'center') x = box.left + (box.width - textWidth) / 2;
      if (field.align === 'right') x = box.left + box.width - textWidth;
      page.drawText(line, {
        x,
        y: baselines[lineIndex],
        size,
        font,
        color: parseColor(field.color),
      });
    });
  }
  return doc.save();
}
