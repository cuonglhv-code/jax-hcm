import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Calendar } from 'lucide-react';
import api from '../../../services/api';
import { Button } from '../../../components/Button';
import { Badge, statusVariant } from '../../../components/Badge';

export function RequisitionsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['requisitions'],
    queryFn: () => api.get('/recruitment/requisitions').then(r => r.data.data),
  });

  const reqs = data ?? [];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recruitment</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{reqs.length} open requisitions</p>
        </div>
        <Button size="sm" icon={<Plus className="size-4" />}>New Requisition</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reqs.map((req: Record<string, string>) => (
            <div key={req.id}
              onClick={() => navigate(`/recruitment/${req.id}/pipeline`)}
              className="glass-card p-5 hover:shadow-card-hover cursor-pointer transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <Badge variant={statusVariant(req.status)} dot>{req.status}</Badge>
                <Button variant="ghost" size="xs" onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/recruitment/${req.id}/pipeline`); }}>
                  View Pipeline
                </Button>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{req.title}</h3>
              <p className="text-sm text-gray-400 mb-4">{req.department_name}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  {req.filled_count}/{req.headcount} filled
                </span>
                {req.closing_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    Closes {new Date(req.closing_date).toLocaleDateString('en-GB')}
                  </span>
                )}
              </div>
            </div>
          ))}
          {!reqs.length && (
            <div className="col-span-3 text-center text-gray-400 py-16">No open requisitions</div>
          )}
        </div>
      )}
    </div>
  );
}
