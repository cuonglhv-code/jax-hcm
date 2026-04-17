import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { usePayrollRun, useRunPayslips, useAdvancePayrollRun } from '@/hooks/usePayroll'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/shared/components/PageHeader'
import { Table } from '@/shared/components/Table'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { KpiCard } from '@/shared/components/KpiCard'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { Skeleton } from '@/shared/components/Skeleton'
import { useToast } from '@/shared/components/Toast'

const STATUS_BADGE: Record<string, 'neutral' | 'info' | 'warning' | 'success'> = {
  draft: 'neutral', reviewed: 'info', approved: 'warning', paid: 'success',
}

const NEXT_ACTION: Record<string, { label: string; confirm: string }> = {
  draft: { label: 'Mark as Reviewed', confirm: 'Mark this run as Reviewed?' },
  reviewed: { label: 'Approve Run', confirm: 'Approve this payroll run?' },
  approved: { label: 'Mark as Paid', confirm: 'Mark this run as Paid?' },
}

export default function PayrollRunDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const isHrManager = user?.role === 'hr_manager' || user?.role === 'super_admin'

  const [page, setPage] = useState(1)
  const [confirmAdvance, setConfirmAdvance] = useState(false)

  const { data: runData, isLoading } = usePayrollRun(id)
  const { data: payslipsData, isLoading: loadingPayslips } = useRunPayslips(id, { page, limit: 20 })
  const advance = useAdvancePayrollRun()

  const run = runData?.data
  const payslips = payslipsData?.data ?? []
  const meta = payslipsData?.meta
  const nextAction = run?.status ? NEXT_ACTION[run.status] : null

  const handleAdvance = async () => {
    if (!id) return
    await advance.mutateAsync(id)
    toast({ message: 'Run advanced', variant: 'success' })
  }

  if (isLoading) return <div className="space-y-4"><Skeleton variant="heading" /><Skeleton variant="rect" height="300px" /></div>
  if (!run) return <div className="card text-text-muted">Payroll run not found.</div>

  const columns = [
    { key: 'employee', header: 'Employee', render: (r: any) => `${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}` },
    { key: 'grossPay', header: 'Gross', render: (r: any) => r.grossPay ? `$${Number(r.grossPay).toLocaleString()}` : '—' },
    { key: 'allowancesTotal', header: 'Allowances', render: (r: any) => r.allowancesTotal ? `+$${Number(r.allowancesTotal).toLocaleString()}` : '—' },
    { key: 'deductionsTotal', header: 'Deductions', render: (r: any) => r.deductionsTotal ? `-$${Number(r.deductionsTotal).toLocaleString()}` : '—' },
    { key: 'taxAmount', header: 'Tax', render: (r: any) => r.taxAmount ? `-$${Number(r.taxAmount).toLocaleString()}` : '—' },
    { key: 'netPay', header: 'Net Pay', render: (r: any) => <span className="font-medium text-primary">{r.netPay ? `$${Number(r.netPay).toLocaleString()}` : '—'}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={run.name}
        subtitle={`${run.periodStart ? format(new Date(run.periodStart), 'dd MMM') : ''} – ${run.periodEnd ? format(new Date(run.periodEnd), 'dd MMM yyyy') : ''}`}
        breadcrumbs={[{ label: 'Payroll', href: '/payroll' }, { label: 'Runs', href: '/payroll/runs' }, { label: run.name }]}
        actions={
          <div className="flex items-center gap-3">
            <Badge variant={STATUS_BADGE[run.status] ?? 'neutral'}>{run.status}</Badge>
            {isHrManager && run.status !== 'paid' && nextAction && (
              <Button onClick={() => setConfirmAdvance(true)}>{nextAction.label}</Button>
            )}
            {run.status === 'paid' && <Badge variant="success">Payroll Paid ✓</Badge>}
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Gross" value={run.totalGross ? `$${Number(run.totalGross).toLocaleString()}` : '—'} />
        <KpiCard label="Total Net" value={run.totalNet ? `$${Number(run.totalNet).toLocaleString()}` : '—'} />
        <KpiCard label="Employees" value={run.employeeCount ?? '—'} />
        <KpiCard label="Period" value={run.periodStart ? format(new Date(run.periodStart), 'MMM yyyy') : '—'} />
      </div>

      <div className="card">
        <h2 className="font-display font-bold text-base mb-4">Payslips</h2>
        <Table
          columns={columns}
          data={payslips}
          isLoading={loadingPayslips}
          pagination={meta ? { page: meta.page, limit: meta.limit, total: meta.total, totalPages: meta.totalPages, onPageChange: setPage } : undefined}
        />
      </div>

      <ConfirmDialog
        isOpen={confirmAdvance}
        onClose={() => setConfirmAdvance(false)}
        onConfirm={handleAdvance}
        title={nextAction?.label ?? 'Advance Run'}
        message={nextAction?.confirm ?? 'Are you sure?'}
        confirmLabel="Confirm"
        variant="primary"
      />
    </div>
  )
}
