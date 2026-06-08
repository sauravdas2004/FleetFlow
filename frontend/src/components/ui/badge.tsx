import { cn, getStatusColor, formatStatus } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: string;
}

export function Badge({ className, status, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        status ? getStatusColor(status) : 'bg-primary/10 text-primary',
        className
      )}
      {...props}
    >
      {children || (status ? formatStatus(status) : '')}
    </span>
  );
}
