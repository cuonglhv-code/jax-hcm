import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, useCreateKeyResult, useUpdateKeyResult, useDeleteKeyResult, useCycles } from '@/hooks/usePerformance'
import { PageHeader } from '@/shared/components/PageHeader'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { EmptyState } from '@/shared/components/EmptyState'
import { useToast } from '@/shared/components/Toast'
import { Target, Pencil, Trash2, Plus } from 'lucide-react'
import { format } from 'date-fns'

function KeyResultRow({ kr, onUpdate, onDelete }: { kr: any; onUpdate: (data: any) => void; onDelete: () => void }) {
  const [current, setCurrent] = useState(String(kr.currentValue ?? ''))
  return (
    <div className="flex items-center gap-3 text-sm py-1.5 border-b border-divider last:border-0">
      <div className="flex-1">
        <span className="text-text-base">{kr.title}</span>
        {kr.unit && <span className="text-text-muted ml-1">({kr.unit})</span>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={current}
          onChange={e => setCurrent(e.target.value)}
          className="w-16 px-2 py-1 text-xs bg-surface-2 border border-border rounded"
        />
        <span className="text-text-faint text-xs">/ {kr.targetValue}</span>
        <button onClick={() => onUpdate({ id: kr.id, currentValue: parseFloat(current) })} className="text-xs text-primary hover:underline">Save</button>
        <button onClick={onDelete} className="text-xs text-error hover:underline">×</button>
      </div>
    </div>
  )
}

function GoalCard({ goal, onDelete }: { goal: any; onDelete: () => void }) {
  const { toast } = useToast()
  const updateKR = useUpdateKeyResult()
  const deleteKR = useDeleteKeyResult()
  const createKR = useCreateKeyResult()
  const [addingKR, setAddingKR] = useState(false)
  const [krForm, setKRForm] = useState({ title: '', targetValue: '', unit: '' })
  const krs = goal.keyResults ?? []
  const completed = goal.completionPercentage ?? 0

  const handleAddKR = async () => {
    try {
      await createKR.mutateAsync({ goalId: goal.id, ...krForm, targetValue: parseFloat(krForm.targetValue) })
      setKRForm({ title: '', targetValue: '', unit: '' })
      setAddingKR(false)
    } catch { toast({ message: 'Failed to add key result', variant: 'error' }) }
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-text-base">{goal.title}</h3>
          {goal.description && <p className="text-sm text-text-muted mt-0.5">{goal.description}</p>}
          {goal.dueDate && <p className="text-xs text-text-faint mt-1">Due {format(new Date(goal.dueDate), 'dd MMM yyyy')}</p>}
        </div>
        <button onClick={onDelete} className="text-text-muted hover:text-error transition-colors p-1">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div>
        <div className="flex justify-between text-xs text-text-muted mb-1">
          <span>Progress</span><span>{Math.round(completed)}%</span>
        </div>
        <div className="w-full bg-surface-offset rounded-full h-1.5">
          <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${Math.min(completed, 100)}%` }} />
        </div>
      </div>

      <div>
        <div className="text-xs font-medium text-text-muted mb-1">Key Results</div>
        {krs.map((kr: any) => (
          <KeyResultRow
            key={kr.id}
            kr={kr}
            onUpdate={data => updateKR.mutate(data)}
            onDelete={() => deleteKR.mutate(kr.id)}
          />
        ))}
        {addingKR ? (
          <div className="pt-2 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Key result" value={krForm.title} onChange={e => setKRForm(f => ({ ...f, title: e.target.value }))} className="col-span-3" />
              <Input placeholder="Target" type="number" value={krForm.targetValue} onChange={e => setKRForm(f => ({ ...f, targetValue: e.target.value }))} />
              <Input placeholder="Unit (e.g. %)" value={krForm.unit} onChange={e => setKRForm(f => ({ ...f, unit: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddKR} loading={createKR.isPending}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingKR(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingKR(true)} className="text-xs text-primary hover:underline mt-1 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add Key Result
          </button>
        )}
      </div>
    </div>
  )
}

export default function GoalsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { data: cyclesData } = useCycles({})
  const cycles = cyclesData?.data ?? []
  const [selectedCycleId, setSelectedCycleId] = useState(cycles.find((c: any) => c.isActive)?.id ?? '')

  const { data, isLoading } = useGoals(user?.id, selectedCycleId)
  const createGoal = useCreateGoal()
  const deleteGoal = useDeleteGoal()
  const goals = data?.data ?? []

  const [form, setForm] = useState({ title: '', description: '', dueDate: '' })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleCreate = async () => {
    try {
      await createGoal.mutateAsync({ ...form, cycleId: selectedCycleId, employeeId: user?.id })
      toast({ message: 'Goal created', variant: 'success' })
      setForm({ title: '', description: '', dueDate: '' })
    } catch { toast({ message: 'Failed to create goal', variant: 'error' }) }
  }

  return (
    <div>
      <PageHeader title="Goals" subtitle="Track your OKRs and key results" />

      <div className="mb-4 max-w-xs">
        <Select
          label="Cycle"
          value={selectedCycleId}
          onChange={e => setSelectedCycleId(e.target.value)}
          options={[{ value: '', label: 'All cycles' }, ...cycles.map((c: any) => ({ value: c.id, label: c.name }))]}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          {isLoading ? (
            <div className="text-text-muted text-sm">Loading goals…</div>
          ) : goals.length === 0 ? (
            <EmptyState icon={Target} title="No goals yet" description="Create your first goal using the form." />
          ) : (
            goals.map((goal: any) => (
              <GoalCard key={goal.id} goal={goal} onDelete={() => setDeletingId(goal.id)} />
            ))
          )}
        </div>

        <div className="lg:w-64 lg:sticky lg:top-4 h-fit">
          <div className="card space-y-3">
            <h3 className="font-display font-bold text-sm">Add Goal</h3>
            <Input placeholder="Goal title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            <textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-surface-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Input label="Due Date" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            <Button className="w-full" onClick={handleCreate} loading={createGoal.isPending} disabled={!form.title}>Create Goal</Button>
          </div>
        </div>
      </div>

      <ConfirmDialog isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={async () => { await deleteGoal.mutateAsync(deletingId!); setDeletingId(null) }} title="Delete Goal" message="This will permanently delete this goal and all its key results." confirmLabel="Delete" variant="danger" />
    </div>
  )
}
