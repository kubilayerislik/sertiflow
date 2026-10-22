import { z } from 'zod';

function emptyOptional<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), schema);
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL gerekli'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET en az 32 karakter olmalı'),
  PUBLIC_BASE_URL: emptyOptional(z.string().url().optional()),
  TRUST_PROXY: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  MAIL_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  SMTP_REQUIRE_TLS: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  SMTP_USER: emptyOptional(z.string().optional()),
  SMTP_PASS: emptyOptional(z.string().optional()),
  MAIL_FROM: emptyOptional(z.string().email().optional()),
  MAIL_FROM_NAME: emptyOptional(z.string().optional()),
  MAIL_REPLY_TO: emptyOptional(z.string().email().optional()),
  MAIL_RATE_PER_MINUTE: z.coerce.number().int().positive().default(20),
  STORAGE_DIR: z.string().optional(),
  ADMIN_EMAIL: emptyOptional(z.string().email().optional()),
  ADMIN_PASSWORD: emptyOptional(z.string().min(10).optional()),
  BRAND_TAGLINE: emptyOptional(z.string().max(120).optional()),
  SAML_SP_ENTITY_ID: emptyOptional(z.string().min(1).optional()),
  SAML_IDP_ENTITY_ID: emptyOptional(z.string().min(1).optional()),
  SAML_IDP_SSO_URL: emptyOptional(z.string().url().optional()),
  SAML_IDP_CERT: emptyOptional(z.string().min(1).optional()),
  SAML_EMAIL_ATTRIBUTE: emptyOptional(z.string().min(1).optional()),
  IMPORT_MAX_ROWS: z.coerce.number().int().positive().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new Error(`Ortam değişkeni hatası: ${msg}`);
    }
    cached = parsed.data;
    if (cached.NODE_ENV === 'production' && !cached.PUBLIC_BASE_URL) {
      throw new Error('PUBLIC_BASE_URL üretim ortamında zorunludur');
    }
    if (cached.MAIL_ENABLED && !cached.SMTP_HOST) {
      throw new Error('MAIL_ENABLED=true için SMTP_HOST gerekli');
    }
    if (cached.NODE_ENV === 'production') {
      const missing = [
        ['SAML_SP_ENTITY_ID', cached.SAML_SP_ENTITY_ID],
        ['SAML_IDP_ENTITY_ID', cached.SAML_IDP_ENTITY_ID],
        ['SAML_IDP_SSO_URL', cached.SAML_IDP_SSO_URL],
        ['SAML_IDP_CERT', cached.SAML_IDP_CERT],
      ]
        .filter(([, v]) => !v)
        .map(([k]) => k);
      if (missing.length) {
        throw new Error(`Üretim ortamında SAML zorunlu: ${missing.join(', ')}`);
      }
    }
  }
  return cached;
}

export function resetEnvCache() {
  cached = null;
}
