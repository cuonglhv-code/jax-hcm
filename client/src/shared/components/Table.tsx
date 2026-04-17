import React, { ReactNode } from 'react';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { ArrowUp, ArrowDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
}

export interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyState?: ReactNode;
  pagination?: PaginationProps;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  isLoading,
  emptyState,
  pagination,
  onSort,
  sortKey,
  sortDirection
}: TableProps<T>) {
  
  const handleSort = (key: string) => {
    if (!onSort) return;
    if (sortKey === key) {
      onSort(key, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(key, 'asc');
    }
  };

  return (
    <div className="w-full flex flex-col">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm text-text-base border-collapse">
          <thead className="bg-surface-2 border-b border-divider text-text-muted sticky top-0 z-10 font-medium">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  style={{ width: col.width }}
                  className={`px-4 py-3 whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none hover:text-text-base' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-divider bg-surface">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((_, colIndex) => (
                    <td key={colIndex} className="px-4 py-4">
                      <Skeleton variant="text" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-text-muted">
                  {emptyState || <EmptyState title="No data found" />}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-surface-offset transition-colors">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-4 py-3">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && data.length > 0 && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between py-4 text-sm text-text-muted">
          <div>
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 rounded hover:bg-surface-offset disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex bg-surface-2 rounded overflow-hidden shadow-sm border border-border">
              {Array.from({ length: pagination.totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`px-3 py-1 text-sm border-r border-divider last:border-r-0 hover:bg-surface-offset transition-colors ${pagination.page === i + 1 ? 'bg-primary text-white hover:bg-primary' : ''}`}
                  onClick={() => pagination.onPageChange(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 rounded hover:bg-surface-offset disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
