'use client';

import { useEffect } from 'react';
import { StatusPage } from '@/components/StatusPage';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <StatusPage preset="error" fullPage={false} onRetry={reset} />;
}
