import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Target } from 'lucide-react';
import api from '../../../services/api';
import { Button } from '../../../components/Button';
import { Badge, statusVariant } from '../../../components/Badge';

export function AppraisalCyclesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['appraisal-cycles'],
    queryFn: () => api.get('/performance/cycles').then(r => r.data.data),
  });

  const cycles = data ?? [];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Performance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Appraisal cycles and goals</p>
        </div>
        <Button size="sm" icon={<Plus className="size-4" />}>New Cycle</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {cycles.map((cycle: Record<string, string>) => (
            <div key={cycle.id} className="glass-card p-5 flex items-center gap-4">
              <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shrink-0">
                <Target className="size-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{cycle.name}</h3>
                  {cycle.is_active === 'true' || cycle.is_active ? (
                    <Badge variant="active" dot>Active</Badge>
                  ) : (
                    <Badge variant="inactive">Inactive</Badge>
                  )}
                  <Badge variant="info">{cycle.frequency}</Badge>
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(cycle.start_date).toLocaleDateString('en-GB')} —{' '}
                  {new Date(cycle.end_date).toLocaleDateString('en-GB')}
                </div>
              </div>
              <div className="text-right text-xs text-gray-400">
                <div>Self deadline: {new Date(cycle.self_assessment_deadline).toLocaleDateString('en-GB')}</div>
                <div>Manager deadline: {new Date(cycle.manager_review_deadline).toLocaleDateString('en-GB')}</div>
              </div>
              <Button variant="outline" size="sm">View Appraisals</Button>
            </div>
          ))}
          {!cycles.length && (
            <div className="text-center text-gray-400 py-16">No appraisal cycles configured yet</div>
          )}
        </div>
      )}
    </div>
  );
}
