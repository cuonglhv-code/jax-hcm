import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { Badge, statusVariant } from '../../../components/Badge';
import { Avatar } from '../../../components/Avatar';

const STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

export function CandidatePipelinePage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['candidates', id],
    queryFn: () => api.get('/recruitment/candidates', { params: { requisitionId: id, limit: 100 } }).then(r => r.data.data),
    enabled: !!id,
  });

  const candidates = data ?? [];

  const byStage = STAGES.reduce<Record<string, typeof candidates>>((acc, stage) => {
    acc[stage] = candidates.filter((c: { current_stage: string }) => c.current_stage === stage);
    return acc;
  }, {});

  return (
    <div className="page-container">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Candidate Pipeline</h1>

      {isLoading ? (
        <div className="flex gap-4">
          {STAGES.map(s => <div key={s} className="skeleton h-64 w-48 rounded-xl flex-shrink-0" />)}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div key={stage} className="shrink-0 w-56">
              <div className="flex items-center justify-between mb-3">
                <Badge variant={statusVariant(stage)} dot>{stage}</Badge>
                <span className="text-xs text-gray-400">{byStage[stage].length}</span>
              </div>
              <div className="space-y-2">
                {byStage[stage].map((c: { id: string; first_name: string; last_name: string; email: string; source?: string }) => (
                  <div key={c.id}
                    className="glass-card p-3 hover:shadow-card-hover transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <Avatar name={`${c.first_name} ${c.last_name}`} size="xs" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {c.first_name} {c.last_name}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{c.email}</div>
                      </div>
                    </div>
                    {c.source && (
                      <Badge variant="default" className="text-[10px]">{c.source}</Badge>
                    )}
                  </div>
                ))}
                {!byStage[stage].length && (
                  <div className="text-xs text-gray-300 dark:text-gray-600 text-center py-6 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl">
                    No candidates
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
