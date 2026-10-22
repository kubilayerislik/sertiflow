import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../api/client';
import { getApiErrorMessage } from '../api/errors';

type SendMailResult = { ok: boolean; simulated?: boolean; toEmail?: string; logId?: string };

export function useSendStudentMail(options?: {
  invalidateKeys?: unknown[][];
}) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (enrollmentId: string) =>
      api<SendMailResult>(`/api/students/${enrollmentId}/send`, { method: 'POST' }),
    onSuccess: (res) => {
      const enrolled = res.toEmail
        ? `${res.toEmail} adresine (kursa kayıtlı e-posta)`
        : 'kursa kayıtlı e-posta adresine';
      if (res.simulated) {
        toast.success(`Geliştirme ortamı: ${enrolled} gönderildi (simülasyon)`);
      } else {
        toast.success(`${enrolled} gönderim kuyruğa alındı`);
      }
      for (const key of options?.invalidateKeys ?? []) {
        qc.invalidateQueries({ queryKey: key });
      }
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}
