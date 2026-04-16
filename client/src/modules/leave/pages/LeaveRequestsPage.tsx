import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { Button } from '../../../components/Button';
import { Table, Pagination } from '../../../components/Table';
import { Badge, statusVariant } from '../../../components/Badge';
import { useAuth } from '../../../contexts/AuthContext';

export function LeaveRequestsPage() {
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['leave-requests', page],
    queryFn: () => api.get('/leave/requests', { params: { page, limit: 20 } }).then(r => r.data),
    placeholderData: prev => prev,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/leave/requests/${id}/status`, { status }),
    onSuccess: (_, vars) => {
      toast.success(`Leave ${vars.status}`);
      qc.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });

  const canReview = ['super_admin', 'hr_manager', 'line_manager'].includes(user?.role ?? '');

  const columns = [
    { key: 'employee_name', header: 'Employee' },
    { key: 'leave_type_name', header: 'Type', render: (r: Record<string, string>) => (
      <span className="flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: r.leave_type_color }} />
        {r.leave_type_name}
      </span>
    )},
    { key: 'dates', header: 'Dates', render: (r: Record<string, string>) =>
      `${new Date(r.start_date).toLocaleDateString('en-GB')} – ${new Date(r.end_date).toLocaleDateString('en-GB')}` },
    { key: 'days_requested', header: 'Days', align: 'center' as const },
    { key: 'status', header: 'Status', render: (r: Record<string, string>) => (
      <Badge variant={statusVariant(r.status)} dot>{r.status}</Badge>
    )},
    ...(canReview ? [{
      key: 'actions', header: '', align: 'right' as const,
      render: (r: { id: string; status: string }) => (
        r.status === 'requested' ? (
          <div className="flex items-center gap-2" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <Button size="xs" variant="secondary"
              loading={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate({ id: r.id, status: 'approved' })}>
              Approve
            </Button>
            <Button size="xs" variant="danger"
              loading={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate({ id: r.id, status: 'rejected' })}>
              Reject
            </Button>
          </div>
        ) : null
      ),
    }] : []),
  ];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Leave Requests</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{data?.meta?.total ?? 0} requests</p>
        </div>
        <Button size="sm" icon={<Plus className="size-4" />}>Request Leave</Button>
      </div>

      <div className="glass-card overflow-hidden">
        <Table columns={columns as never} data={data?.data ?? []} loading={isLoading}
          emptyMessage="No leave requests" />
        {data?.meta && (
          <div className="px-4 pb-4">
            <Pagination {...data.meta} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
