'use client';

import { useEffect } from 'react';
import { StatusPage } from '@/components/StatusPage';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <StatusPage preset="error" onRetry={reset} />;
}
