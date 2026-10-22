'use client';

import { use } from 'react';
import { CourseDetailShell } from '@/components/CourseDetailShell';
import { MailHistoryTab } from '@/features/course/MailHistoryTab';

export default function KursMailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <CourseDetailShell courseId={id}>
      <MailHistoryTab courseId={id} />
    </CourseDetailShell>
  );
}
