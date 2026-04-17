import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useMandatoryTrainingStatus, useMandatoryTraining, useCreateMandatoryTraining, useDeleteMandatoryTraining, useCourses } from '@/hooks/useLearning'
import { useEmployees } from '@/hooks/useEmployees'
import { PageHeader } from '@/shared/components/PageHeader'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Select } from '@/shared/components/Select'
import { Input } from '@/shared/components/Input'
import { Table } from '@/shared/components/Table'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { useToast } from '@/shared/components/Toast'
import { ShieldCheck } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  current: 'success', expiring_soon: 'warning', overdue: 'error', not_started: 'neutral',
}

export default function MandatoryTrainingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isHrManager = user?.role === 'hr_manager' || user?.role === 'super_admin'

  const [addModal, setAddModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState({ courseId: '', jobTitle: '', departmentId: '', renewalPeriodDays: '' })

  const { data: myData } = useMandatoryTrainingStatus(user?.id)
  const { data: rulesData } = useMandatoryTraining()
  const { data: coursesData } = useCourses({ isMandatory: true })
  const createRule = useCreateMandatoryTraining()
  const deleteRule = useDeleteMandatoryTraining()

  const myTraining = myData?.data ?? []
  const rules = rulesData?.data ?? []
  const courses = coursesData?.data ?? []

  const handleCreate = async () => {
    try {
      await createRule.mutateAsync({ ...form, renewalPeriodDays: form.renewalPeriodDays ? parseInt(form.renewalPeriodDays) : undefined })
      toast({ message: 'Rule created', variant: 'success' })
      setAddModal(false)
    } catch { toast({ message: 'Failed to create rule', variant: 'error' }) }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Mandatory Training" />

      {/* My mandatory training */}
      <div>
        <h2 className="font-display font-bold text-base mb-4">My Required Training</h2>
        {myTraining.length === 0 ? (
          <div className="text-sm text-text-muted">No mandatory training assigned to you.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTraining.map((item: any) => (
              <div key={item.courseId} className="card flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-text-base">{item.course?.title ?? '—'}</h3>
                  <Badge variant={STATUS_BADGE[item.status] ?? 'neutral'}>{item.status?.replace('_', ' ')}</Badge>
                </div>
                {item.expiresAt && (
                  <div className="text-xs text-text-muted">Expires {format(new Date(item.expiresAt), 'dd MMM yyyy')}</div>
                )}
                {(item.status === 'not_started' || item.status === 'overdue') && (
                  <Button size="sm" onClick={() => navigate(`/learning/courses/${item.courseId}`)}>Enrol Now</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HR-only rules section */}
      {isHrManager && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-base">Mandatory Training Rules</h2>
            <Button size="sm" onClick={() => setAddModal(true)}>+ Add Rule</Button>
          </div>
          <Table
            columns={[
              { key: 'course', header: 'Course', render: (r: any) => r.course?.title ?? r.courseId },
              { key: 'jobTitle', header: 'Job Title', render: (r: any) => r.jobTitle ?? 'All' },
              { key: 'department', header: 'Department', render: (r: any) => r.department?.name ?? 'All' },
              { key: 'renewalPeriodDays', header: 'Renewal', render: (r: any) => r.renewalPeriodDays ? `${r.renewalPeriodDays} days` : 'No renewal' },
              { key: 'actions', header: '', render: (r: any) => <Button size="sm" variant="danger" onClick={() => setDeletingId(r.id)}>Delete</Button> },
            ]}
            data={rules}
          />
        </div>
      )}

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Mandatory Training Rule"
        footer={<div className="flex gap-2"><Button variant="ghost" onClick={() => setAddModal(false)}>Cancel</Button><Button onClick={handleCreate} loading={createRule.isPending}>Create</Button></div>}
      >
        <div className="space-y-4">
          <Select label="Course" value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))} options={[{ value: '', label: 'Select course…' }, ...courses.map((c: any) => ({ value: c.id, label: c.title }))]} required />
          <Input label="Job Title (optional)" value={form.jobTitle} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))} placeholder="All job titles" />
          <Input label="Renewal Period (days, optional)" type="number" value={form.renewalPeriodDays} onChange={e => setForm(f => ({ ...f, renewalPeriodDays: e.target.value }))} placeholder="Leave blank for no renewal" />
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={async () => { await deleteRule.mutateAsync(deletingId!); setDeletingId(null) }} title="Delete Rule" message="This will remove this mandatory training rule." confirmLabel="Delete" variant="danger" />
    </div>
  )
}
