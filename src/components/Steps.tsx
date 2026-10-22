import { cn } from '@/lib/utils';

export function Steps({
  current,
  items,
}: {
  current: number;
  items: { title: string }[];
}) {
  return (
    <ol className="flex flex-wrap gap-2 text-sm">
      {items.map((item, i) => (
        <li
          key={item.title}
          className={cn(
            'rounded-md border px-3 py-1.5',
            i === current
              ? 'border-primary bg-primary/10 text-primary'
              : i < current
                ? 'border-border text-foreground'
                : 'border-border text-muted-foreground',
          )}
        >
          <span className="font-medium">{i + 1}.</span> {item.title}
        </li>
      ))}
    </ol>
  );
}
