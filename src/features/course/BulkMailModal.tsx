'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { getApiErrorMessage } from '../../api/errors';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

export function BulkMailModal({
  courseId,
  enrollmentIds,
  open,
  onClose,
}: {
  courseId: string;
  enrollmentIds?: string[];
  open: boolean;
  onClose: () => void;
}) {
  const [skipAlreadySent, setSkipAlreadySent] = useState(true);
  const [batchId, setBatchId] = useState<string | null>(null);

  const start = useMutation({
    mutationFn: () =>
      api<{ id: string }>(`/api/courses/${courseId}/mail-batches`, {
        method: 'POST',
        json: {
          enrollmentIds: enrollmentIds?.length ? enrollmentIds : undefined,
          skipAlreadySent,
        },
      }),
    onSuccess: (res) => {
      setBatchId(res.id);
      toast.success('Toplu gönderim başlatıldı');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const { data: progress } = useQuery({
    queryKey: ['mail-batch', batchId],
    queryFn: () =>
      api<{ total: number; sentCount: number; failedCount: number; remaining: number; status: string }>(
        `/api/mail-batches/${batchId}`,
      ),
    enabled: Boolean(batchId),
    refetchInterval: batchId ? 3000 : false,
  });

  useEffect(() => {
    if (!open) {
      setBatchId(null);
      setSkipAlreadySent(true);
    }
  }, [open]);

  const done =
    progress &&
    progress.remaining === 0 &&
    progress.status !== 'PENDING' &&
    progress.status !== 'RUNNING';

  const pct =
    progress && progress.total > 0
      ? Math.round(((progress.sentCount + progress.failedCount) / progress.total) * 100)
      : 0;

  const handleOk = () => {
    if (batchId && done) onClose();
    else if (!batchId) start.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Toplu e-posta gönderimi</DialogTitle>
        </DialogHeader>
        {!batchId ? (
          <>
            <p className="text-sm">
              {enrollmentIds?.length
                ? `${enrollmentIds.length} seçili öğrenciye gönderilecek.`
                : 'Kurstaki tüm aktif öğrencilere gönderilecek.'}
            </p>
            <div className="flex items-center gap-2">
              <Checkbox
                id="skip-sent"
                checked={skipAlreadySent}
                onCheckedChange={(c) => setSkipAlreadySent(c === true)}
              />
              <Label htmlFor="skip-sent">Daha önce başarıyla gönderilenleri atla</Label>
            </div>
          </>
        ) : (
          <>
            <Progress value={pct} />
            <p className="text-sm">
              Gönderilen: {progress?.sentCount ?? 0} · Hatalı: {progress?.failedCount ?? 0} · Kalan:{' '}
              {progress?.remaining ?? 0}
            </p>
          </>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={Boolean(batchId) && !done}
            onClick={onClose}
          >
            İptal
          </Button>
          <Button
            type="button"
            disabled={start.isPending || (Boolean(batchId) && !done)}
            onClick={handleOk}
          >
            {batchId ? (done ? 'Kapat' : 'Gönderiliyor…') : 'Başlat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
