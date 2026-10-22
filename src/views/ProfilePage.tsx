'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { KeyRound, Mail, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { api } from '../api/client';
import { getApiErrorMessage } from '../api/errors';
import { useAuth } from '../auth/AuthContext';
import { Spinner } from '@/components/Spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const ROLE_LABELS: Record<'ADMIN' | 'USER', string> = {
  ADMIN: 'Yönetici',
  USER: 'Kullanıcı',
};

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Mevcut parola gereklidir'),
    newPassword: z.string().min(10, 'En az 10 karakter'),
    confirmPassword: z.string().min(1, 'Onay gereklidir'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Parolalar eşleşmiyor',
    path: ['confirmPassword'],
  });

function profileInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toLocaleUpperCase('tr-TR');
  }
  return (parts[0]?.slice(0, 2) ?? '?').toLocaleUpperCase('tr-TR');
}

export function ProfilePage() {
  const { user, loading } = useAuth();
  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: () => api<{ passwordLogin: boolean }>('/api/config'),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await api('/api/users/me/password', {
        method: 'POST',
        json: {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
      });
      toast.success('Parola güncellendi');
      form.reset();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const passwordLogin = config?.passwordLogin ?? false;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const roleLabel = ROLE_LABELS[user.role];

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>

      <div className="mx-auto w-full max-w-lg space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
              <div
                className="flex size-20 shrink-0 items-center justify-center rounded-full text-2xl font-semibold text-white shadow-sm"
                style={{ backgroundColor: 'var(--app-header)' }}
                aria-hidden
              >
                {profileInitials(user.fullName)}
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div className="space-y-2">
                  <p className="text-xl font-semibold tracking-tight">{user.fullName}</p>
                  <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                    <Shield className="size-3" />
                    {roleLabel}
                  </Badge>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start">
                  <Mail className="size-4 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {passwordLogin ? (
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="size-4 text-muted-foreground" />
                Parola
              </CardTitle>
              <CardDescription>
                Geliştirme ortamında hesap parolanızı buradan güncelleyebilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mevcut parola</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="current-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yeni parola</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yeni parola (onay)</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    Parolayı güncelle
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
