'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '../api/client';
import { DataTable } from '@/components/DataTable';
import { SearchInput } from '@/components/SearchInput';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CourseRow {
  id: string;
  name: string;
  shortName: string;
  startDate: string;
  endDate: string;
  activeStudentCount: number;
  templateStatus: 'READY' | 'INCOMPLETE';
}

export function CoursesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['courses', search, page, pageSize],
    queryFn: () =>
      api<{ items: CourseRow[]; total: number }>(
        `/api/courses?search=${encodeURIComponent(search)}&page=${page}&pageSize=${pageSize}`,
      ),
  });

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => router.push('/kurslar/yeni')}>
          Yeni Kurs
        </Button>
        <SearchInput
          placeholder="Kurs adı veya kısa ad"
          className="w-60"
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
      </div>
      <DataTable<CourseRow>
        loading={isLoading}
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
          {
            title: 'Kurs',
            dataIndex: 'name',
            render: (name, row) => (
              <Link href={`/kurslar/${(row as CourseRow).id}`} className="text-primary hover:underline">
                {name as string}
              </Link>
            ),
          },
          { title: 'Kısa ad', dataIndex: 'shortName' },
          {
            title: 'Tarih',
            render: (_, row) => {
              const r = row as CourseRow;
              return `${new Date(r.startDate).toLocaleDateString('tr-TR')} – ${new Date(r.endDate).toLocaleDateString('tr-TR')}`;
            },
          },
          { title: 'Öğrenci', dataIndex: 'activeStudentCount' },
          {
            title: 'Şablon',
            dataIndex: 'templateStatus',
            render: (s) =>
              s === 'READY' ? (
                <Badge className="bg-green-600 hover:bg-green-600">Hazır</Badge>
              ) : (
                <Badge variant="secondary">Yerleşim eksik</Badge>
              ),
          },
        ]}
      />
    </div>
  );
}
