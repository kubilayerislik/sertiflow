'use client';

import { SearchIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type SearchInputProps = {
  placeholder?: string;
  className?: string;
  onSearch: (value: string) => void;
  defaultValue?: string;
};

export function SearchInput({ placeholder, className, onSearch, defaultValue = '' }: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);

  const submit = () => onSearch(value.trim());

  return (
    <div className={cn('relative flex max-w-sm items-center gap-1', className)}>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="pr-16"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="absolute right-8"
          aria-label="Temizle"
          onClick={() => {
            setValue('');
            onSearch('');
          }}
        >
          <XIcon className="size-3.5" />
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="absolute right-1"
        aria-label="Ara"
        onClick={submit}
      >
        <SearchIcon className="size-3.5" />
      </Button>
    </div>
  );
}
