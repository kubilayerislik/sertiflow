import { z } from 'zod';
import {
  DATE_FORMATS,
  FIELD_TYPES,
  SHORT_NAME_MAX_LENGTH,
  SHORT_NAME_REGEX,
  TEXT_ALIGNS,
} from './constants';
import { emailSchema } from './validation/email';

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Parola gereklidir'),
});

export const userRoleSchema = z.enum(['ADMIN', 'USER']);

export const createUserSchema = z.object({
  email: emailSchema,
  fullName: z.string().min(2, 'Ad soyad en az 2 karakter olmalı').max(200),
  role: userRoleSchema.default('USER'),
  password: z.string().min(10, 'Parola en az 10 karakter olmalı').optional(),
});

export const createUserSchemaDev = createUserSchema.extend({
  password: z.string().min(10, 'Parola en az 10 karakter olmalı'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mevcut parola gereklidir'),
  newPassword: z.string().min(10, 'Yeni parola en az 10 karakter olmalı'),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2, 'Ad soyad en az 2 karakter olmalı').max(200).optional(),
  isActive: z.boolean().optional(),
  role: userRoleSchema.optional(),
});

const courseBaseSchema = z.object({
  name: z.string().min(2, 'Kurs adı en az 2 karakter olmalı').max(300),
  shortName: z
    .string()
    .transform((s) => s.trim().toUpperCase())
    .pipe(
      z
        .string()
        .min(2, 'Kısa ad en az 2 karakter olmalı')
        .max(SHORT_NAME_MAX_LENGTH, `Kısa ad en fazla ${SHORT_NAME_MAX_LENGTH} karakter olabilir`)
        .regex(
          SHORT_NAME_REGEX,
          'Kısa ad büyük harf, rakam ve tire içerebilir (ör. ISG-2627)',
        ),
    ),
  description: z.string().max(2000).optional(),
  startDate: z.coerce.date({ invalid_type_error: 'Geçerli bir başlangıç tarihi girin' }),
  endDate: z.coerce.date({ invalid_type_error: 'Geçerli bir bitiş tarihi girin' }),
  mailSubject: z.string().max(500).optional(),
  mailBody: z.string().max(10000).optional(),
});

export const createCourseSchema = courseBaseSchema.refine((d) => d.endDate >= d.startDate, {
  message: 'Bitiş tarihi başlangıçtan önce olamaz',
  path: ['endDate'],
});

export const updateCourseSchema = courseBaseSchema.partial();

export const studentSchema = z.object({
  firstName: z.string().min(1, 'Ad gereklidir').max(100),
  lastName: z.string().min(1, 'Soyad gereklidir').max(100),
  studentNo: z.string().min(1, 'Öğrenci no gereklidir').max(50),
  email: emailSchema,
  certificateDate: z.coerce.date({
    invalid_type_error: 'Geçerli bir sertifika tarihi girin',
  }),
});

export const templateFieldSchema = z.object({
  fieldType: z.enum(FIELD_TYPES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: 'Geçersiz alan tipi' }),
  }),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
  fontKey: z
    .string()
    .regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,49}$/, 'Yazı tipi bulunamadı'),
  fontSize: z.number().min(6, 'Punto en az 6 olmalı').max(120),
  minFontSize: z.number().min(4, 'Min punto en az 4 olmalı').max(120),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Renk #RRGGBB biçiminde olmalı'),
  align: z.enum(TEXT_ALIGNS as unknown as [string, ...string[]], {
    errorMap: () => ({ message: 'Geçersiz hizalama' }),
  }),
  dateFormat: z.enum(DATE_FORMATS as unknown as [string, ...string[]]).optional(),
  staticText: z.string().max(500).optional(),
  uppercase: z.boolean().optional(),
});

export const templateFieldsSchema = z.object({
  fields: z.array(templateFieldSchema),
});

export const copyTemplateSchema = z.object({
  sourceCourseId: z.string().min(1, 'Kaynak kurs seçin'),
});

export const importConfirmSchema = z.object({
  certificateDate: z.coerce.date({
    invalid_type_error: 'Geçerli bir sertifika tarihi girin',
  }),
  rows: z.array(
    z.object({
      firstName: z.string(),
      lastName: z.string(),
      studentNo: z.string(),
      email: emailSchema,
    }),
  ),
});

export const mailBatchSchema = z.object({
  enrollmentIds: z.array(z.string()).optional(),
  skipAlreadySent: z.boolean().optional(),
});
