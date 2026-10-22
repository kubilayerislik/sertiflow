import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { StudentListPage } from '@/views/StudentListPage';

export default async function OgrencilerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = (q ?? '').trim();
  if (term.length < 2) {
    redirect('/kurslar');
  }

  return (
    <Suspense fallback={null}>
      <StudentListPage />
    </Suspense>
  );
}
