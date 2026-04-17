import React, { useState } from 'react'
import { useCycles, useCreateCycle, useActivateCycle } from '@/hooks/usePerformance'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/shared/components/PageHeader'
import { Table } from '@/shared/components/Table'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { EmptyState } from '@/shared/components/EmptyState'
import { useToast } from '@/shared/components/Toast'
import { Star } from 'lucide-react'
import { format } from 'date-fns'

export default function AppraisalCyclesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const isHrManager = user?.role === 'hr_manager' || user?.role === 'super_admin'

  const [modalOpen, setModalOpen] = useState(false)
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', isActive: false })

  const { data, isLoading } = useCycles({})
  const createCycle = useCreateCycle()
  const activateCycle = useActivateCycle()
  const cycles = data?.data ?? []

  const handleCreate = async () => {
    try {
      await createCycle.mutateAsync(form)
      toast({ message: 'Cycle created', variant: 'success' })
      setModalOpen(false); setForm({ name: '', startDate: '', endDate: '', isActive: false })
    } catch { toast({ message: 'Failed to create cycle', variant: 'error' }) }
  }

  const columns = [
    { key: 'name', header: 'Name', render: (r: any) => <span className="font-medium">{r.name}</span> },
    { key: 'startDate', header: 'Start Date', render: (r: any) => r.startDate ? format(new Date(r.startDate), 'dd MMM yyyy') : '—' },
    { key: 'endDate', header: 'End Date', render: (r: any) => r.endDate ? format(new Date(r.endDate), 'dd MMM yyyy') : '—' },
    { key: 'isActive', header: 'Status', render: (r: any) => r.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="neutral">Inactive</Badge> },
    {
      key: 'actions', header: '',
      render: (r: any) => isHrManager && !r.isActive ? (
        <Button size="sm" onClick={() => setActivatingId(r.id)}>Activate</Button>
      ) : null,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Appraisal Cycles"
        subtitle="Manage performance review cycles"
        actions={isHrManager ? <Button size="sm" onClick={() => setModalOpen(true)}>+ New Cycle</Button> : undefined}
      />

      <Table columns={columns} data={cycles} isLoading={isLoading} emptyState={<EmptyState icon={Star} title="No appraisal cycles" />} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Appraisal Cycle"
        footer={<div className="flex gap-2"><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleCreate} loading={createCycle.isPending}>Create</Button></div>}
      >
        <div className="space-y-4">
          <Input label="Cycle Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="Start Date" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required />
          <Input label="End Date" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} required />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-primary" />
            Set as Active Cycle
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!activatingId}
        onClose={() => setActivatingId(null)}
        onConfirm={async () => { await activateCycle.mutateAsync(activatingId!); setActivatingId(null); toast({ message: 'Cycle activated', variant: 'success' }) }}
        title="Activate Cycle"
        message="Activating this cycle will deactivate any currently active cycle. Continue?"
        confirmLabel="Activate"
        variant="primary"
      />
    </div>
  )
}
