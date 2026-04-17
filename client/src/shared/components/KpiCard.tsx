import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from './Skeleton';

export interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  delta?: string;
  icon?: LucideIcon;
  isLoading?: boolean;
}

export function KpiCard({ label, value, trend, delta, icon: Icon, isLoading }: KpiCardProps) {
  return (
    <div className="card flex items-start justify-between">
      <div className="flex flex-col gap-1">
        <div className="text-sm text-text-muted">{label}</div>
        
        {isLoading ? (
          <>
            <Skeleton variant="heading" width="w-24" className="my-1" />
            <Skeleton variant="text" width="w-32" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold font-display text-text-base">{value}</div>
            
            {(trend || delta) && (
              <div className="flex items-center gap-1 text-sm mt-1">
                {trend === 'up' && <TrendingUp className="w-4 h-4 text-success" />}
                {trend === 'down' && <TrendingDown className="w-4 h-4 text-error" />}
                
                <span className={`
                  ${trend === 'up' ? 'text-success' : ''}
                  ${trend === 'down' ? 'text-error' : ''}
                  ${trend === 'neutral' ? 'text-text-muted' : ''}
                `}>
                  {delta}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
