import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLeaveBalance, useLeaveRequests, useLeaveTypes, useCreateLeaveRequest, useCancelLeaveRequest } from '@/hooks/useLeave'
import { PageHeader } from '@/shared/components/PageHeader'
import { KpiCard } from '@/shared/components/KpiCard'
import { Table } from '@/shared/components/Table'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Select } from '@/shared/components/Select'
import { DatePicker } from '@/shared/components/DatePicker'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { EmptyState } from '@/shared/components/EmptyState'
import { useToast } from '@/shared/components/Toast'
import { CalendarX2 } from 'lucide-react'
import { format, differenceInBusinessDays, parseISO, isValid } from 'date-fns'

const STATUS_BADGE: Record<string, 'warning' | 'success' | 'error' | 'neutral'> = {
  pending: 'warning', approved: 'success', rejected: 'error', cancelled: 'neutral',
}

export default function LeaveRequestPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const year = new Date().getFullYear()

  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' })

  const { data: balanceData } = useLeaveBalance(user?.id, year)
  const { data: typesData } = useLeaveTypes()
  const { data: reqData, isLoading } = useLeaveRequests({ employeeId: user?.id, page, limit: 20 })
  const createReq = useCreateLeaveRequest()
  const cancelReq = useCancelLeaveRequest()

  const balances = balanceData?.data ?? []
  const leaveTypes = typesData?.data ?? []
  const requests = reqData?.data ?? []
  const meta = reqData?.meta

  const workingDays =
    form.startDate && form.endDate && isValid(parseISO(form.startDate)) && isValid(parseISO(form.endDate))
      ? Math.max(0, differenceInBusinessDays(parseISO(form.endDate), parseISO(form.startDate)) + 1)
      : 0

  const handleCreate = async () => {
    try {
      await createReq.mutateAsync(form)
      toast({ message: 'Leave request submitted', variant: 'success' })
      setModalOpen(false); setForm({ leaveTypeId: '', startDate: '', endDate: '', reason: '' })
    } catch { toast({ message: 'Failed to submit request', variant: 'error' }) }
  }

  const columns = [
    { key: 'type', header: 'Type', render: (r: any) => r.leaveType?.name ?? '—' },
    { key: 'startDate', header: 'Start', render: (r: any) => r.startDate ? format(new Date(r.startDate), 'dd MMM yyyy') : '—' },
    { key: 'endDate', header: 'End', render: (r: any) => r.endDate ? format(new Date(r.endDate), 'dd MMM yyyy') : '—' },
    { key: 'days', header: 'Days' },
    { key: 'reason', header: 'Reason', render: (r: any) => <span title={r.reason} className="truncate text-xs max-w-[80px] block">{r.reason ?? '—'}</span> },
    { key: 'status', header: 'Status', render: (r: any) => <Badge variant={STATUS_BADGE[r.status] ?? 'neutral'}>{r.status}</Badge> },
    {
      key: 'actions', header: '',
      render: (r: any) => r.status === 'pending' ? (
        <Button size="sm" variant="danger" onClick={() => setCancelId(r.id)}>Cancel</Button>
      ) : null,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Leave"
        actions={<Button size="sm" onClick={() => setModalOpen(true)}>+ Request Leave</Button>}
      />

      {/* Balance cards */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {balances.map((b: any) => (
          <div key={b.leaveTypeId} className="flex-shrink-0">
            <KpiCard
              label={b.leaveType?.name ?? '—'}
              value={`${b.remainingDays} days`}
              delta={`${b.usedDays} used of ${b.totalDays}`}
            />
          </div>
        ))}
        {balances.length === 0 && <div className="text-text-muted text-sm">No leave balances configured.</div>}
      </div>

      {/* Requests */}
      <div className="card">
        <h2 className="font-display font-bold text-base mb-4">My Requests</h2>
        <Table
          columns={columns}
          data={requests}
          isLoading={isLoading}
          emptyState={<EmptyState icon={CalendarX2} title="No leave requests" />}
          pagination={meta ? { page: meta.page, limit: meta.limit, total: meta.total, totalPages: meta.totalPages, onPageChange: setPage } : undefined}
        />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Request Leave"
        footer={<div className="flex gap-2"><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleCreate} loading={createReq.isPending}>Submit</Button></div>}
      >
        <div className="space-y-4">
          <Select
            label="Leave Type"
            value={form.leaveTypeId}
            onChange={e => setForm(f => ({ ...f, leaveTypeId: e.target.value }))}
            options={[{ value: '', label: 'Select type…' }, ...leaveTypes.map((t: any) => ({ value: t.id, label: t.name }))]}
            required
          />
          <DatePicker label="Dates" isRange startDate={form.startDate} endDate={form.endDate} onRangeChange={(s, e) => setForm(f => ({ ...f, startDate: s, endDate: e }))} required />
          {workingDays > 0 && (
            <div className="text-sm text-text-muted bg-surface-offset px-3 py-2 rounded-md">
              Working Days: <span className="font-medium text-text-base">{workingDays}</span>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-text-base">Reason (optional)</label>
            <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2} className="mt-1 w-full px-3 py-2 text-sm bg-surface-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!cancelId} onClose={() => setCancelId(null)} onConfirm={async () => { await cancelReq.mutateAsync(cancelId!); setCancelId(null); toast({ message: 'Request cancelled', variant: 'info' }) }} title="Cancel Leave Request" message="Are you sure you want to cancel this leave request?" confirmLabel="Cancel Request" variant="danger" />
    </div>
  )
}
