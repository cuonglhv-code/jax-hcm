import React, { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed',
  secondary: 'bg-surface border border-border text-text-base hover:bg-surface-offset disabled:opacity-50',
  ghost: 'text-text-muted hover:text-text-base hover:bg-surface-offset disabled:opacity-50',
  danger: 'bg-error text-white hover:opacity-90 disabled:opacity-50',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';
  const combinedClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={combinedClasses} disabled={disabled || loading} {...props}>
      {loading ? (
        <svg className="animate-spin w-4 h-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {rightIcon && !loading && rightIcon}
    </button>
  );
}
