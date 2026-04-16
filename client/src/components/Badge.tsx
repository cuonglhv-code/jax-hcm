import { clsx } from 'clsx';

type BadgeVariant =
  | 'active' | 'inactive' | 'pending' | 'rejected' | 'approved'
  | 'draft' | 'info' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ variant = 'default', children, dot = false, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        variant === 'active' && 'badge-active',
        variant === 'inactive' && 'badge-inactive',
        variant === 'pending' && 'badge-pending',
        variant === 'rejected' && 'badge-rejected',
        variant === 'approved' && 'badge-approved',
        variant === 'draft' && 'badge-draft',
        variant === 'info' && 'badge-info',
        variant === 'default' && 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

// Status → variant mapping helpers
export const statusVariant = (status: string): BadgeVariant => {
  const map: Record<string, BadgeVariant> = {
    active: 'active', approved: 'approved', hired: 'active', paid: 'active',
    completed: 'active', accepted: 'active', pass: 'active',
    inactive: 'inactive', terminated: 'inactive', cancelled: 'inactive', rejected: 'rejected',
    pending: 'pending', requested: 'pending', draft: 'draft', submitted: 'info',
    in_progress: 'info', interviewed: 'info', reviewed: 'info', screening: 'pending',
    offer: 'info', on_hold: 'pending', open: 'active', filled: 'approved',
  };
  return map[status] ?? 'default';
};
