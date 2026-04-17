import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:py-16 text-center w-full">
      {Icon && (
        <div className="mb-4">
          <Icon className="w-12 h-12 text-text-faint flex-shrink-0" />
        </div>
      )}
      <h3 className="text-base font-medium text-text-base mb-1">{title}</h3>
      {description && <p className="text-sm text-text-muted max-w-sm mb-6">{description}</p>}
      {action && <div className={`${!description ? 'mt-4' : ''}`}>{action}</div>}
    </div>
  );
}
