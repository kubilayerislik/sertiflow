# Sertiflow — Sertifika Yönetim Sistemi

Next.js tam yığın uygulama (UI, API, Prisma).

## Geliştirme

```bash
docker compose up -d postgres
npm install
cp .env.example .env
# .env içinde POSTGRES_PASSWORD, SESSION_SECRET (≥32 karakter) ve gerekirse ADMIN_PASSWORD ayarlayın
npm run db:deploy
npm run dev
```

Tarayıcı: **http://localhost:3000**

İlk yönetici: `ADMIN_EMAIL` / `ADMIN_PASSWORD` ortam değişkenleriyle (kullanıcı tablosu boşsa oluşturulur).

Mail kurumsal SMTP ile gider. `MAIL_ENABLED=true` iken `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` ve `SMTP_PASS` dolu olmalı.

## Üretim (Docker)

```bash
# .env içinde POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB,
# SESSION_SECRET (≥32 karakter), PUBLIC_BASE_URL ve SAML değişkenleri
docker compose up -d postgres
docker compose up -d --build app
```

Kalıcı şablonlar `template_storage` volume üzerinde tutulur.

## Test

```bash
npm test
npm run lint
```

## Ortam değişkenleri

Tam liste: [.env.example](.env.example).
