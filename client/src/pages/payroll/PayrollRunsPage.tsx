import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { usePayrollRuns, useCreatePayrollRun } from '@/hooks/usePayroll'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/shared/components/PageHeader'
import { Table } from '@/shared/components/Table'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { DatePicker } from '@/shared/components/DatePicker'
import { useToast } from '@/shared/components/Toast'
import { EmptyState } from '@/shared/components/EmptyState'
import { ClipboardList } from 'lucide-react'

const STATUS_BADGE: Record<string, 'neutral' | 'info' | 'warning' | 'success'> = {
  draft: 'neutral', reviewed: 'info', approved: 'warning', paid: 'success',
}

export default function PayrollRunsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const isHrManager = user?.role === 'hr_manager' || user?.role === 'super_admin'

  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [runName, setRunName] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')

  const { data, isLoading } = usePayrollRuns({ page, limit: 20 })
  const createRun = useCreatePayrollRun()

  const runs = data?.data ?? []
  const meta = data?.meta

  const handleCreateRun = async () => {
    try {
      await createRun.mutateAsync({ name: runName, periodStart, periodEnd })
      toast({ message: 'Payroll run created', variant: 'success' })
      setModalOpen(false)
      setRunName(''); setPeriodStart(''); setPeriodEnd('')
    } catch {
      toast({ message: 'Failed to create run', variant: 'error' })
    }
  }

  const columns = [
    { key: 'name', header: 'Name', render: (r: any) => <span className="font-medium">{r.name}</span> },
    {
      key: 'period', header: 'Period',
      render: (r: any) => `${r.periodStart ? format(new Date(r.periodStart), 'dd MMM yyyy') : '—'} – ${r.periodEnd ? format(new Date(r.periodEnd), 'dd MMM yyyy') : '—'}`,
    },
    { key: 'status', header: 'Status', render: (r: any) => <Badge variant={STATUS_BADGE[r.status] ?? 'neutral'}>{r.status}</Badge> },
    { key: 'employeeCount', header: 'Employees' },
    { key: 'totalGross', header: 'Gross', render: (r: any) => r.totalGross ? `$${Number(r.totalGross).toLocaleString()}` : '—' },
    { key: 'totalNet', header: 'Net', render: (r: any) => r.totalNet ? `$${Number(r.totalNet).toLocaleString()}` : '—' },
    { key: 'createdAt', header: 'Created', render: (r: any) => r.createdAt ? format(new Date(r.createdAt), 'dd MMM yyyy') : '—' },
    {
      key: 'actions', header: '',
      render: (r: any) => <Button size="sm" variant="secondary" onClick={() => navigate(`/payroll/runs/${r.id}`)}>View Details</Button>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Payroll Runs"
        actions={isHrManager ? <Button size="sm" onClick={() => setModalOpen(true)}>+ New Run</Button> : undefined}
      />

      <Table
        columns={columns}
        data={runs}
        isLoading={isLoading}
        emptyState={<EmptyState icon={ClipboardList} title="No payroll runs yet" />}
        pagination={meta ? { page: meta.page, limit: meta.limit, total: meta.total, totalPages: meta.totalPages, onPageChange: setPage } : undefined}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Payroll Run"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateRun} loading={createRun.isPending}>Create</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Run Name" placeholder="e.g. May 2026 Payroll" value={runName} onChange={e => setRunName(e.target.value)} required />
          <DatePicker label="Period" isRange startDate={periodStart} endDate={periodEnd} onRangeChange={(s, e) => { setPeriodStart(s); setPeriodEnd(e) }} required />
        </div>
      </Modal>
    </div>
  )
}
