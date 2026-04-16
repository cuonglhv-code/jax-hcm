import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';
import { Button } from '../../../components/Button';
import { Badge, statusVariant } from '../../../components/Badge';

export function GoalsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => api.get('/performance/goals').then(r => r.data.data),
  });

  const goals = data ?? [];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Goals & OKRs</h1>
        <Button size="sm" icon={<Plus className="size-4" />}>New Goal</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal: Record<string, unknown>) => (
            <div key={goal.id as string} className="glass-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={statusVariant(goal.status as string)} dot>{String(goal.status).replace('_', ' ')}</Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{goal.objective as string}</h3>
                  {goal.description && (
                    <p className="text-sm text-gray-400 mt-1">{goal.description as string}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-brand-600">{goal.progress as number}%</div>
                  {goal.due_date && (
                    <div className="text-xs text-gray-400">Due {new Date(goal.due_date as string).toLocaleDateString('en-GB')}</div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                <div
                  className="h-full rounded-full bg-gradient-brand transition-all duration-500"
                  style={{ width: `${goal.progress as number}%` }}
                />
              </div>

              {/* Key Results */}
              {Array.isArray(goal.keyResults) && goal.keyResults.length > 0 && (
                <div className="space-y-1.5">
                  {(goal.keyResults as Array<{ id: string; description: string; completed_at?: string }>).map((kr) => (
                    <div key={kr.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle2 className={`size-4 ${kr.completed_at ? 'text-emerald-500' : 'text-gray-300'}`} />
                      {kr.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {!goals.length && (
            <div className="text-center text-gray-400 py-16">No goals set yet</div>
          )}
        </div>
      )}
    </div>
  );
}
