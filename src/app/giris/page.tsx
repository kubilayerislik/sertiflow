import { Suspense } from 'react';
import { LoginPage } from '@/views/LoginPage';

export default function GirisPage() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
