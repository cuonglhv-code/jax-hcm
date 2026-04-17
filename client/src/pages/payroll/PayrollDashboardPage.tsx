import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePayrollRuns, useAllowances, useDeductions, useCreateAllowance, useDeleteAllowance, useCreateDeduction, useDeleteDeduction, useAdvancePayrollRun } from '@/hooks/usePayroll'
import { useEmployees } from '@/hooks/useEmployees'
import { PageHeader } from '@/shared/components/PageHeader'
import { KpiCard } from '@/shared/components/KpiCard'
import { Table } from '@/shared/components/Table'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { useToast } from '@/shared/components/Toast'
import { Wallet } from 'lucide-react'

const STATUS_BADGE: Record<string, 'neutral' | 'info' | 'warning' | 'success'> = {
  draft: 'neutral', reviewed: 'info', approved: 'warning', paid: 'success',
}

function AllowancesDeductionsModal({ type, onClose }: { type: 'allowances' | 'deductions'; onClose: () => void }) {
  const { toast } = useToast()
  const { data } = type === 'allowances' ? useAllowances() : useDeductions()
  const createFn = type === 'allowances' ? useCreateAllowance() : useCreateDeduction()
  const deleteFn = type === 'allowances' ? useDeleteAllowance() : useDeleteDeduction()
  const { data: empData } = useEmployees({ limit: 100 })
  const employees = empData?.data ?? []
  const items = data?.data ?? []

  const [name, setName] = useState(''); const [amount, setAmount] = useState(''); const [isPercent, setIsPercent] = useState(false)
  const [isGlobal, setIsGlobal] = useState(true); const [empId, setEmpId] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const endpoint = type === 'allowances' ? 'allowances' : 'deductions'

  const handleAdd = async () => {
    try {
      await createFn.mutateAsync({ name, amount: parseFloat(amount), isPercentage: isPercent, isGlobal, employeeId: isGlobal ? undefined : empId || undefined })
      toast({ message: `${type === 'allowances' ? 'Allowance' : 'Deduction'} added`, variant: 'success' })
      setName(''); setAmount(''); setIsPercent(false); setIsGlobal(true); setEmpId('')
    } catch { toast({ message: 'Failed', variant: 'error' }) }
  }

  return (
    <Modal isOpen onClose={onClose} title={type === 'allowances' ? 'Manage Allowances' : 'Manage Deductions'} size="lg">
      <div className="space-y-4">
        <Table
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'amount', header: 'Amount', render: (r: any) => r.isPercentage ? `${r.amount}%` : `$${r.amount}` },
            { key: 'type', header: 'Type', render: (r: any) => r.isGlobal ? 'Global' : 'Employee-specific' },
            {
              key: 'actions', header: '',
              render: (r: any) => <Button size="sm" variant="danger" onClick={() => setDeletingId(r.id)}>Delete</Button>,
            },
          ]}
          data={items}
        />
        <hr className="border-divider" />
        <h3 className="font-medium text-sm text-text-base">Add New</h3>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Name" value={name} onChange={e => setName(e.target.value)} required />
          <Input label="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
        </div>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPercent} onChange={e => setIsPercent(e.target.checked)} className="accent-primary" />
            Is Percentage
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isGlobal} onChange={e => setIsGlobal(e.target.checked)} className="accent-primary" />
            Global (applies to all)
          </label>
        </div>
        {!isGlobal && (
          <Select
            label="Employee"
            value={empId}
            onChange={e => setEmpId(e.target.value)}
            options={[{ value: '', label: 'Select employee' }, ...employees.map((e: any) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))]}
          />
        )}
        <Button onClick={handleAdd} loading={createFn.isPending}>Add</Button>
      </div>
      <ConfirmDialog isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={async () => { await deleteFn.mutateAsync(deletingId!); setDeletingId(null) }} title={`Delete ${type === 'allowances' ? 'allowance' : 'deduction'}`} message="This will remove this item." confirmLabel="Delete" variant="danger" />
    </Modal>
  )
}

export default function PayrollDashboardPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data, isLoading } = usePayrollRuns({ limit: 5, sort: '-createdAt' })
  const advanceRun = useAdvancePayrollRun()

  const runs = data?.data ?? []
  const latest = runs[0]
  const pendingCount = runs.filter((r: any) => ['draft', 'reviewed'].includes(r.status)).length

  const [showAllowances, setShowAllowances] = useState(false)
  const [showDeductions, setShowDeductions] = useState(false)

  const runColumns = [
    { key: 'name', header: 'Name' },
    { key: 'period', header: 'Period', render: (r: any) => `${r.periodStart?.substring(0,7)} – ${r.periodEnd?.substring(0,7)}` },
    { key: 'status', header: 'Status', render: (r: any) => <Badge variant={STATUS_BADGE[r.status] ?? 'neutral'}>{r.status}</Badge> },
    { key: 'employeeCount', header: 'Employees' },
    { key: 'totalNet', header: 'Net Total', render: (r: any) => r.totalNet ? `$${Number(r.totalNet).toLocaleString()}` : '—' },
    {
      key: 'actions', header: '',
      render: (r: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => navigate(`/payroll/runs/${r.id}`)}>View</Button>
          {r.status !== 'paid' && (
            <Button size="sm" onClick={async () => { await advanceRun.mutateAsync(r.id); toast({ message: 'Run advanced', variant: 'success' }) }}>Advance</Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Payroll" subtitle="Manage payroll and compensation" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Last Payroll Total" value={latest?.totalNet ? `$${Number(latest.totalNet).toLocaleString()}` : '—'} icon={Wallet} isLoading={isLoading} />
        <KpiCard label="Employees on Payroll" value={latest?.employeeCount ?? '—'} isLoading={isLoading} />
        <KpiCard label="This Month Gross" value={latest?.totalGross ? `$${Number(latest.totalGross).toLocaleString()}` : '—'} isLoading={isLoading} />
        <KpiCard label="Pending Runs" value={pendingCount} isLoading={isLoading} />
      </div>

      <div className="card">
        <h2 className="font-display font-bold text-base mb-4">Recent Payroll Runs</h2>
        <Table columns={runColumns} data={runs} isLoading={isLoading} />
      </div>

      <div className="card">
        <h2 className="font-display font-bold text-base mb-4">Quick Links</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setShowAllowances(true)}>Manage Allowances</Button>
          <Button variant="secondary" onClick={() => setShowDeductions(true)}>Manage Deductions</Button>
          <Button variant="secondary" onClick={() => navigate('/payroll/tax-rules')}>Tax Rules</Button>
        </div>
      </div>

      {showAllowances && <AllowancesDeductionsModal type="allowances" onClose={() => setShowAllowances(false)} />}
      {showDeductions && <AllowancesDeductionsModal type="deductions" onClose={() => setShowDeductions(false)} />}
    </div>
  )
}
