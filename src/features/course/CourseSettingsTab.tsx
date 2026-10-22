'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { LayoutTemplate, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { api } from '../../api/client';
import { getApiErrorMessage } from '../../api/errors';
import { useConfirm } from '@/components/ConfirmDialog';
import { DatePicker } from '@/components/DatePicker';
import { Spinner } from '@/components/Spinner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const schema = z.object({
  name: z.string().min(1, 'Kurs adı gereklidir'),
  shortName: z.string(),
  description: z.string().optional(),
  startDate: z.custom<Dayjs>((v) => dayjs.isDayjs(v) && v.isValid()),
  endDate: z.custom<Dayjs>((v) => dayjs.isDayjs(v) && v.isValid()),
});

export function CourseSettingsTab({ courseId }: { courseId: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => api<Record<string, string>>(`/api/courses/${courseId}`),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      shortName: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!course) return;
    form.reset({
      name: course.name,
      shortName: course.shortName,
      description: course.description ?? '',
      startDate: dayjs(course.startDate),
      endDate: dayjs(course.endDate),
    });
  }, [course, form]);

  const save = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => {
      const payload = {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
      };
      return api(`/api/courses/${courseId}`, { method: 'PATCH', json: payload });
    },
    onSuccess: () => {
      toast.success('Kaydedildi');
      qc.invalidateQueries({ queryKey: ['course', courseId] });
      qc.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: () => api(`/api/courses/${courseId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Kurs silindi');
      router.push('/kurslar');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  if (isLoading || !course) {
    return <Spinner className="mx-auto my-8" />;
  }

  return (
    <>
      {dialog}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((v) => save.mutate(v))}
          className="max-w-xl space-y-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kurs adı</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shortName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kısa ad</FormLabel>
                <FormControl>
                  <Input disabled {...field} />
                </FormControl>
                <FormDescription>Sertifika numarası ön eki; oluşturulduktan sonra değiştirilemez.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Açıklama</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Başlangıç</FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bitiş</FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-wrap gap-2 pb-6">
            <Button type="submit" disabled={save.isPending}>Kaydet</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/kurslar/${courseId}/ayarlar/sablon`)}
            >
              <LayoutTemplate className="size-4" />
              Şablon düzenle
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/kurslar/${courseId}/ayarlar/eposta`)}
            >
              <Mail className="size-4" />
              E-posta düzenle
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                const ok = await confirm({ title: 'Kurs silinsin mi?' });
                if (ok) remove.mutate();
              }}
            >
              Kursu sil
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
