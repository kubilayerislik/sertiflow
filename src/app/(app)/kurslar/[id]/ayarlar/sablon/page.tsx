'use client';

import { use } from 'react';
import { CourseDetailShell } from '@/components/CourseDetailShell';
import { TemplateTab } from '@/features/template-editor/TemplateTab';

export default function KursSablonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <CourseDetailShell courseId={id}>
      <TemplateTab courseId={id} />
    </CourseDetailShell>
  );
}
