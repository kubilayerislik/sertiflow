'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { api } from '../api/client';
import { getApiErrorMessage } from '../api/errors';
import { DatePicker } from '@/components/DatePicker';
import { FilePicker } from '@/components/FilePicker';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CourseListItem {
  id: string;
  name: string;
  shortName: string;
  templateStatus: 'READY' | 'INCOMPLETE';
  hasActiveTemplate?: boolean;
}

const schema = z
  .object({
    name: z.string().min(1, 'Kurs adı gereklidir'),
    shortName: z.string().min(1, 'Kısa ad zorunlu'),
    description: z.string().optional(),
    startDate: z.custom<Dayjs>((v) => dayjs.isDayjs(v) && v.isValid(), 'Başlangıç tarihi seçin'),
    endDate: z.custom<Dayjs>((v) => dayjs.isDayjs(v) && v.isValid(), 'Bitiş tarihi seçin'),
    templateSource: z.enum(['upload', 'copy']),
    templateFile: z.instanceof(File).optional(),
    copyFromCourseId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.templateSource === 'upload' && !data.templateFile) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'PDF şablon seçin', path: ['templateFile'] });
    }
    if (data.templateSource === 'copy' && !data.copyFromCourseId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Kurs seçin', path: ['copyFromCourseId'] });
    }
  });

export function CourseFormPage() {
  const router = useRouter();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      templateSource: 'upload',
      description: '',
      shortName: '',
      name: '',
    },
  });

  const templateSource = form.watch('templateSource');

  const { data: courseList } = useQuery({
    queryKey: ['courses', 'template-sources'],
    queryFn: () => api<{ items: CourseListItem[] }>('/api/courses?pageSize=200'),
  });

  const templateSources =
    courseList?.items.filter((c) => c.hasActiveTemplate !== false && c.templateStatus === 'READY') ??
    [];

  const save = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      const payload = {
        name: values.name,
        shortName: values.shortName.trim().toUpperCase(),
        description: values.description,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
      };
      return api<{ id: string }>('/api/courses', { method: 'POST', json: payload });
    },
    onSuccess: async (result, variables) => {
      const courseId = (result as { id: string }).id;

      if (variables.templateSource === 'copy') {
        if (!variables.copyFromCourseId) {
          toast.error('Kopyalanacak kursu seçin');
          return;
        }
        try {
          await api(`/api/courses/${courseId}/template/copy-from`, {
            method: 'POST',
            json: { sourceCourseId: variables.copyFromCourseId },
          });
        } catch (e) {
          toast.error(getApiErrorMessage(e));
          router.push(`/kurslar/${courseId}/ayarlar/sablon`);
          return;
        }
      } else if (variables.templateFile) {
        const fd = new FormData();
        fd.append('file', variables.templateFile);
        const uploadRes = await fetch(`/api/courses/${courseId}/template`, {
          method: 'POST',
          body: fd,
          credentials: 'include',
        });
        if (!uploadRes.ok) {
          const body = await uploadRes.json().catch(() => ({}));
          toast.error((body as { message?: string }).message ?? 'Şablon PDF yüklenemedi');
          router.push(`/kurslar/${courseId}/ayarlar/sablon`);
          return;
        }
      } else {
        toast.error('PDF şablon yükleyin veya başka kurstan kopyalayın');
        return;
      }
      toast.success('Kaydedildi');
      router.push(`/kurslar/${courseId}`);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
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
                <Input {...field} className="uppercase" placeholder="ISG-2627" />
              </FormControl>
              <FormDescription>
                Sertifika numarasının ön eki (ör. ISG-2627 → ISG-2627-0001). Büyük harf, rakam ve tire. Benzersiz olmalıdır.
              </FormDescription>
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
        <FormField
          control={form.control}
          name="templateSource"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sertifika şablonu</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="upload" id="tpl-upload" />
                    <Label htmlFor="tpl-upload">PDF yükle</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="copy" id="tpl-copy" />
                    <Label htmlFor="tpl-copy">Başka kurstan kopyala</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {templateSource === 'upload' ? (
          <FormField
            control={form.control}
            name="templateFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Boş sertifika şablonu (PDF)</FormLabel>
                <FormControl>
                  <FilePicker
                    accept=".pdf"
                    maxCount={1}
                    value={field.value ?? null}
                    onChange={(f) => field.onChange(f instanceof File ? f : undefined)}
                    buttonLabel="PDF Seç"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="copyFromCourseId"
            render={({ field }) => {
              const selected = templateSources.find((c) => c.id === field.value);
              return (
              <FormItem>
                <FormLabel>Kaynak kurs</FormLabel>
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      {selected ? (
                        `${selected.name} (${selected.shortName})`
                      ) : (
                        <SelectValue placeholder="Kurs seçin" />
                      )}
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {templateSources.length === 0 ? (
                      <SelectItem value="__none" disabled>Kopyalanabilir şablonlu kurs yok</SelectItem>
                    ) : (
                      templateSources.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.shortName})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  PDF, alan yerleşimi ve yetkili imza (varsa) kopyalanır.
                </FormDescription>
                <FormMessage />
              </FormItem>
              );
            }}
          />
        )}
        <Button type="submit" disabled={save.isPending}>Kaydet</Button>
      </form>
    </Form>
  );
}
