import React, { ReactNode } from 'react';

export interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: ReactNode;
  className?: string;
}

const colorMap = {
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  info: 'var(--color-primary)',
  neutral: 'var(--color-text-muted)',
};

export function Badge({ variant, children, className = '' }: BadgeProps) {
  const color = colorMap[variant];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
        color: color,
      }}
    >
      {children}
    </span>
  );
}
