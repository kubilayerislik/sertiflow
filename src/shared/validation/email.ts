import { z } from 'zod';

export const EMAIL_INVALID_FORMAT =
  'Geçerli bir e-posta adresi girin (ör. ogrenci@kurum.com).';

export const EMAIL_ASCII_ONLY =
  'E-posta adresinde Türkçe veya özel karakter kullanılamaz. Yalnızca Latin harfleri, rakam ve @ . - _ kullanın (ör. ogrenci@kurum.com).';

const ASCII_ONLY = /^[\x00-\x7F]*$/;

export function isAsciiEmail(value: string): boolean {
  if (!value || !value.includes('@')) return false;
  if (!ASCII_ONLY.test(value)) return false;
  return z.string().email().safeParse(value).success;
}

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'E-posta gereklidir')
  .superRefine((v, ctx) => {
    if (!ASCII_ONLY.test(v)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: EMAIL_ASCII_ONLY });
      return;
    }
    const parsed = z.string().email(EMAIL_INVALID_FORMAT).safeParse(v);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue(issue);
      }
    }
  });
