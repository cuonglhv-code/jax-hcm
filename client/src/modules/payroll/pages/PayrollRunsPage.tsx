import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { Button } from '../../../components/Button';
import { Table, Pagination } from '../../../components/Table';
import { Badge, statusVariant } from '../../../components/Badge';
import { Modal } from '../../../components/Modal';

export function PayrollRunsPage() {
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', periodStart: '', periodEnd: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['payroll-runs', page],
    queryFn: () => api.get('/payroll/runs', { params: { page, limit: 20 } }).then(r => r.data),
    placeholderData: prev => prev,
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/payroll/runs', form),
    onSuccess: () => {
      toast.success('Payroll run created');
      setShowCreate(false);
      setForm({ name: '', periodStart: '', periodEnd: '' });
      qc.invalidateQueries({ queryKey: ['payroll-runs'] });
    },
    onError: () => toast.error('Failed to create payroll run'),
  });

  const advanceMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/payroll/runs/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['payroll-runs'] });
    },
  });

  const nextStatus: Record<string, string> = {
    draft: 'reviewed', reviewed: 'approved', approved: 'paid',
  };
  const nextLabel: Record<string, string> = {
    draft: 'Mark Reviewed', reviewed: 'Approve', approved: 'Mark Paid',
  };

  const columns = [
    { key: 'name', header: 'Run Name' },
    { key: 'period_start', header: 'Period', render: (r: Record<string, string>) =>
      `${new Date(r.period_start).toLocaleDateString('en-GB')} – ${new Date(r.period_end).toLocaleDateString('en-GB')}` },
    { key: 'employee_count', header: 'Employees', align: 'center' as const },
    { key: 'total_gross', header: 'Gross', render: (r: Record<string, string>) =>
      `£${Number(r.total_gross).toLocaleString('en-GB', { minimumFractionDigits: 2 })}` },
    { key: 'total_net', header: 'Net', render: (r: Record<string, string>) =>
      `£${Number(r.total_net).toLocaleString('en-GB', { minimumFractionDigits: 2 })}` },
    { key: 'status', header: 'Status', render: (r: Record<string, string>) =>
      <Badge variant={statusVariant(r.status)} dot>{r.status}</Badge> },
    { key: 'actions', header: '', align: 'right' as const,
      render: (r: { id: string; status: string }) => (
        r.status !== 'paid' ? (
          <Button size="xs" variant="secondary" icon={<Play className="size-3" />}
            loading={advanceMutation.isPending}
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); advanceMutation.mutate({ id: r.id, status: nextStatus[r.status] }); }}>
            {nextLabel[r.status]}
          </Button>
        ) : null
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Payroll Runs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage payroll processing cycles</p>
        </div>
        <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setShowCreate(true)}>
          New Run
        </Button>
      </div>

      <div className="glass-card overflow-hidden">
        <Table columns={columns as never} data={data?.data ?? []} loading={isLoading} emptyMessage="No payroll runs yet" />
        {data?.meta && (
          <div className="px-4 pb-4">
            <Pagination {...data.meta} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Payroll Run" size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>Create Run</Button>
          </>
        }
      >
        <div className="space-y-4">
          {['name', 'periodStart', 'periodEnd'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 capitalize">
                {field.replace(/([A-Z])/g, ' $1')}
              </label>
              <input
                type={field === 'name' ? 'text' : 'date'}
                value={form[field as keyof typeof form]}
                onChange={(e) => setForm(f => ({ ...f, [field]: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
