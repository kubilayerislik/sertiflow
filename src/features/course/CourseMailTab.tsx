'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { DEFAULT_MAIL_BODY, DEFAULT_MAIL_SUBJECT } from '@/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { api } from '../../api/client';
import { getApiErrorMessage } from '../../api/errors';
import { useConfig } from '../../hooks/useConfig';
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
  mailSubject: z.string().min(1, 'Konu gereklidir'),
  mailBody: z.string().min(1, 'E-posta metni gereklidir'),
});

export function CourseMailTab({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const { mailEnabled } = useConfig();
  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => api<Record<string, string>>(`/api/courses/${courseId}`),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      mailSubject: DEFAULT_MAIL_SUBJECT,
      mailBody: DEFAULT_MAIL_BODY,
    },
  });

  useEffect(() => {
    if (!course) return;
    form.reset({
      mailSubject: course.mailSubject?.trim() ? course.mailSubject : DEFAULT_MAIL_SUBJECT,
      mailBody: course.mailBody?.trim() ? course.mailBody : DEFAULT_MAIL_BODY,
    });
  }, [course, form]);

  const save = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      api(`/api/courses/${courseId}`, { method: 'PATCH', json: values }),
    onSuccess: () => {
      toast.success('E-posta şablonu kaydedildi');
      qc.invalidateQueries({ queryKey: ['course', courseId] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const testMail = useMutation({
    mutationFn: () => api('/api/mail/test', { method: 'POST' }),
    onSuccess: () => toast.success('Test maili gönderildi'),
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  if (isLoading || !course) {
    return <Spinner className="mx-auto my-8" />;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) => save.mutate(v))}
        className="flex w-full max-w-2xl flex-col gap-4"
      >
        <p className="text-sm text-muted-foreground">
          Öğrenciye sertifika gönderildiğinde kullanılacak konu ve HTML metin. PDF sertifika otomatik eklenir.
          {!mailEnabled
            ? ' Geliştirme ortamında gönderim simüle edilir; kaydettiğiniz şablon üretimde geçerli olur.'
            : null}
        </p>
        <FormField
          control={form.control}
          name="mailSubject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-posta konusu</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mailBody"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-posta metni (HTML)</FormLabel>
              <FormControl>
                <Textarea rows={12} className="font-mono text-sm" {...field} />
              </FormControl>
              <FormDescription>
                Değişkenler: {'{ad}'}, {'{soyad}'}, {'{kurs_adi}'}, {'{sertifika_tarihi}'},{' '}
                {'{dogrulama_linki}'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={save.isPending}>Kaydet</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.setValue('mailSubject', DEFAULT_MAIL_SUBJECT);
              form.setValue('mailBody', DEFAULT_MAIL_BODY);
            }}
          >
            Varsayılan şablonu yükle
          </Button>
          {mailEnabled ? (
            <Button
              type="button"
              variant="outline"
              disabled={testMail.isPending}
              onClick={() => testMail.mutate()}
            >
              Test maili gönder
            </Button>
          ) : null}
          <Button type="button" variant="outline" render={<Link href={`/kurslar/${courseId}/ayarlar/mail`} />}>
            E-posta geçmişi
          </Button>
        </div>
      </form>
    </Form>
  );
}
