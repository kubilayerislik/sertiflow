'use client';

import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function HeaderStudentSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qFromUrl = pathname === '/ogrenciler' ? (searchParams.get('q') ?? '') : '';
  const [value, setValue] = useState(qFromUrl);

  useEffect(() => {
    setValue(qFromUrl);
  }, [qFromUrl]);

  const submit = (raw?: string) => {
    const q = (raw ?? value).trim();
    if (q.length < 2) {
      if (pathname === '/ogrenciler') {
        router.replace('/kurslar');
      }
      return;
    }
    router.push(`/ogrenciler?q=${encodeURIComponent(q)}`);
  };

  return (
    <form
      className="mx-auto flex w-full max-w-xl flex-1 px-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="relative w-full">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/50"
          aria-hidden
        />
        <Input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Öğrenci ara (ad, no, e-posta)"
          className={cn(
            'h-10 w-full border-white/15 bg-white/10 pr-4 pl-10 text-white placeholder:text-white/50',
            'focus-visible:border-white/30 focus-visible:ring-white/20',
          )}
          aria-label="Öğrenci ara"
        />
      </div>
    </form>
  );
}
