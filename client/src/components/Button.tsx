import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-brand text-white shadow-sm hover:opacity-90 active:scale-95',
  secondary:
    'bg-brand-50 text-brand-700 hover:bg-brand-100 active:scale-95 dark:bg-brand-950 dark:text-brand-400 dark:hover:bg-brand-900',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-sm',
  ghost:
    'text-gray-600 hover:bg-gray-100 active:scale-95 dark:text-gray-400 dark:hover:bg-gray-800',
  outline:
    'border border-gray-300 text-gray-700 hover:bg-gray-50 active:scale-95 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
};

const sizeClasses: Record<Size, string> = {
  xs: 'text-xs px-2 py-1 rounded-md gap-1',
  sm: 'text-sm px-3 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2 rounded-lg gap-2',
  lg: 'text-base px-5 py-2.5 rounded-xl gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        iconPosition === 'left' && icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
      {!loading && iconPosition === 'right' && icon && <span className="shrink-0">{icon}</span>}
    </button>
  );
}
