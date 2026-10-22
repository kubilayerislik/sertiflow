'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Spinner } from '@/components/Spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TriangleAlertIcon, CircleXIcon } from 'lucide-react';

export function VerifyPage() {
  const params = useParams();
  const code = params?.code as string;
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['verify', code],
    queryFn: () => api<Record<string, unknown>>(`/api/public/verify/${code}`),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="mx-auto my-20 flex justify-center">
        <Spinner />
      </div>
    );
  }

  const status = (error as Error & { status?: number })?.status;
  if (isError && status === 429) {
    return (
      <Alert variant="default" className="mx-auto my-10 max-w-md">
        <TriangleAlertIcon />
        <AlertTitle>Çok fazla istek</AlertTitle>
        <AlertDescription>Lütfen bir süre sonra tekrar deneyin.</AlertDescription>
      </Alert>
    );
  }
  if (isError) {
    return (
      <Alert variant="destructive" className="mx-auto my-10 max-w-md">
        <CircleXIcon />
        <AlertTitle>Doğrulama yapılamadı</AlertTitle>
        <AlertDescription>Bağlantı hatası veya sunucu yanıt vermiyor.</AlertDescription>
      </Alert>
    );
  }

  if (!data?.valid) {
    return (
      <Card className="mx-auto my-10 max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-destructive">Bu sertifika geçerli değil</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{data?.message as string}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto my-10 max-w-md">
      <CardHeader>
        <CardTitle>Sertifika Doğrulama</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p><strong>Ad Soyad:</strong> {data.maskedName as string}</p>
        <p><strong>Kurs:</strong> {data.courseName as string}</p>
        <p><strong>Sertifika No:</strong> {data.certificateNo as string}</p>
        <p>
          <strong>Tarih:</strong>{' '}
          {new Date(data.certificateDate as string).toLocaleDateString('tr-TR')}
        </p>
        <p className="font-medium text-green-600">Durum: Geçerli</p>
      </CardContent>
    </Card>
  );
}
