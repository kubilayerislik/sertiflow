import { PDFDocument, type PDFPage } from '@pdfme/pdf-lib';
import { badRequest } from '../http/errors';

const MAX_BYTES = 2 * 1024 * 1024;

export function getTemplatePageDimensions(page: PDFPage): {
  pageWidth: number;
  pageHeight: number;
} {
  const { width, height } = page.getSize();
  const rotation = page.getRotation().angle;
  if (rotation === 90 || rotation === 270) {
    return { pageWidth: height, pageHeight: width };
  }
  return { pageWidth: width, pageHeight: height };
}

export async function validateTemplatePdf(buffer: Buffer): Promise<{
  pageWidth: number;
  pageHeight: number;
}> {
  if (buffer.length > MAX_BYTES) {
    throw badRequest('Şablon en fazla 2 MB olabilir');
  }
  if (!buffer.subarray(0, 4).equals(Buffer.from('%PDF'))) {
    throw badRequest('Geçersiz PDF dosyası');
  }
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  } catch {
    throw badRequest('Şifreli veya bozuk PDF');
  }
  if (doc.getPageCount() !== 1) {
    throw badRequest('Şablon tek sayfalık olmalıdır');
  }
  const page = doc.getPage(0);
  return getTemplatePageDimensions(page);
}
