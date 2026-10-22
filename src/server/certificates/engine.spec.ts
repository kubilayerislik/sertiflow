import { formatCertificateNo, maskName, trUpper } from '@/shared';

describe('certificate helpers', () => {
  it('formats certificate numbers', () => {
    expect(formatCertificateNo('PYT', 1)).toBe('PYT-0001');
    expect(formatCertificateNo('PYT', 10000)).toBe('PYT-10000');
  });

  it('masks names', () => {
    expect(maskName('İsim Kişi Soyad')).toBe('İ*** K*** S***');
  });

  it('uppercases Turkish', () => {
    expect(trUpper('ışığı')).toBe('IŞIĞI');
  });
});
