'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FilePickerProps = {
  accept?: string;
  maxCount?: number;
  value?: File | File[] | null;
  onChange?: (files: File | File[] | null) => void;
  buttonLabel?: string;
  className?: string;
};

export function FilePicker({
  accept,
  maxCount = 1,
  value,
  onChange,
  buttonLabel = 'Dosya Seç',
  className,
}: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const files = value == null ? [] : Array.isArray(value) ? value : [value];
  const label =
    files.length > 0 ? files.map((f) => f.name).join(', ') : null;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={maxCount > 1}
        className="hidden"
        onChange={(e) => {
          const list = e.target.files ? Array.from(e.target.files) : [];
          if (list.length === 0) {
            onChange?.(null);
            return;
          }
          onChange?.(maxCount === 1 ? list[0]! : list.slice(0, maxCount));
          e.target.value = '';
        }}
      />
      <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
        {buttonLabel}
      </Button>
      {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
    </div>
  );
}
