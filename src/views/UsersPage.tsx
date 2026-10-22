'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { api } from '../api/client';
import { getApiErrorMessage } from '../api/errors';
import { useAuth } from '../auth/AuthContext';
import { emailSchema } from '@/shared/validation/email';
import { DataTable } from '@/components/DataTable';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const ROLE_LABELS: Record<'ADMIN' | 'USER', string> = {
  ADMIN: 'Yönetici',
  USER: 'Kullanıcı',
};

const createSchema = z.object({
  fullName: z.string().min(1, 'Ad soyad gereklidir'),
  email: emailSchema,
  role: z.enum(['ADMIN', 'USER']),
  password: z.string().optional(),
});

export function UsersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: () => api<{ passwordLogin: boolean }>('/api/config'),
  });
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api<Array<Record<string, unknown>>>('/api/users'),
    enabled: user?.role === 'ADMIN',
  });
  const form = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { fullName: '', email: '', role: 'USER', password: '' },
  });

  useEffect(() => {
    if (!loading && user && user.role !== 'ADMIN') {
      router.replace('/kurslar');
    }
  }, [loading, user, router]);

  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => api('/api/users', { method: 'POST', json: body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      form.reset();
      toast.success('Kullanıcı eklendi');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api(`/api/users/${id}`, { method: 'PATCH', json: { isActive } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'ADMIN' | 'USER' }) =>
      api(`/api/users/${id}`, { method: 'PATCH', json: { role } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  if (loading || user?.role !== 'ADMIN') {
    return null;
  }

  const passwordRequired = config?.passwordLogin ?? false;

  const onCreate = (values: z.infer<typeof createSchema>) => {
    if (passwordRequired && (!values.password || values.password.length < 10)) {
      form.setError('password', { message: 'En az 10 karakter' });
      return;
    }
    const body: Record<string, unknown> = {
      fullName: values.fullName,
      email: values.email,
      role: values.role,
    };
    if (values.password) body.password = values.password;
    create.mutate(body);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kullanıcılar</h1>
        </div>
        <Button type="button" onClick={() => setOpen(true)}>
          <UserPlus className="size-4" />
          Yeni kullanıcı
        </Button>
      </div>
      <DataTable
        loading={isLoading}
        dataSource={(data ?? []) as Record<string, unknown>[]}
        columns={[
          { title: 'Ad', dataIndex: 'fullName' },
          { title: 'E-posta', dataIndex: 'email' },
          {
            title: 'Rol',
            dataIndex: 'role',
            render: (v, row) => (
              <Select
                value={v as string}
                onValueChange={(role) =>
                  setRole.mutate({ id: row.id as string, role: role as 'ADMIN' | 'USER' })
                }
              >
                <SelectTrigger className="h-8 w-[120px]">
                  {ROLE_LABELS[v as 'ADMIN' | 'USER'] ?? String(v)}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Yönetici</SelectItem>
                  <SelectItem value="USER">Kullanıcı</SelectItem>
                </SelectContent>
              </Select>
            ),
          },
          {
            title: 'Aktif',
            dataIndex: 'isActive',
            render: (v, row) => (
              <Switch
                checked={v as boolean}
                onCheckedChange={(checked) =>
                  toggle.mutate({ id: row.id as string, isActive: checked })
                }
              />
            ),
          },
        ]}
        pagination={false}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni kullanıcı</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad soyad</FormLabel>
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
                    <FormLabel>Kurumsal e-posta</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USER">Kullanıcı</SelectItem>
                        <SelectItem value="ADMIN">Yönetici</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {passwordRequired ? (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parola (geliştirme)</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={create.isPending}>Kaydet</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
