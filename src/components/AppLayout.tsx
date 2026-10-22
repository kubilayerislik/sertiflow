'use client';

import { LogOut, User, Users } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../auth/AuthContext';
import { BrandLogo } from './BrandLogo';
import { HeaderStudentSearch } from './HeaderStudentSearch';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const wideContent = pathname.includes('/sablon');
  if (loading || !user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="flex h-16 min-h-16 items-center gap-4 px-6 text-white shadow-sm"
        style={{ backgroundColor: 'var(--app-header)' }}
      >
        <BrandLogo variant="light" height={42} />
        <nav className="ml-2 hidden shrink-0 items-center sm:flex">
          <Link
            href="/kurslar"
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white',
              pathname === '/kurslar' || pathname.startsWith('/kurslar/')
                ? 'bg-white/15 text-white'
                : '',
            )}
          >
            Kurslar
          </Link>
        </nav>
        <Suspense fallback={<div className="hidden min-w-0 flex-1 md:block" />}>
          <HeaderStudentSearch />
        </Suspense>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="text-white hover:bg-white/10 hover:text-white"
                aria-label="Hesap menüsü"
              />
            }
          >
            <User className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>{user?.fullName ?? 'Hesap'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profil')}>
              <User className="size-4" />
              Profil
            </DropdownMenuItem>
            {user?.role === 'ADMIN' ? (
              <DropdownMenuItem onClick={() => router.push('/kullanicilar')}>
                <Users className="size-4" />
                Kullanıcılar
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={async () => {
                await logout();
                router.push('/giris');
              }}
            >
              <LogOut className="size-4" />
              Çıkış
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main
        className={cn(
          'w-full flex-1 box-border',
          wideContent ? 'overflow-x-hidden px-5 py-4' : 'mx-auto max-w-[1200px] p-6',
        )}
      >
        {children}
      </main>
    </div>
  );
}
