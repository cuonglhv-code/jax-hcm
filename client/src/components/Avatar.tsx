import { clsx } from 'clsx';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-xl',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

// Deterministic color from name
function getColor(name: string): string {
  const colors = [
    'from-brand-500 to-brand-700',
    'from-violet-500 to-purple-700',
    'from-emerald-500 to-teal-700',
    'from-amber-500 to-orange-700',
    'from-rose-500 to-pink-700',
    'from-cyan-500 to-blue-700',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx('rounded-full object-cover ring-2 ring-white dark:ring-surface-dark-border', sizeMap[size], className)}
      />
    );
  }
  return (
    <div
      title={name}
      className={clsx(
        'rounded-full flex items-center justify-center font-semibold text-white bg-gradient-to-br shrink-0',
        getColor(name),
        sizeMap[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
