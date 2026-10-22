import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function TableIconButton({
  title,
  icon,
  onClick,
  loading,
  danger,
}: {
  title: string;
  icon: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  danger?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={loading}
            onClick={onClick}
            className={cn(danger && 'text-destructive hover:text-destructive')}
            aria-label={title}
          />
        }
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  );
}
