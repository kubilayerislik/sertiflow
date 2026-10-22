'use client';

import { use } from 'react';
import { CourseDetailShell } from '@/components/CourseDetailShell';
import { StudentsTab } from '@/features/course/StudentsTab';

export default function KursDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <CourseDetailShell courseId={id}>
      <StudentsTab courseId={id} />
    </CourseDetailShell>
  );
}
