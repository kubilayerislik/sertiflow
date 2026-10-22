'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { errorFromResponse, getApiErrorMessage } from '../../api/errors';
import { DataTable } from '@/components/DataTable';
import { DatePicker } from '@/components/DatePicker';
import { FilePicker } from '@/components/FilePicker';
import { Steps } from '@/components/Steps';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PreviewRow extends Record<string, unknown> {
  rowNumber: number;
  firstName: string;
  lastName: string;
  studentNo: string;
  email: string;
  status: string;
  reason?: string;
}

export function ExcelImportModal({
  courseId,
  open,
  onClose,
}: {
  courseId: string;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [certDate, setCertDate] = useState(dayjs());
  const [preview, setPreview] = useState<{ rows: PreviewRow[]; certificateDate: string } | null>(
    null,
  );

  const confirm = useMutation({
    mutationFn: () => {
      const rows = preview!.rows
        .filter((r) => r.status === 'OK')
        .map((r) => ({
          firstName: r.firstName,
          lastName: r.lastName,
          studentNo: r.studentNo,
          email: r.email,
        }));
      return api(`/api/courses/${courseId}/import/confirm`, {
        method: 'POST',
        json: { certificateDate: preview!.certificateDate, rows, fileName: file?.name },
      });
    },
    onSuccess: (res) => {
      toast.success(`${(res as { inserted: number }).inserted} öğrenci eklendi`);
      qc.invalidateQueries({ queryKey: ['students', courseId] });
      onClose();
      setStep(0);
      setPreview(null);
      setFile(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const runPreview = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('certificateDate', certDate.toISOString());
    const res = await fetch(`/api/courses/${courseId}/import/preview`, {
      method: 'POST',
      body: fd,
      credentials: 'include',
    });
    if (!res.ok) {
      toast.error(getApiErrorMessage(await errorFromResponse(res)));
      return;
    }
    const data = await res.json();
    setPreview(data);
    setStep(1);
  };

  const statusLabel: Record<string, string> = {
    OK: 'Eklenecek',
    ERROR: 'Hatalı',
    EXISTS: 'Kursta zaten var',
    DUPLICATE: 'Dosyada tekrar',
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Excel ile Ekle</DialogTitle>
        </DialogHeader>
        <Steps
          current={step}
          items={[{ title: 'Dosya' }, { title: 'Önizleme' }, { title: 'Sonuç' }]}
        />
        <div className="mt-4 space-y-4">
          {step === 0 && (
            <>
              <p className="text-sm">
                <a href="/api/import/sample.xlsx" className="text-primary hover:underline">
                  Örnek Excel dosyasını indir
                </a>
              </p>
              <DatePicker value={certDate} onChange={(d) => d && setCertDate(d)} />
              <FilePicker
                accept=".xlsx"
                maxCount={1}
                value={file}
                onChange={(f) => setFile(f instanceof File ? f : null)}
                buttonLabel="Dosya Seç (.xlsx)"
              />
              <Button type="button" onClick={runPreview} disabled={!file}>
                Önizle
              </Button>
            </>
          )}
          {step === 1 && preview && (
            <>
              <DataTable<PreviewRow>
                dataSource={preview.rows}
                rowKey="rowNumber"
                pagination={{
                  current: 1,
                  pageSize: 10,
                  total: preview.rows.length,
                  onChange: () => {},
                }}
                columns={[
                  { title: 'Satır', dataIndex: 'rowNumber' },
                  { title: 'Ad', dataIndex: 'firstName' },
                  { title: 'Soyad', dataIndex: 'lastName' },
                  { title: 'Öğrenci No', dataIndex: 'studentNo' },
                  {
                    title: 'Durum',
                    render: (_, r) => statusLabel[(r as PreviewRow).status] ?? (r as PreviewRow).status,
                  },
                  { title: 'Sebep', dataIndex: 'reason' },
                ]}
              />
              <Button type="button" disabled={confirm.isPending} onClick={() => confirm.mutate()}>
                Onayla ve Ekle
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
