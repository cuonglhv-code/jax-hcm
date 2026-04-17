import React, { useState } from 'react'
import { format } from 'date-fns'
import { useLeaveRequests, useReviewLeaveRequest, useEntitlements, useCreateEntitlement, useLeaveTypes, useCreateLeaveType, useUpdateLeaveType, usePublicHolidays, useCreatePublicHoliday, useDeletePublicHoliday } from '@/hooks/useLeave'
import { useEmployees } from '@/hooks/useEmployees'
import { Tabs } from '@/shared/components/Tabs'
import { Table } from '@/shared/components/Table'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { PageHeader } from '@/shared/components/PageHeader'
import { useToast } from '@/shared/components/Toast'

const STATUS_BADGE: Record<string, 'warning' | 'success' | 'error' | 'neutral'> = {
  pending: 'warning', approved: 'success', rejected: 'error', cancelled: 'neutral',
}

export default function LeaveAdminPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('pending')
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [notes, setNotes] = useState('')
  const [entitlementModal, setEntitlementModal] = useState(false)
  const [leaveTypeModal, setLeaveTypeModal] = useState(false)

  const { data: pendingData, isLoading } = useLeaveRequests({ status: 'pending', limit: 50 })
  const { data: empData } = useEmployees({ limit: 100 })
  const { data: typesData } = useLeaveTypes()
  const { data: phData } = usePublicHolidays()

  const reviewLeave = useReviewLeaveRequest()
  const createEntitlement = useCreateEntitlement()
  const createLeaveType = useCreateLeaveType()
  const createPH = useCreatePublicHoliday()
  const deletePH = useDeletePublicHoliday()

  const requests = pendingData?.data ?? []
  const employees = empData?.data ?? []
  const leaveTypes = typesData?.data ?? []
  const holidays = phData?.data ?? []

  const [entForm, setEntForm] = useState({ employeeId: '', leaveTypeId: '', year: String(new Date().getFullYear()), totalDays: '', carryOverDays: '0' })
  const [ltForm, setLtForm] = useState({ name: '', isPaid: true, defaultDays: '0', allowCarryOver: false, maxCarryOverDays: '0' })
  const [phForm, setPhForm] = useState({ name: '', date: '', region: '' })

  const handleReview = async () => {
    if (!reviewingId) return
    await reviewLeave.mutateAsync({ id: reviewingId, action: reviewAction, notes })
    toast({ message: `Request ${reviewAction}d`, variant: 'success' })
    setReviewingId(null); setNotes('')
  }

  const pendingCols = [
    { key: 'employee', header: 'Employee', render: (r: any) => `${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}` },
    { key: 'type', header: 'Type', render: (r: any) => r.leaveType?.name ?? '—' },
    { key: 'dates', header: 'Dates', render: (r: any) => `${r.startDate ? format(new Date(r.startDate), 'dd MMM') : ''} – ${r.endDate ? format(new Date(r.endDate), 'dd MMM yyyy') : ''}` },
    { key: 'days', header: 'Days' },
    { key: 'status', header: 'Status', render: (r: any) => <Badge variant={STATUS_BADGE[r.status] ?? 'neutral'}>{r.status}</Badge> },
    {
      key: 'actions', header: '',
      render: (r: any) => r.status === 'pending' && (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { setReviewingId(r.id); setReviewAction('approve') }}>Approve</Button>
          <Button size="sm" variant="danger" onClick={() => { setReviewingId(r.id); setReviewAction('reject') }}>Reject</Button>
        </div>
      ),
    },
  ]

  const tabs = [
    { id: 'pending', label: 'Pending Requests' },
    { id: 'entitlements', label: 'Entitlements' },
    { id: 'leave-types', label: 'Leave Types' },
    { id: 'holidays', label: 'Public Holidays' },
  ]

  return (
    <div>
      <PageHeader title="Leave Admin" subtitle="Manage leave requests and settings" />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
        {activeTab === 'pending' && (
          <Table columns={pendingCols} data={requests} isLoading={isLoading} />
        )}

        {activeTab === 'entitlements' && (
          <div className="space-y-4">
            <Button size="sm" onClick={() => setEntitlementModal(true)}>+ Add Entitlement</Button>
            <div className="text-sm text-text-muted">Entitlements manage per-employee leave allocations by year.</div>
          </div>
        )}

        {activeTab === 'leave-types' && (
          <div className="space-y-4">
            <Button size="sm" onClick={() => setLeaveTypeModal(true)}>+ Add Leave Type</Button>
            <Table
              columns={[
                { key: 'name', header: 'Name' },
                { key: 'isPaid', header: 'Paid', render: (r: any) => r.isPaid ? 'Yes' : 'No' },
                { key: 'defaultDays', header: 'Default Days' },
                { key: 'allowCarryOver', header: 'Carry Over', render: (r: any) => r.allowCarryOver ? 'Yes' : 'No' },
              ]}
              data={leaveTypes}
            />
          </div>
        )}

        {activeTab === 'holidays' && (
          <div className="space-y-4">
            <div className="flex items-end gap-3">
              <Input label="Name" value={phForm.name} onChange={e => setPhForm(f => ({ ...f, name: e.target.value }))} />
              <Input label="Date" type="date" value={phForm.date} onChange={e => setPhForm(f => ({ ...f, date: e.target.value }))} />
              <Input label="Region" value={phForm.region} onChange={e => setPhForm(f => ({ ...f, region: e.target.value }))} />
              <Button onClick={async () => { await createPH.mutateAsync(phForm); setPhForm({ name: '', date: '', region: '' }) }}>Add</Button>
            </div>
            <Table
              columns={[
                { key: 'name', header: 'Name' },
                { key: 'date', header: 'Date', render: (r: any) => r.date ? format(new Date(r.date), 'dd MMM yyyy') : '—' },
                { key: 'region', header: 'Region' },
                { key: 'actions', header: '', render: (r: any) => <Button size="sm" variant="danger" onClick={() => deletePH.mutate(r.id)}>Delete</Button> },
              ]}
              data={holidays}
            />
          </div>
        )}
      </Tabs>

      {/* Review confirm */}
      <ConfirmDialog
        isOpen={!!reviewingId}
        onClose={() => { setReviewingId(null); setNotes('') }}
        onConfirm={handleReview}
        title={`${reviewAction === 'approve' ? 'Approve' : 'Reject'} Leave Request`}
        message={
          <div className="space-y-2">
            <p>{reviewAction === 'approve' ? 'Approve this leave request?' : 'Reject this leave request?'}</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className="w-full px-3 py-2 text-sm bg-surface-2 border border-border rounded-md focus:outline-none" />
          </div>
        }
        confirmLabel={reviewAction === 'approve' ? 'Approve' : 'Reject'}
        variant={reviewAction === 'approve' ? 'primary' : 'danger'}
      />

      {/* Entitlement Modal */}
      <Modal isOpen={entitlementModal} onClose={() => setEntitlementModal(false)} title="Add Entitlement"
        footer={<div className="flex gap-2"><Button variant="ghost" onClick={() => setEntitlementModal(false)}>Cancel</Button><Button onClick={async () => { await createEntitlement.mutateAsync({ ...entForm, totalDays: parseInt(entForm.totalDays), carryOverDays: parseInt(entForm.carryOverDays), year: parseInt(entForm.year) }); setEntitlementModal(false) }}>Save</Button></div>}
      >
        <div className="space-y-3">
          <Select label="Employee" value={entForm.employeeId} onChange={e => setEntForm(f => ({ ...f, employeeId: e.target.value }))} options={[{ value: '', label: 'Select…' }, ...employees.map((e: any) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))]} />
          <Select label="Leave Type" value={entForm.leaveTypeId} onChange={e => setEntForm(f => ({ ...f, leaveTypeId: e.target.value }))} options={[{ value: '', label: 'Select…' }, ...leaveTypes.map((t: any) => ({ value: t.id, label: t.name }))]} />
          <Input label="Year" type="number" value={entForm.year} onChange={e => setEntForm(f => ({ ...f, year: e.target.value }))} />
          <Input label="Total Days" type="number" value={entForm.totalDays} onChange={e => setEntForm(f => ({ ...f, totalDays: e.target.value }))} />
          <Input label="Carry Over Days" type="number" value={entForm.carryOverDays} onChange={e => setEntForm(f => ({ ...f, carryOverDays: e.target.value }))} />
        </div>
      </Modal>

      {/* Leave Type Modal */}
      <Modal isOpen={leaveTypeModal} onClose={() => setLeaveTypeModal(false)} title="Add Leave Type"
        footer={<div className="flex gap-2"><Button variant="ghost" onClick={() => setLeaveTypeModal(false)}>Cancel</Button><Button onClick={async () => { await createLeaveType.mutateAsync({ ...ltForm, defaultDays: parseInt(ltForm.defaultDays), maxCarryOverDays: parseInt(ltForm.maxCarryOverDays) }); setLeaveTypeModal(false) }}>Save</Button></div>}
      >
        <div className="space-y-3">
          <Input label="Name" value={ltForm.name} onChange={e => setLtForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Default Days" type="number" value={ltForm.defaultDays} onChange={e => setLtForm(f => ({ ...f, defaultDays: e.target.value }))} />
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={ltForm.isPaid} onChange={e => setLtForm(f => ({ ...f, isPaid: e.target.checked }))} className="accent-primary" />Paid</label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={ltForm.allowCarryOver} onChange={e => setLtForm(f => ({ ...f, allowCarryOver: e.target.checked }))} className="accent-primary" />Allow Carry Over</label>
          </div>
        </div>
      </Modal>
    </div>
  )
}
