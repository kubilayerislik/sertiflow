'use client';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/Spinner';
import { cn } from '@/lib/utils';

export type DataColumn<T> = {
  title: string;
  dataIndex?: string;
  width?: number;
  render?: (value: unknown, row: T) => React.ReactNode;
};

type PaginationConfig = {
  current: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  onChange: (page: number, pageSize: number) => void;
};

type RowSelectionConfig = {
  selectedRowKeys: string[];
  onChange: (keys: string[]) => void;
  getRowKey: (row: unknown) => string;
};

export function DataTable<T extends object = Record<string, unknown>>({
  rowKey: rowKeyProp = 'id',
  loading,
  dataSource,
  columns,
  pagination,
  rowSelection,
  className,
}: {
  rowKey?: string;
  loading?: boolean;
  dataSource: T[];
  columns: DataColumn<T>[];
  pagination?: PaginationConfig | false;
  rowSelection?: RowSelectionConfig;
  className?: string;
}) {
  const rowKey = rowKeyProp;
  const getKey = (row: T) => String((row as Record<string, unknown>)[rowKey]);

  const allKeys = dataSource.map(getKey);
  const allSelected =
    allKeys.length > 0 && allKeys.every((k) => rowSelection?.selectedRowKeys.includes(k));

  return (
    <div className={cn('space-y-3', className)}>
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {rowSelection ? (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => {
                      rowSelection.onChange(checked ? allKeys : []);
                    }}
                    aria-label="Tümünü seç"
                  />
                </TableHead>
              ) : null}
              {columns.map((col) => (
                <TableHead key={col.title} style={col.width ? { width: col.width } : undefined}>
                  {col.title}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (rowSelection ? 1 : 0)} className="h-24">
                  <div className="flex justify-center">
                    <Spinner />
                  </div>
                </TableCell>
              </TableRow>
            ) : dataSource.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (rowSelection ? 1 : 0)}
                  className="h-16 text-center text-muted-foreground"
                >
                  Kayıt yok
                </TableCell>
              </TableRow>
            ) : (
              dataSource.map((row) => {
                const key = getKey(row);
                const selected = rowSelection?.selectedRowKeys.includes(key);
                return (
                  <TableRow key={key} data-state={selected ? 'selected' : undefined}>
                    {rowSelection ? (
                      <TableCell>
                        <Checkbox
                          checked={selected}
                          onCheckedChange={(checked) => {
                            const keys = rowSelection.selectedRowKeys;
                            rowSelection.onChange(
                              checked ? [...keys, key] : keys.filter((k) => k !== key),
                            );
                          }}
                          aria-label="Satır seç"
                        />
                      </TableCell>
                    ) : null}
                    {columns.map((col) => {
                      const value = col.dataIndex
                        ? (row as Record<string, unknown>)[col.dataIndex]
                        : undefined;
                      return (
                        <TableCell key={col.title} className="text-sm">
                          {col.render ? col.render(value, row) : (value as React.ReactNode)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {pagination ? (
        <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
          <span className="text-muted-foreground">
            Toplam {pagination.total} kayıt
          </span>
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(v) => pagination.onChange(1, Number(v))}
          >
            <SelectTrigger className="w-[88px]" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(pagination.pageSizeOptions ?? [25, 50, 100]).map((n) => (
                <SelectItem key={n} value={String(n)}>{n} / sayfa</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded border px-2 py-1 disabled:opacity-40"
              disabled={pagination.current <= 1}
              onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
            >
              Önceki
            </button>
            <span className="min-w-[4rem] text-center">
              {pagination.current} / {Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}
            </span>
            <button
              type="button"
              className="rounded border px-2 py-1 disabled:opacity-40"
              disabled={
                pagination.current >= Math.ceil(pagination.total / pagination.pageSize) ||
                pagination.total === 0
              }
              onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
            >
              Sonraki
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
