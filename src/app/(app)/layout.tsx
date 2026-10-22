'use client';

import { AppLayout } from '@/components/AppLayout';

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
