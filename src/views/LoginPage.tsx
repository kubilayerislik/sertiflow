'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '../api/client';
import { getApiErrorMessage } from '../api/errors';
import { useAuth } from '../auth/AuthContext';
import { emailSchema } from '@/shared/validation/email';
import { BrandLogo } from '../components/BrandLogo';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PORTAL = {
  pageBg: '#f3f5f7',
  navy: '#071a3d',
  yellow: '#f3c500',
  text: '#172033',
  footerBorder: '#e7e9ec',
} as const;

const schema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Parola gereklidir'),
});

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 21" aria-hidden>
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: () =>
      api<{ passwordLogin: boolean; samlConfigured: boolean }>('/api/config'),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const errorParam = searchParams.get('error');

  useEffect(() => {
    if (errorParam) {
      toast.error(errorParam);
    }
  }, [errorParam]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await api('/api/auth/login', { method: 'POST', json: values });
      await refresh();
      router.push('/kurslar');
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const passwordLogin = config?.passwordLogin ?? false;
  const samlConfigured = config?.samlConfigured ?? false;

  const onMicrosoftLogin = () => {
    if (samlConfigured) {
      window.location.href = '/api/auth/saml/login';
      return;
    }
    toast.info('Microsoft 365 entegrasyonu henüz gerçekleştirilmedi.');
  };

  return (
    <div
      className="flex min-h-screen flex-col font-[Arial,Helvetica,sans-serif]"
      style={{ backgroundColor: PORTAL.pageBg, color: PORTAL.text }}
    >
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div
          className="w-full max-w-[440px] overflow-hidden rounded-[10px] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
          style={{ borderTop: `6px solid ${PORTAL.yellow}` }}
        >
          <div className="px-7 py-10 sm:px-8 sm:py-11">
            <div className="mb-10 flex w-full justify-center">
              <BrandLogo
                variant="dark"
                height={52}
                linkToHome={false}
                className="w-full max-w-[300px] [&_svg]:h-auto [&_svg]:w-full"
              />
            </div>

            {errorParam ? (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{errorParam}</AlertDescription>
              </Alert>
            ) : null}

            <button
              type="button"
              onClick={onMicrosoftLogin}
              className="flex w-full items-center justify-center gap-2.5 rounded-[5px] border px-[18px] py-[11px] text-sm font-bold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#071a3d]/40"
              style={{
                borderColor: PORTAL.navy,
                backgroundColor: PORTAL.navy,
                color: '#ffffff',
              }}
            >
              <MicrosoftIcon className="size-5 shrink-0" />
              Çalışan Giriş
            </button>

            {passwordLogin ? (
              <div className="mt-8 border-t pt-8" style={{ borderColor: PORTAL.footerBorder }}>
                <p className="mb-4 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Geliştirme ortamı
                </p>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-posta</FormLabel>
                          <FormControl>
                            <Input type="email" autoComplete="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parola</FormLabel>
                          <FormControl>
                            <Input type="password" autoComplete="current-password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full border-[#cbd1d8] font-bold text-[#071a3d] hover:bg-[#fafbfc]"
                    >
                      Parola ile giriş
                    </Button>
                  </form>
                </Form>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
