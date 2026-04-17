import React, { useState } from 'react'
import { usePlans, useCreatePlan, useUpdatePlanItems, useCourses } from '@/hooks/useLearning'
import { useEmployees } from '@/hooks/useEmployees'
import { PageHeader } from '@/shared/components/PageHeader'
import { Table } from '@/shared/components/Table'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { EmptyState } from '@/shared/components/EmptyState'
import { useToast } from '@/shared/components/Toast'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import {
  useSortable, SortableContext, verticalListSortingStrategy, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { LayoutList, GripVertical, X } from 'lucide-react'

function SortableCourseItem({ item, onRemove, onToggleRequired }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.courseId ?? item.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 bg-surface rounded-md border border-border text-sm">
      <div {...attributes} {...listeners} className="cursor-grab text-text-faint hover:text-text-muted">
        <GripVertical className="w-4 h-4" />
      </div>
      <span className="flex-1 truncate">{item.course?.title ?? item.courseId}</span>
      <label className="flex items-center gap-1 text-xs cursor-pointer">
        <input type="checkbox" checked={item.required} onChange={e => onToggleRequired(e.target.checked)} className="accent-primary" />
        Required
      </label>
      <button onClick={onRemove} className="text-text-faint hover:text-error transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function LearningPlanPage() {
  const { toast } = useToast()
  const { data: plansData, isLoading } = usePlans({})
  const { data: coursesData } = useCourses({})
  const { data: empData } = useEmployees({ limit: 100 })
  const createPlan = useCreatePlan()
  const updateItems = useUpdatePlanItems()

  const plans = plansData?.data ?? []
  const courses = coursesData?.data ?? []
  const employees = empData?.data ?? []

  const [createModal, setCreateModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [planName, setPlanName] = useState('')
  const [assignTo, setAssignTo] = useState('')
  const [planItems, setPlanItems] = useState<any[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')

  const openPlan = (plan: any) => { setSelectedPlan(plan); setPlanItems([...(plan.items ?? [])]) }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setPlanItems(items => {
        const oi = items.findIndex(i => (i.courseId ?? i.id) === active.id)
        const ni = items.findIndex(i => (i.courseId ?? i.id) === over.id)
        return arrayMove(items, oi, ni)
      })
    }
  }

  const addCourse = () => {
    if (!selectedCourseId) return
    const course = courses.find((c: any) => c.id === selectedCourseId)
    if (!planItems.find(i => (i.courseId ?? i.id) === selectedCourseId)) {
      setPlanItems(items => [...items, { courseId: selectedCourseId, course, required: false }])
    }
    setSelectedCourseId('')
  }

  const handleSaveItems = async () => {
    if (!selectedPlan) return
    try {
      await updateItems.mutateAsync({ id: selectedPlan.id, items: planItems.map((it, idx) => ({ courseId: it.courseId ?? it.id, required: it.required, order: idx })) })
      toast({ message: 'Plan saved', variant: 'success' })
    } catch { toast({ message: 'Failed to save', variant: 'error' }) }
  }

  return (
    <div>
      <PageHeader title="Learning Plans" subtitle="Assign curated course programmes" actions={<Button size="sm" onClick={() => setCreateModal(true)}>+ New Plan</Button>} />

      <div className="flex gap-6">
        <div className="flex-1">
          <Table
            columns={[
              { key: 'name', header: 'Name', render: (r: any) => <span className="font-medium">{r.name}</span> },
              { key: 'assignedTo', header: 'Assigned To', render: (r: any) => r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : r.jobTitle ?? 'General' },
              { key: 'itemCount', header: 'Courses', render: (r: any) => (r.items ?? []).length },
              { key: 'actions', header: '', render: (r: any) => <Button size="sm" variant="secondary" onClick={() => openPlan(r)}>View/Edit</Button> },
            ]}
            data={plans}
            isLoading={isLoading}
            emptyState={<EmptyState icon={LayoutList} title="No learning plans" />}
          />
        </div>

        {/* Plan drawer */}
        {selectedPlan && (
          <div className="w-80 flex-shrink-0">
            <div className="card sticky top-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold">{selectedPlan.name}</h3>
                <button onClick={() => setSelectedPlan(null)} className="text-text-muted hover:text-text-base"><X className="w-4 h-4" /></button>
              </div>
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={planItems.map(i => i.courseId ?? i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {planItems.map(item => (
                      <SortableCourseItem
                        key={item.courseId ?? item.id}
                        item={item}
                        onRemove={() => setPlanItems(items => items.filter(i => (i.courseId ?? i.id) !== (item.courseId ?? item.id)))}
                        onToggleRequired={(checked: boolean) => setPlanItems(items => items.map(i => (i.courseId ?? i.id) === (item.courseId ?? item.id) ? { ...i, required: checked } : i))}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <div className="flex gap-2">
                <Select
                  value={selectedCourseId}
                  onChange={e => setSelectedCourseId(e.target.value)}
                  options={[{ value: '', label: 'Add course…' }, ...courses.filter((c: any) => !planItems.find(i => (i.courseId ?? i.id) === c.id)).map((c: any) => ({ value: c.id, label: c.title }))]}
                  className="flex-1"
                />
                <Button size="sm" onClick={addCourse}>+</Button>
              </div>
              <Button className="w-full" onClick={handleSaveItems} loading={updateItems.isPending}>Save Order</Button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="New Learning Plan"
        footer={<div className="flex gap-2"><Button variant="ghost" onClick={() => setCreateModal(false)}>Cancel</Button><Button onClick={async () => { await createPlan.mutateAsync({ name: planName, employeeId: assignTo || undefined }); setCreateModal(false); setPlanName(''); setAssignTo('') }} loading={createPlan.isPending}>Create</Button></div>}
      >
        <div className="space-y-4">
          <Input label="Plan Name" value={planName} onChange={e => setPlanName(e.target.value)} required />
          <Select label="Assign To (optional)" value={assignTo} onChange={e => setAssignTo(e.target.value)} options={[{ value: '', label: 'General (All)' }, ...employees.map((e: any) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))]} />
        </div>
      </Modal>
    </div>
  )
}
