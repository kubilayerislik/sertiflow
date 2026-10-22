'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { getApiErrorMessage } from '../../api/errors';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusLabel: Record<string, string> = {
  QUEUED: 'Kuyrukta',
  SENDING: 'Gönderiliyor',
  SENT: 'Gönderildi',
  FAILED: 'Hata',
};

export function MailHistoryTab({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string | undefined>();
  const { data, isLoading } = useQuery({
    queryKey: ['mail-logs', courseId, status],
    queryFn: () =>
      api<Array<Record<string, unknown>>>(
        `/api/courses/${courseId}/mail-logs${status ? `?status=${status}` : ''}`,
      ),
  });

  const batchIds = [...new Set((data ?? []).map((r) => r.mailBatchId).filter(Boolean))] as string[];

  const retry = useMutation({
    mutationFn: (batchId: string) =>
      api(`/api/mail-batches/${batchId}/retry-failed`, { method: 'POST' }),
    onSuccess: () => {
      toast.success('Başarısız gönderimler yeniden kuyruğa alındı');
      qc.invalidateQueries({ queryKey: ['mail-logs', courseId] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Select
          value={status ?? ''}
          onValueChange={(v) => setStatus(v || undefined)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Durum filtresi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tümü</SelectItem>
            {Object.entries(statusLabel).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {batchIds.slice(0, 3).map((id) => (
          <Button
            key={id}
            type="button"
            size="sm"
            variant="outline"
            disabled={retry.isPending}
            onClick={() => retry.mutate(id)}
          >
            Başarısızları yeniden gönder
          </Button>
        ))}
      </div>
      <DataTable
        loading={isLoading}
        dataSource={(data ?? []) as Record<string, unknown>[]}
        pagination={false}
        columns={[
          {
            title: 'Öğrenci',
            render: (_, row) => {
              const e = row.enrollment as { firstName?: string; lastName?: string; studentNo?: string };
              return e
                ? `${e.firstName ?? ''} ${e.lastName ?? ''} (${e.studentNo ?? ''})`
                : '—';
            },
          },
          { title: 'Alıcı', dataIndex: 'toEmail' },
          {
            title: 'Durum',
            dataIndex: 'status',
            render: (s) => {
              const status = s as string;
              if (status === 'SENT') {
                return <Badge className="bg-green-600 hover:bg-green-600">{statusLabel[status]}</Badge>;
              }
              if (status === 'FAILED') {
                return <Badge variant="destructive">{statusLabel[status]}</Badge>;
              }
              return <Badge variant="secondary">{statusLabel[status] ?? status}</Badge>;
            },
          },
          { title: 'Hata', dataIndex: 'errorMessage' },
          {
            title: 'Tarih',
            dataIndex: 'queuedAt',
            render: (v) => new Date(v as string).toLocaleString('tr-TR'),
          },
        ]}
      />
    </div>
  );
}
