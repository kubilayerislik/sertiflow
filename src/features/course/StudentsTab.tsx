'use client';

import {
  FileText,
  History,
  LayoutTemplate,
  Mail,
  Pencil,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../api/client';
import { TableIconButton } from '../../components/TableIconButton';
import { StudentFormModal } from './StudentFormModal';
import { ExcelImportModal } from './ExcelImportModal';
import { BulkMailModal } from './BulkMailModal';
import { StudentMailDrawer } from './StudentMailDrawer';
import { useConfig } from '../../hooks/useConfig';
import { useSendStudentMail } from '../../hooks/useSendStudentMail';
import { useConfirm } from '@/components/ConfirmDialog';
import { DataTable } from '@/components/DataTable';
import { SearchInput } from '@/components/SearchInput';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StudentRow {
  id: string;
  firstName: string;
  lastName: string;
  studentNo: string;
  email: string;
  certificateNo: string;
  deletedAt?: string;
  deletedBy?: string;
  daysUntilAnonymize?: number | null;
  lastMailStatus?: string;
}

export function StudentsTab({ courseId }: { courseId: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { mailEnabled } = useConfig();
  const { confirm, dialog } = useConfirm();
  const [search, setSearch] = useState('');
  const [deleted, setDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; row?: StudentRow } | null>(null);
  const [excelOpen, setExcelOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [mailDrawer, setMailDrawer] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['students', courseId, search, deleted, page, pageSize],
    queryFn: () =>
      api<{ items: StudentRow[]; total: number }>(
        `/api/courses/${courseId}/students?search=${encodeURIComponent(search)}&deleted=${deleted}&page=${page}&pageSize=${pageSize}`,
      ),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/students/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students', courseId] }),
  });

  const restore = useMutation({
    mutationFn: (id: string) => api(`/api/students/${id}/restore`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students', courseId] }),
  });

  const sendMail = useSendStudentMail({
    invalidateKeys: [['students', courseId]],
  });

  const showCert = (id: string) => {
    window.open(`/api/students/${id}/certificate`, '_blank');
  };

  return (
    <>
      {dialog}
      <div className="flex w-full flex-col gap-4">
        <Tabs
          value={deleted ? 'deleted' : 'active'}
          onValueChange={(k) => {
            setDeleted(k === 'deleted');
            setPage(1);
            setSelectedRowKeys([]);
          }}
        >
          <TabsList>
            <TabsTrigger value="active">Aktif</TabsTrigger>
            <TabsTrigger value="deleted">Silinenler</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap gap-2">
          {!deleted && (
            <>
              <Button type="button" onClick={() => setModal({ mode: 'create' })}>Öğrenci Ekle</Button>
              <Button type="button" variant="outline" onClick={() => setExcelOpen(true)}>Excel ile Ekle</Button>
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
              {mailEnabled && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!selectedRowKeys.length}
                    onClick={() => setBulkOpen(true)}
                  >
                    Seçililere Mail Gönder
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedRowKeys([]);
                      setBulkOpen(true);
                    }}
                  >
                    Tümüne Mail Gönder
                  </Button>
                </>
              )}
            </>
          )}
          <SearchInput placeholder="Ara" className="w-60" onSearch={setSearch} />
        </div>
        <DataTable<StudentRow>
          loading={isLoading}
          dataSource={data?.items ?? []}
          rowSelection={
            !deleted && mailEnabled
              ? {
                  selectedRowKeys,
                  onChange: setSelectedRowKeys,
                  getRowKey: (row) => (row as StudentRow).id,
                }
              : undefined
          }
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
            { title: 'Öğrenci No', dataIndex: 'studentNo' },
            { title: 'E-posta', dataIndex: 'email' },
            { title: 'Sertifika No', dataIndex: 'certificateNo' },
            ...(deleted
              ? [
                  {
                    title: 'Silinme',
                    dataIndex: 'deletedAt',
                    render: (v: unknown) =>
                      v ? new Date(v as string).toLocaleDateString('tr-TR') : '—',
                  },
                  { title: 'Silen', dataIndex: 'deletedBy' },
                  { title: 'Anonimleşmeye kalan (gün)', dataIndex: 'daysUntilAnonymize' },
                ]
              : []),
            ...(mailEnabled && !deleted
              ? [
                  {
                    title: 'Mail',
                    dataIndex: 'lastMailStatus',
                    render: (s: unknown) => {
                      const status = s as string;
                      if (status === 'SENT') {
                        return <Badge className="bg-green-600 hover:bg-green-600">Gönderildi</Badge>;
                      }
                      if (status === 'FAILED') {
                        return <Badge variant="destructive">Hata</Badge>;
                      }
                      return <Badge variant="secondary">Gönderilmedi</Badge>;
                    },
                  },
                ]
              : []),
            {
              title: 'İşlemler',
              width: 200,
              render: (_, row) => {
                const r = row as StudentRow;
                return (
                  <div className="flex gap-0.5">
                    {!deleted && (
                      <>
                        <TableIconButton
                          title="Düzenle"
                          icon={<Pencil className="size-4" />}
                          onClick={() => setModal({ mode: 'edit', row: r })}
                        />
                        <TableIconButton
                          title="Sertifikayı göster"
                          icon={<FileText className="size-4" />}
                          onClick={() => showCert(r.id)}
                        />
                        <TableIconButton
                          title="Sertifikayı e-posta ile gönder"
                          icon={<Mail className="size-4" />}
                          loading={sendMail.isPending && sendMail.variables === r.id}
                          onClick={() => sendMail.mutate(r.id)}
                        />
                        {mailEnabled && (
                          <TableIconButton
                            title="Mail geçmişi"
                            icon={<History className="size-4" />}
                            onClick={() =>
                              setMailDrawer({
                                id: r.id,
                                name: `${r.firstName} ${r.lastName}`,
                              })
                            }
                          />
                        )}
                        <TableIconButton
                          title="Sil"
                          icon={<Trash2 className="size-4" />}
                          danger
                          onClick={async () => {
                            const ok = await confirm({
                              title: 'Silinsin mi?',
                              content: `${r.firstName} ${r.lastName} (${r.studentNo})`,
                            });
                            if (ok) remove.mutate(r.id);
                          }}
                        />
                      </>
                    )}
                    {deleted && (
                      <TableIconButton
                        title="Geri getir"
                        icon={<Undo2 className="size-4" />}
                        loading={restore.isPending && restore.variables === r.id}
                        onClick={() => restore.mutate(r.id)}
                      />
                    )}
                  </div>
                );
              },
            },
          ]}
        />
        {modal && (
          <StudentFormModal
            courseId={courseId}
            row={modal.mode === 'edit' ? modal.row : undefined}
            onClose={() => setModal(null)}
            onSaved={async (created) => {
              const refetchPage = created ? 1 : page;
              if (created) setPage(1);
              await qc.refetchQueries({
                queryKey: ['students', courseId, search, deleted, refetchPage, pageSize],
              });
            }}
          />
        )}
        <ExcelImportModal courseId={courseId} open={excelOpen} onClose={() => setExcelOpen(false)} />
        <BulkMailModal
          courseId={courseId}
          enrollmentIds={selectedRowKeys.length ? selectedRowKeys : undefined}
          open={bulkOpen}
          onClose={() => {
            setBulkOpen(false);
            qc.invalidateQueries({ queryKey: ['students', courseId] });
          }}
        />
        <StudentMailDrawer
          enrollmentId={mailDrawer?.id ?? null}
          studentName={mailDrawer?.name ?? ''}
          open={Boolean(mailDrawer)}
          onClose={() => setMailDrawer(null)}
        />
      </div>
    </>
  );
}
