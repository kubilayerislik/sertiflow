import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import { generateImportSample } from './import';

describe('generateImportSample', () => {
  it('writes a workbook the importer can read', () => {
    const buffer = generateImportSample();
    const book = XLSX.read(buffer, { type: 'buffer' });
    const sheet = book.Sheets[book.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
    });

    expect(rows[0]).toEqual(['Ad', 'Soyad', 'Öğrenci No', 'E-posta']);
    expect(rows[1]).toEqual(['İsim', 'Soyisim', '20240001', 'kisi@ornek.com']);
  });
});
