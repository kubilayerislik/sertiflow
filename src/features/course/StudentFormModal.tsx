'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { api } from '../../api/client';
import { getApiErrorMessage } from '../../api/errors';
import { emailSchema } from '@/shared/validation/email';
import { DatePicker } from '@/components/DatePicker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const schema = z.object({
  firstName: z.string().min(1, 'Ad gereklidir'),
  lastName: z.string().min(1, 'Soyad gereklidir'),
  studentNo: z.string().min(1, 'Öğrenci no gereklidir'),
  email: emailSchema,
  certificateDate: z.custom<Dayjs>((v) => dayjs.isDayjs(v) && v.isValid(), 'Geçerli bir sertifika tarihi seçin'),
});

export function StudentFormModal({
  courseId,
  row,
  onClose,
  onSaved,
}: {
  courseId: string;
  row?: {
    id: string;
    firstName: string;
    lastName: string;
    studentNo: string;
    email: string;
    certificateDate?: string;
  };
  onClose: () => void;
  onSaved?: (created: boolean) => void | Promise<void>;
}) {
  const qc = useQueryClient();
  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => api<{ endDate: string }>(`/api/courses/${courseId}`),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: row
      ? {
          ...row,
          certificateDate: dayjs(row.certificateDate ?? course?.endDate),
        }
      : {
          firstName: '',
          lastName: '',
          studentNo: '',
          email: '',
          certificateDate: dayjs(course?.endDate),
        },
  });

  useEffect(() => {
    if (row) return;
    if (!course?.endDate) return;
    const current = form.getValues('certificateDate');
    if (!current || !dayjs.isDayjs(current) || !current.isValid()) {
      form.setValue('certificateDate', dayjs(course.endDate));
    }
  }, [course?.endDate, row, form]);

  const save = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => {
      const payload = {
        ...values,
        certificateDate: values.certificateDate.startOf('day').toISOString(),
      };
      if (row) {
        return api(`/api/students/${row.id}`, { method: 'PATCH', json: payload });
      }
      return api(`/api/courses/${courseId}/students`, { method: 'POST', json: payload });
    },
    onSuccess: async (res) => {
      if ((res as { emailWarning?: boolean })?.emailWarning) {
        toast.warning('Bu e-posta kursta başka bir kayıtta da kullanılıyor');
      } else {
        toast.success(row ? 'Öğrenci güncellendi' : 'Öğrenci eklendi');
      }
      if (onSaved) {
        await onSaved(!row);
      } else {
        await qc.refetchQueries({ queryKey: ['students', courseId] });
      }
      onClose();
    },
    onError: (e: Error & { data?: { restoreId?: string; message?: string } }) => {
      if (e.data?.restoreId) {
        toast.error('Bu öğrenci no silinmiş bir kayıtta var; Silinenler sekmesinden geri getirin.');
        return;
      }
      toast.error(getApiErrorMessage(e));
    },
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{row ? 'Öğrenci Düzenle' : 'Öğrenci Ekle'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Soyad</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="studentNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Öğrenci No</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-posta</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="certificateDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sertifika tarihi</FormLabel>
                  <FormControl>
                    <DatePicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
              <Button type="submit" disabled={save.isPending || (!row && !course)}>
                Kaydet
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
