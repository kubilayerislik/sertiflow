'use client';

import Link from 'next/link';
import { BrandLogo } from './BrandLogo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const YELLOW = '#f3c500';

const PRESETS = {
  notFound: {
    code: '404',
    title: 'Sayfa bulunamadı',
    description:
      'Aradığınız adres yanlış olabilir veya sayfa kaldırılmış olabilir.',
  },
  error: {
    code: 'Hata',
    title: 'Bir şeyler ters gitti',
    description:
      'İşleminiz tamamlanamadı. Bir süre sonra tekrar deneyebilir veya kurslar listesine dönebilirsiniz.',
  },
  forbidden: {
    code: '403',
    title: 'Erişim reddedildi',
    description: 'Bu içeriği görüntüleme yetkiniz bulunmuyor.',
  },
} as const;

export type StatusPagePreset = keyof typeof PRESETS;

type StatusPageProps = {
  preset?: StatusPagePreset;
  code?: string;
  title?: string;
  description?: string;
  fullPage?: boolean;
  onRetry?: () => void;
};

export function StatusPage({
  preset = 'notFound',
  code,
  title,
  description,
  fullPage = true,
  onRetry,
}: StatusPageProps) {
  const base = PRESETS[preset];
  const displayCode = code ?? base.code;
  const displayTitle = title ?? base.title;
  const displayDescription = description ?? base.description;

  const card = (
    <div
      className={cn(
        'w-full max-w-md overflow-hidden rounded-[10px] bg-card text-card-foreground shadow-[0_12px_32px_rgba(0,0,0,0.08)]',
        fullPage && 'max-w-[440px]',
      )}
      style={{ borderTop: `6px solid ${YELLOW}` }}
    >
      <div className="px-7 py-10 text-center sm:px-8 sm:py-11">
        {fullPage ? (
          <div className="mb-8 flex justify-center">
            <BrandLogo variant="dark" height={48} linkToHome={false} />
          </div>
        ) : null}

        <p
          className="text-5xl font-bold tracking-tight text-[var(--app-header)] tabular-nums sm:text-6xl"
          aria-hidden
        >
          {displayCode}
        </p>
        <h1 className="mt-3 text-xl font-bold text-foreground sm:text-2xl">{displayTitle}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{displayDescription}</p>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            render={<Link href="/kurslar" />}
            className="w-full bg-[var(--app-header)] text-white hover:bg-[var(--app-header)]/90 sm:w-auto"
          >
            Kurslara dön
          </Button>
          {onRetry ? (
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onRetry}>
              Tekrar dene
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (!fullPage) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">{card}</div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">{card}</main>
    </div>
  );
}
