import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useEnrolmentsByEmployee, useUpdateEnrolmentStatus, useMandatoryTrainingStatus } from '@/hooks/useLearning'
import { PageHeader } from '@/shared/components/PageHeader'
import { Tabs } from '@/shared/components/Tabs'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { EmptyState } from '@/shared/components/EmptyState'
import { useToast } from '@/shared/components/Toast'
import { PDFPreviewModal } from '@/shared/components/PDFPreviewModal'
import { format } from 'date-fns'
import { GraduationCap } from 'lucide-react'

const MANDATORY_BADGE: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  current: 'success', expiring_soon: 'warning', overdue: 'error', not_started: 'neutral',
}

export default function MyLearningPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('in_progress')
  
  const [previewCertId, setPreviewCertId] = useState<string | null>(null)
  const [previewCertTitle, setPreviewCertTitle] = useState<string>('')

  const { data: inProgressData } = useEnrolmentsByEmployee(user?.id, 'in_progress')
  const { data: completedData } = useEnrolmentsByEmployee(user?.id, 'completed')
  const { data: mandatoryData } = useMandatoryTrainingStatus(user?.id)
  const updateStatus = useUpdateEnrolmentStatus()

  const inProgress = inProgressData?.data ?? []
  const completed = completedData?.data ?? []
  const mandatory = mandatoryData?.data ?? []

  const tabs = [
    { id: 'in_progress', label: `In Progress (${inProgress.length})` },
    { id: 'completed', label: `Completed (${completed.length})` },
    { id: 'mandatory', label: 'Mandatory' },
  ]

  return (
    <div>
      <PageHeader title="My Learning" subtitle="Your personal learning journey" />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
        {activeTab === 'in_progress' && (
          <div className="space-y-3">
            {inProgress.length === 0 ? (
              <EmptyState icon={GraduationCap} title="No courses in progress" description="Browse the catalogue to start a course." />
            ) : (
              inProgress.map((e: any) => (
                <div key={e.id} className="card flex items-center justify-between">
                  <div>
                    <div className="font-medium">{e.course?.title ?? '—'}</div>
                    <div className="text-xs text-text-muted">Started {e.enrolledAt ? format(new Date(e.enrolledAt), 'dd MMM yyyy') : '—'}</div>
                  </div>
                  <Button size="sm" onClick={async () => { await updateStatus.mutateAsync({ id: e.id, status: 'completed' }); toast({ message: 'Marked complete!', variant: 'success' }) }}>
                    Mark Complete
                  </Button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="space-y-3">
            {completed.length === 0 ? (
              <EmptyState icon={GraduationCap} title="No completed courses yet" />
            ) : (
              completed.map((e: any) => (
                <div key={e.id} className="card flex items-center justify-between">
                  <div>
                    <div className="font-medium">{e.course?.title ?? '—'}</div>
                    <div className="text-xs text-text-muted">Completed {e.completedAt ? format(new Date(e.completedAt), 'dd MMM yyyy') : '—'}</div>
                  </div>
                  {e.certificateId && (
                    <Button size="sm" variant="secondary" onClick={() => { setPreviewCertId(e.certificateId); setPreviewCertTitle(e.course?.title || 'Course'); }}>
                      View Certificate
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'mandatory' && (
          <div className="space-y-3">
            {mandatory.length === 0 ? (
              <EmptyState icon={GraduationCap} title="No mandatory training assigned" />
            ) : (
              mandatory.map((item: any) => (
                <div key={item.courseId} className="card flex items-center justify-between">
                  <div>
                    <div className="font-medium">{item.course?.title ?? '—'}</div>
                    {item.expiresAt && <div className="text-xs text-text-muted">Expires {format(new Date(item.expiresAt), 'dd MMM yyyy')}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={MANDATORY_BADGE[item.status] ?? 'neutral'}>{item.status?.replace('_', ' ')}</Badge>
                    {(item.status === 'not_started' || item.status === 'overdue') && (
                      <Button size="sm" onClick={() => navigate(`/learning/courses/${item.courseId}`)}>Enrol</Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Tabs>

      <PDFPreviewModal
        isOpen={!!previewCertId}
        onClose={() => setPreviewCertId(null)}
        title={`Certificate - ${previewCertTitle}`}
        pdfUrl={previewCertId ? `/learning/certificates/${previewCertId}/pdf` : null}
        filename={`certificate-${previewCertTitle.replace(/\s+/g, '-').toLowerCase()}.pdf`}
      />
    </div>
  )
}

