import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="border-b border-divider pb-4 mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-text-muted mb-3" aria-label="Breadcrumb">
          {breadcrumbs.map((bc, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-4 h-4 mx-1 opacity-50 shrink-0" />}
              {bc.href ? (
                <Link to={bc.href} className="hover:text-primary transition-colors hover:underline">
                  {bc.label}
                </Link>
              ) : (
                <span className="text-text-base font-medium">{bc.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-text-base">{title}</h1>
          {subtitle && <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex items-center justify-start sm:justify-end gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
