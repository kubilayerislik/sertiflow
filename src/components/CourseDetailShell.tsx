'use client';

import { ArrowLeft, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CourseDetailShell({
  courseId,
  children,
}: {
  courseId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const base = `/kurslar/${courseId}`;
  const inSettings = pathname.includes('/ayarlar');
  const settingsSub =
    pathname.endsWith('/sablon')
      ? 'Şablon'
      : pathname.endsWith('/eposta')
        ? 'E-posta'
        : pathname.endsWith('/mail')
          ? 'E-posta geçmişi'
          : inSettings
            ? 'Ayarlar'
            : null;

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => api<Record<string, unknown>>(`/api/courses/${courseId}`),
  });

  const courseTitle = (course?.name as string) ?? '…';
  const isTemplate = pathname.includes('/sablon');

  return (
    <div className={cn('w-full max-w-full', isTemplate && 'overflow-hidden')}>
      {settingsSub ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <Link
            href={base}
            className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-sm hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
            {courseTitle}
          </Link>
          <span className="text-muted-foreground">/</span>
          {settingsSub === 'Ayarlar' ? (
            <span className="font-medium">Ayarlar</span>
          ) : (
            <>
              <Link href={`${base}/ayarlar`} className="text-primary hover:underline">Ayarlar</Link>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{settingsSub}</span>
            </>
          )}
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-2">
          <h1 className="m-0 text-2xl font-semibold">{courseTitle}</h1>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Kurs ayarları"
            onClick={() => router.push(`${base}/ayarlar`)}
          >
            <Settings className="size-4" />
          </Button>
        </div>
      )}
      {children}
    </div>
  );
}
