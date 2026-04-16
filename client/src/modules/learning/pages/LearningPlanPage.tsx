import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckCircle2, Circle } from 'lucide-react';
import api from '../../../services/api';
import { Button } from '../../../components/Button';
import { Badge } from '../../../components/Badge';

export function LearningPlanPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['learning-plans'],
    queryFn: () => api.get('/learning/plans').then(r => r.data.data),
  });

  const plans = data ?? [];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Learning Plans</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Structured training paths</p>
        </div>
        <Button size="sm">New Plan</Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan: Record<string, unknown>) => (
            <div key={plan.id as string} className="glass-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{plan.name as string}</h3>
                  {plan.description && (
                    <p className="text-sm text-gray-400 mt-0.5">{plan.description as string}</p>
                  )}
                  {plan.target_role && (
                    <Badge variant="info" className="mt-2">For: {plan.target_role as string}</Badge>
                  )}
                </div>
                <Button variant="outline" size="sm">Assign</Button>
              </div>

              {/* Courses */}
              {Array.isArray(plan.courses) && plan.courses.length > 0 ? (
                <div className="space-y-2">
                  {(plan.courses as Array<Record<string, unknown>>).map((course, idx) => (
                    <div key={course.id as string}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-surface-dark-border"
                    >
                      <div className="size-6 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xs font-bold text-brand-600 shrink-0">
                        {idx + 1}
                      </div>
                      <BookOpen className="size-4 text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{course.title as string}</div>
                        <div className="text-xs text-gray-400">{course.duration_hours}h · {course.type as string}</div>
                      </div>
                      {course.is_mandatory && <Badge variant="rejected">Mandatory</Badge>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No courses in this plan</p>
              )}
            </div>
          ))}
          {!plans.length && (
            <div className="text-center text-gray-400 py-16">No learning plans created yet</div>
          )}
        </div>
      )}
    </div>
  );
}
