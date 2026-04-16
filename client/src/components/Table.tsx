import React from 'react';
import { clsx } from 'clsx';
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function Table<T extends { id: string }>({
  columns,
  data,
  loading = false,
  onRowClick,
  emptyMessage = 'No data found',
  className,
}: TableProps<T>) {
  return (
    <div className={clsx('overflow-x-auto rounded-xl border border-gray-100 dark:border-surface-dark-border', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-surface-dark-border">
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={clsx(
                  'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  !col.align && 'text-left',
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-surface-dark-border">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="skeleton h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={clsx(
                  'bg-white dark:bg-surface-dark-card transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-brand-50/50 dark:hover:bg-brand-950/30',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={clsx(
                      'px-4 py-3 text-gray-700 dark:text-gray-300',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                    )}
                  >
                    {col.render
                      ? col.render(row, idx)
                      : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return (
    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mt-4">
      <span>Showing {start}–{end} of {total}</span>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
        >
          <ChevronUp className="size-4 rotate-[-90deg]" />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = i + Math.max(1, page - 2);
          if (p > totalPages) return null;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={clsx(
                'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                p === page
                  ? 'bg-brand-600 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800',
              )}
            >
              {p}
            </button>
          );
        })}
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
        >
          <ChevronDown className="size-4 rotate-[-90deg]" />
        </button>
      </div>
    </div>
  );
}
