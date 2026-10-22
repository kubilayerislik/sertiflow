'use client';

import { tr } from 'date-fns/locale';
import dayjs, { type Dayjs } from 'dayjs';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type DatePickerProps = {
  value?: Dayjs | null;
  onChange?: (value: Dayjs | null) => void;
  className?: string;
  disabled?: boolean;
};

export function DatePicker({ value, onChange, className, disabled }: DatePickerProps) {
  const date = value?.isValid() ? value.toDate() : undefined;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground',
              className,
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 size-4" />
        {date ? dayjs(date).format('DD.MM.YYYY') : 'Tarih seçin'}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={tr}
          selected={date}
          onSelect={(d) => onChange?.(d ? dayjs(d) : null)}
        />
      </PopoverContent>
    </Popover>
  );
}
