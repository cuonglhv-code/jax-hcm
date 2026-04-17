import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useRequisitions, useCreateRequisition, useCloseRequisition } from '@/hooks/useRecruitment'
import { useDepartments } from '@/hooks/useEmployees'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/shared/components/PageHeader'
import { Table } from '@/shared/components/Table'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { EmptyState } from '@/shared/components/EmptyState'
import { useToast } from '@/shared/components/Toast'
import { Briefcase } from 'lucide-react'

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'neutral' | 'error'> = {
  open: 'success', closed: 'neutral', on_hold: 'warning',
}

export default function RequisitionsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const isHrManager = user?.role === 'hr_manager' || user?.role === 'super_admin'

  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', departmentId: '', headcount: '1', description: '', closingDate: '', status: 'open' })

  const { data, isLoading } = useRequisitions({ page, limit: 20 })
  const { data: deptData } = useDepartments()
  const createReq = useCreateRequisition()
  const closeReq = useCloseRequisition()

  const requisitions = data?.data ?? []
  const meta = data?.meta
  const departments = deptData?.data ?? []

  const handleCreate = async () => {
    try {
      await createReq.mutateAsync({ ...form, headcount: parseInt(form.headcount) })
      toast({ message: 'Requisition created', variant: 'success' })
      setModalOpen(false)
    } catch { toast({ message: 'Failed to create', variant: 'error' }) }
  }

  const columns = [
    { key: 'title', header: 'Title', render: (r: any) => <span className="font-medium">{r.title}</span> },
    { key: 'department', header: 'Department', render: (r: any) => r.department?.name ?? '—' },
    { key: 'headcount', header: 'Headcount' },
    { key: 'closingDate', header: 'Closing Date', render: (r: any) => r.closingDate ? format(new Date(r.closingDate), 'dd MMM yyyy') : '—' },
    { key: 'status', header: 'Status', render: (r: any) => <Badge variant={STATUS_BADGE[r.status] ?? 'neutral'}>{r.status}</Badge> },
    {
      key: 'actions', header: '',
      render: (r: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => navigate(`/recruitment/pipeline?requisitionId=${r.id}`)}>View Pipeline</Button>
          {isHrManager && r.status === 'open' && (
            <Button size="sm" variant="danger" onClick={() => setClosingId(r.id)}>Close</Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Requisitions"
        subtitle="Open positions and hiring pipeline"
        actions={isHrManager ? <Button size="sm" onClick={() => setModalOpen(true)}>+ New Requisition</Button> : undefined}
      />

      <Table
        columns={columns}
        data={requisitions}
        isLoading={isLoading}
        emptyState={<EmptyState icon={Briefcase} title="No requisitions yet" />}
        pagination={meta ? { page: meta.page, limit: meta.limit, total: meta.total, totalPages: meta.totalPages, onPageChange: setPage } : undefined}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Requisition"
        footer={<div className="flex gap-2"><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleCreate} loading={createReq.isPending}>Create</Button></div>}
      >
        <div className="space-y-4">
          <Input label="Job Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          <Select label="Department" value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))} options={[{ value: '', label: 'Select department' }, ...departments.map((d: any) => ({ value: d.id, label: d.name }))]} required />
          <Input label="Headcount" type="number" min="1" value={form.headcount} onChange={e => setForm(f => ({ ...f, headcount: e.target.value }))} />
          <Input label="Closing Date" type="date" value={form.closingDate} onChange={e => setForm(f => ({ ...f, closingDate: e.target.value }))} />
          <div>
            <label className="text-sm font-medium text-text-base">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="mt-1 w-full px-3 py-2 text-sm bg-surface-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!closingId} onClose={() => setClosingId(null)} onConfirm={async () => { await closeReq.mutateAsync(closingId!); setClosingId(null); toast({ message: 'Requisition closed', variant: 'info' }) }} title="Close Requisition" message="This will mark the requisition as closed and stop accepting new candidates." confirmLabel="Close" variant="danger" />
    </div>
  )
}
