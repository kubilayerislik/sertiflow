'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { DataTable } from '@/components/DataTable';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const statusLabel: Record<string, string> = {
  QUEUED: 'Kuyrukta',
  SENDING: 'Gönderiliyor',
  SENT: 'Gönderildi',
  FAILED: 'Hata',
};

export function StudentMailDrawer({
  enrollmentId,
  studentName,
  open,
  onClose,
}: {
  enrollmentId: string | null;
  studentName: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['student-mail-logs', enrollmentId],
    queryFn: () => api<Array<Record<string, unknown>>>(`/api/students/${enrollmentId}/mail-logs`),
    enabled: Boolean(enrollmentId) && open,
  });

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Mail geçmişi — {studentName}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <DataTable
            loading={isLoading}
            dataSource={(data ?? []) as Record<string, unknown>[]}
            pagination={false}
            columns={[
              {
                title: 'Tarih',
                dataIndex: 'queuedAt',
                render: (v) => new Date(v as string).toLocaleString('tr-TR'),
              },
              { title: 'Alıcı', dataIndex: 'toEmail' },
              {
                title: 'Durum',
                dataIndex: 'status',
                render: (s) => statusLabel[s as string] ?? (s as string),
              },
              { title: 'Hata', dataIndex: 'errorMessage' },
            ]}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
