'use client';

import { use } from 'react';
import { CourseDetailShell } from '@/components/CourseDetailShell';
import { CourseSettingsTab } from '@/features/course/CourseSettingsTab';

export default function KursAyarlarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <CourseDetailShell courseId={id}>
      <CourseSettingsTab courseId={id} />
    </CourseDetailShell>
  );
}
