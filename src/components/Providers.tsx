'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import { useState } from 'react';
import { AuthProvider } from '@/auth/AuthContext';
import { BrandTaglineProvider } from '@/components/brand-tagline';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

dayjs.locale('tr');

export function Providers({
  children,
  brandTagline,
}: {
  children: React.ReactNode;
  brandTagline: string;
}) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <BrandTaglineProvider value={brandTagline}>
        <TooltipProvider>
          <AuthProvider>{children}</AuthProvider>
          <Toaster richColors position="top-center" />
        </TooltipProvider>
      </BrandTaglineProvider>
    </QueryClientProvider>
  );
}
