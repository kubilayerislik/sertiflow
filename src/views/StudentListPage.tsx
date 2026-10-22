'use client';

import { FileText, Mail } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { TableIconButton } from '../components/TableIconButton';
import { useSendStudentMail } from '../hooks/useSendStudentMail';
import { DataTable } from '@/components/DataTable';

interface CertificateRow {
  id: string;
  firstName: string;
  lastName: string;
  studentNo: string;
  email: string;
  certificateNo: string;
  certificateDate: string;
  courseId: string;
  courseName: string;
  courseShortName: string;
}

export function StudentListPage() {
  const searchParams = useSearchParams();
  const q = (searchParams.get('q') ?? '').trim();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setPage(1);
  }, [q]);

  const sendMail = useSendStudentMail({
    invalidateKeys: [['students-global']],
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['students-global', q, page, pageSize],
    queryFn: () =>
      api<{ items: CertificateRow[]; total: number }>(
        `/api/students/search?search=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`,
      ),
    enabled: q.length >= 2,
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Arama sonuçları</h1>
        {data !== undefined ? (
          <span className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{data.total}</span> kayıt
          </span>
        ) : null}
      </div>

      <DataTable<CertificateRow>
        loading={isLoading || isFetching}
        dataSource={data?.items ?? []}
        pagination={{
          current: page,
          pageSize,
          total: data?.total ?? 0,
          pageSizeOptions: [25, 50, 100],
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        columns={[
          { title: 'Ad', dataIndex: 'firstName' },
          { title: 'Soyad', dataIndex: 'lastName' },
          { title: 'Öğrenci no', dataIndex: 'studentNo' },
          { title: 'E-posta', dataIndex: 'email' },
          {
            title: 'Kurs',
            dataIndex: 'courseName',
            render: (name, row) => {
              const r = row as CertificateRow;
              return (
                <Link href={`/kurslar/${r.courseId}`} className="text-primary hover:underline">
                  {name as string}
                </Link>
              );
            },
          },
          { title: 'Kısa ad', dataIndex: 'courseShortName' },
          { title: 'Sertifika no', dataIndex: 'certificateNo' },
          {
            title: 'Sertifika tarihi',
            dataIndex: 'certificateDate',
            render: (v) => new Date(v as string).toLocaleDateString('tr-TR'),
          },
          {
            title: 'İşlemler',
            width: 96,
            render: (_, row) => {
              const r = row as CertificateRow;
              return (
                <div className="flex gap-0.5">
                  <TableIconButton
                    title="Sertifikayı göster"
                    icon={<FileText className="size-4" />}
                    onClick={() => window.open(`/api/students/${r.id}/certificate`, '_blank')}
                  />
                  <TableIconButton
                    title="Sertifikayı e-posta ile gönder"
                    icon={<Mail className="size-4" />}
                    loading={sendMail.isPending && sendMail.variables === r.id}
                    onClick={() => sendMail.mutate(r.id)}
                  />
                </div>
              );
            },
          },
        ]}
      />
    </div>
  );
}
