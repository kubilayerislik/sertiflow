'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCallback, useState } from 'react';

type ConfirmOptions = {
  title: string;
  content?: React.ReactNode;
  okText?: string;
  cancelText?: string;
};

export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((ok: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const close = (ok: boolean) => {
    setOpen(false);
    resolver?.(ok);
    setResolver(null);
  };

  const dialog = (
    <AlertDialog open={open} onOpenChange={(v) => !v && close(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options?.title}</AlertDialogTitle>
          {options?.content ? (
            <AlertDialogDescription>{options.content}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => close(false)}>
            {options?.cancelText ?? 'İptal'}
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => close(true)}>
            {options?.okText ?? 'Tamam'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, dialog };
}
