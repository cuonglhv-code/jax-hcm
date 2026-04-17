import React, { useState } from 'react'
import { useOnboardingChecklist, useUpdateTaskCompletion } from '@/hooks/useRecruitment'
import { useEmployees } from '@/hooks/useEmployees'
import { PageHeader } from '@/shared/components/PageHeader'
import { Input } from '@/shared/components/Input'
import { EmptyState } from '@/shared/components/EmptyState'
import { useToast } from '@/shared/components/Toast'
import { SquareCheckBig, CheckCircle2, Circle } from 'lucide-react'
import { format } from 'date-fns'

export default function OnboardingPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null)

  const { data: empData } = useEmployees({ search, limit: 20 })
  const employees = empData?.data ?? []

  const { data: checklistData, isLoading } = useOnboardingChecklist(selectedEmpId ?? undefined)
  const updateTask = useUpdateTaskCompletion()
  const tasks = checklistData?.data ?? []

  const completedCount = tasks.filter((t: any) => t.completed).length
  const totalCount = tasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const selectedEmp = employees.find((e: any) => e.id === selectedEmpId)

  const handleToggle = async (taskId: string, completed: boolean) => {
    try {
      await updateTask.mutateAsync({ taskId, completed })
    } catch { toast({ message: 'Failed to update task', variant: 'error' }) }
  }

  return (
    <div>
      <PageHeader title="Onboarding" subtitle="Track new employee onboarding progress" />
      <div className="max-w-2xl space-y-6">
        <div>
          <Input
            label="Search Employee"
            placeholder="Type name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && employees.length > 0 && !selectedEmpId && (
            <div className="mt-2 card p-0 overflow-hidden">
              {employees.map((emp: any) => (
                <button
                  key={emp.id}
                  className="w-full text-left px-4 py-3 hover:bg-surface-offset transition-colors text-sm border-b border-divider last:border-0"
                  onClick={() => { setSelectedEmpId(emp.id); setSearch(`${emp.firstName} ${emp.lastName}`) }}
                >
                  {emp.firstName} {emp.lastName} — <span className="text-text-muted">{emp.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedEmpId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display font-bold text-lg">{selectedEmp ? `${selectedEmp.firstName} ${selectedEmp.lastName}` : ''} — Onboarding Checklist</h2>
              <button className="text-xs text-text-muted hover:text-primary" onClick={() => { setSelectedEmpId(null); setSearch('') }}>× Clear</button>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm text-text-muted mb-1">
                <span>Progress</span>
                <span>{completedCount}/{totalCount} tasks</span>
              </div>
              <div className="w-full bg-surface-offset rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {isLoading ? (
              <div className="text-text-muted text-sm">Loading tasks…</div>
            ) : tasks.length === 0 ? (
              <EmptyState icon={SquareCheckBig} title="No checklist found" description="This employee doesn't have an onboarding checklist yet." />
            ) : (
              <div className="space-y-2">
                {tasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-4 card cursor-pointer transition-colors hover:bg-surface-offset"
                    onClick={() => handleToggle(task.id, !task.completed)}
                  >
                    {task.completed
                      ? <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                      : <Circle className="w-5 h-5 text-text-faint flex-shrink-0" />
                    }
                    <div className="flex-1 overflow-hidden">
                      <div className={`text-sm font-medium ${task.completed ? 'line-through text-text-muted' : 'text-text-base'}`}>
                        {task.title}
                      </div>
                      {task.completed && task.completedAt && (
                        <div className="text-xs text-text-faint">{format(new Date(task.completedAt), 'dd MMM yyyy')}</div>
                      )}
                      {!task.completed && <div className="text-xs text-warning">Pending</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
