import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import {
  DndContext, DragEndEvent, DragOverlay, closestCenter,
  useDraggable, useDroppable
} from '@dnd-kit/core'
import { useApplicationsByRequisition, useAdvanceStage, useCreateCandidate, useCreateApplication, useInterviews, useCreateInterview, useCreateOffer, useUpdateOfferStatus, useRequisitions } from '@/hooks/useRecruitment'
import { useEmployees } from '@/hooks/useEmployees'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/shared/components/Avatar'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { EmptyState } from '@/shared/components/EmptyState'
import { useToast } from '@/shared/components/Toast'
import { Kanban, X } from 'lucide-react'

const STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'] as const
type Stage = typeof STAGES[number]

const STAGE_LABELS: Record<Stage, string> = {
  applied: 'Applied', screening: 'Screening', interview: 'Interview',
  offer: 'Offer', hired: 'Hired', rejected: 'Rejected',
}

const STAGE_COLORS: Partial<Record<Stage, string>> = {
  hired: 'color-mix(in srgb, var(--color-success) 10%, transparent)',
  rejected: 'color-mix(in srgb, var(--color-error) 10%, transparent)',
}

function CandidateCard({ app, onClick, isDragging }: { app: any; onClick: () => void; isDragging?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={`card p-3 cursor-pointer hover:shadow-md transition-shadow ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-2">
        <Avatar name={app.candidate?.name ?? '?'} size="sm" />
        <div className="overflow-hidden flex-1">
          <div className="text-sm font-medium text-text-base truncate">{app.candidate?.name}</div>
          <div className="text-xs text-text-muted truncate">{app.candidate?.email}</div>
        </div>
      </div>
      {app.appliedAt && <div className="text-xs text-text-faint mt-2">{format(new Date(app.appliedAt), 'dd MMM yyyy')}</div>}
    </div>
  )
}

function DraggableCard({ app, onClick }: { app: any; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: app.id })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <CandidateCard app={app} onClick={onClick} isDragging={isDragging} />
    </div>
  )
}

function StageColumn({ stage, apps, onCardClick }: { stage: Stage; apps: any[]; onCardClick: (app: any) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  return (
    <div ref={setNodeRef} className="flex flex-col gap-2 min-w-[200px] w-56 flex-shrink-0">
      <div
        className="flex items-center justify-between px-3 py-2 rounded-lg font-medium text-sm"
        style={{ backgroundColor: STAGE_COLORS[stage] ?? 'var(--color-surface-offset)' }}
      >
        <span>{STAGE_LABELS[stage]}</span>
        <Badge variant="neutral">{apps.length}</Badge>
      </div>
      <div
        className={`flex flex-col gap-2 min-h-[200px] rounded-lg p-2 transition-colors ${isOver ? 'bg-primary/5 ring-2 ring-primary/30' : 'bg-surface-offset/50'}`}
      >
        {apps.map(app => (
          <DraggableCard key={app.id} app={app} onClick={() => onCardClick(app)} />
        ))}
        {apps.length === 0 && (
          <div className="text-center text-xs text-text-faint py-6">Drop here</div>
        )}
      </div>
    </div>
  )
}

export default function CandidatePipelinePage() {
  const [params] = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const isHrManager = user?.role === 'hr_manager' || user?.role === 'super_admin'

  const requisitionId = params.get('requisitionId') ?? undefined
  const [selectedReqId, setSelectedReqId] = useState(requisitionId ?? '')
  const [selectedApp, setSelectedApp] = useState<any>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newCandName, setNewCandName] = useState(''); const [newCandEmail, setNewCandEmail] = useState(''); const [newCandPhone, setNewCandPhone] = useState('')

  const { data: reqsData } = useRequisitions({ limit: 100 })
  const { data: appsData } = useApplicationsByRequisition(selectedReqId || undefined)
  const advanceStage = useAdvanceStage()
  const createCandidate = useCreateCandidate()
  const createApplication = useCreateApplication()

  const requisitions = reqsData?.data ?? []
  const apps = appsData?.data ?? []

  const grouped = STAGES.reduce((acc, s) => {
    acc[s] = apps.filter((a: any) => a.stage === s)
    return acc
  }, {} as Record<Stage, any[]>)

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const newStage = over.id as Stage
    const app = apps.find((a: any) => a.id === active.id)
    if (!app || app.stage === newStage) return
    try {
      await advanceStage.mutateAsync({ applicationId: app.id, stage: newStage })
    } catch { toast({ message: 'Failed to move candidate', variant: 'error' }) }
  }

  const handleAddCandidate = async () => {
    try {
      const candRes = await createCandidate.mutateAsync({ name: newCandName, email: newCandEmail, phone: newCandPhone })
      await createApplication.mutateAsync({ candidateId: candRes.data?.id, requisitionId: selectedReqId, stage: 'applied' })
      toast({ message: 'Candidate added', variant: 'success' })
      setAddModalOpen(false); setNewCandName(''); setNewCandEmail(''); setNewCandPhone('')
    } catch { toast({ message: 'Failed to add candidate', variant: 'error' }) }
  }

  if (!selectedReqId) {
    return (
      <div>
        <h1 className="font-display text-xl font-bold mb-4">Candidate Pipeline</h1>
        <div className="card max-w-sm">
          <Select
            label="Select a Requisition"
            value={selectedReqId}
            onChange={e => setSelectedReqId(e.target.value)}
            options={[{ value: '', label: 'Choose requisition…' }, ...requisitions.map((r: any) => ({ value: r.id, label: r.title }))]}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl font-bold">Pipeline</h1>
          <Select
            value={selectedReqId}
            onChange={e => setSelectedReqId(e.target.value)}
            options={requisitions.map((r: any) => ({ value: r.id, label: r.title }))}
            className="w-56"
          />
        </div>
        {isHrManager && <Button size="sm" onClick={() => setAddModalOpen(true)}>+ Add Candidate</Button>}
      </div>

      {apps.length === 0 && !appsData ? (
        <EmptyState icon={Kanban} title="No candidates yet" description="Add candidates to this requisition to see the pipeline." />
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 h-full">
            {STAGES.map(stage => (
              <StageColumn key={stage} stage={stage} apps={grouped[stage]} onCardClick={setSelectedApp} />
            ))}
          </div>
        </DndContext>
      )}

      {/* Candidate slide-over */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedApp(null)} />
          <div className="relative bg-surface w-full max-w-md h-full flex flex-col shadow-md overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-divider">
              <div className="flex items-center gap-3">
                <Avatar name={selectedApp.candidate?.name ?? '?'} />
                <div>
                  <div className="font-medium text-text-base">{selectedApp.candidate?.name}</div>
                  <div className="text-sm text-text-muted">{selectedApp.candidate?.email}</div>
                </div>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-2 text-text-muted hover:bg-surface-offset rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4 flex-1">
              <div>
                <div className="text-sm font-medium text-text-muted mb-1">Current Stage</div>
                <Badge variant="info">{STAGE_LABELS[selectedApp.stage as Stage] ?? selectedApp.stage}</Badge>
              </div>
              {selectedApp.candidate?.phone && (
                <div>
                  <div className="text-sm text-text-muted">Phone</div>
                  <div className="text-sm">{selectedApp.candidate.phone}</div>
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-text-muted mb-2">Applied</div>
                <div className="text-sm">{selectedApp.appliedAt ? format(new Date(selectedApp.appliedAt), 'dd MMM yyyy') : '—'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Candidate"
        footer={<div className="flex gap-2"><Button variant="ghost" onClick={() => setAddModalOpen(false)}>Cancel</Button><Button onClick={handleAddCandidate} loading={createCandidate.isPending || createApplication.isPending}>Add</Button></div>}
      >
        <div className="space-y-4">
          <Input label="Full Name" value={newCandName} onChange={e => setNewCandName(e.target.value)} required />
          <Input label="Email" type="email" value={newCandEmail} onChange={e => setNewCandEmail(e.target.value)} required />
          <Input label="Phone" type="tel" value={newCandPhone} onChange={e => setNewCandPhone(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
