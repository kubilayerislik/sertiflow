'use client';

import { use } from 'react';
import { CourseDetailShell } from '@/components/CourseDetailShell';
import { CourseMailTab } from '@/features/course/CourseMailTab';

export default function KursEpostaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <CourseDetailShell courseId={id}>
      <CourseMailTab courseId={id} />
    </CourseDetailShell>
  );
}
