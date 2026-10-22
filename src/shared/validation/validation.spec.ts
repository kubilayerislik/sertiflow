import { describe, expect, it } from 'vitest';
import { EMAIL_ASCII_ONLY, emailSchema, isAsciiEmail } from './email';
import { formatZodFlatten } from './zod-errors';
import { studentSchema } from '../schemas';

describe('emailSchema', () => {
  it('accepts ASCII email', () => {
    expect(emailSchema.safeParse('ogrenci@kurum.com').success).toBe(true);
    expect(isAsciiEmail('test@ok.com')).toBe(true);
  });

  it('rejects Turkish characters with Turkish message', () => {
    const r = emailSchema.safeParse('öğrenci@test.com');
    expect(r.success).toBe(false);
    if (!r.success) {
      const flat = r.error.flatten();
      const msg = flat.formErrors[0] ?? Object.values(flat.fieldErrors).flat()[0];
      expect(msg).toContain('Türkçe');
    }
    expect(isAsciiEmail('aliışık@kurum.com')).toBe(false);
  });

  it('rejects invalid format', () => {
    const r = emailSchema.safeParse('not-an-email');
    expect(r.success).toBe(false);
    expect(EMAIL_ASCII_ONLY.length).toBeGreaterThan(10);
  });
});

describe('formatZodFlatten', () => {
  it('labels email field in student schema errors', () => {
    const r = studentSchema.safeParse({
      firstName: '',
      lastName: 'Y',
      studentNo: '1',
      email: 'bad',
      certificateDate: '2026-01-01',
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const text = formatZodFlatten(r.error.flatten());
      expect(text).toMatch(/E-posta|Ad gereklidir/);
    }
  });
});
