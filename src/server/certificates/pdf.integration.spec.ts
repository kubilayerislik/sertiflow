import { PDFDocument } from '@pdfme/pdf-lib';
import { describe, expect, it } from 'vitest';
import { renderCertificatePdf } from './engine';

describe('renderCertificatePdf', () => {
  it('draws a name and a QR code onto a blank template', async () => {
    const blank = await PDFDocument.create();
    blank.addPage([595, 842]);
    const template = Buffer.from(await blank.save());

    const pdf = await renderCertificatePdf(
      template,
      [
        {
          fieldType: 'FULL_NAME',
          x: 0.1,
          y: 0.2,
          width: 0.8,
          height: 0.08,
          fontKey: 'NotoSans-Regular',
          fontSize: 18,
          minFontSize: 10,
          color: '#111111',
          align: 'center',
        },
        {
          fieldType: 'QR_CODE',
          x: 0.4,
          y: 0.7,
          width: 0.2,
          height: 0.15,
          fontKey: 'NotoSans-Regular',
          fontSize: 12,
          minFontSize: 8,
          color: '#000000',
          align: 'center',
        },
      ],
      595,
      842,
      {
        firstName: 'İsim',
        lastName: 'Soyisim',
        studentNo: '20240001',
        certificateNo: 'TEST-0001',
        courseName: 'Örnek kurs',
        certificateDate: new Date('2026-06-01T00:00:00Z'),
        courseStart: new Date('2026-05-01T00:00:00Z'),
        courseEnd: new Date('2026-06-01T00:00:00Z'),
        verificationCode: 'K7M2QX9P4TRA',
        verificationUrl: 'http://localhost:3000/dogrula/K7M2QX9P4TRA',
      },
    );

    expect(Buffer.from(pdf).subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.byteLength).toBeGreaterThan(template.length);
  });
});
