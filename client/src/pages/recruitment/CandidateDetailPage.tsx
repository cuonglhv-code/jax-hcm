import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCandidate, useApplicationsByCandidate } from '@/hooks/useRecruitment'
import { PageHeader } from '@/shared/components/PageHeader'
import { Avatar } from '@/shared/components/Avatar'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Skeleton } from '@/shared/components/Skeleton'
import { PDFPreviewModal } from '@/shared/components/PDFPreviewModal'
import { format } from 'date-fns'
import { FileText } from 'lucide-react'

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: candData, isLoading } = useCandidate(id)
  const { data: appsData } = useApplicationsByCandidate(id)
  const candidate = candData?.data
  const applications = appsData?.data ?? []
  
  const [previewOfferId, setPreviewOfferId] = useState<string | null>(null)

  if (isLoading) return <div className="space-y-4"><Skeleton variant="heading" /><Skeleton variant="rect" height="300px" /></div>
  if (!candidate) return <div className="card text-text-muted">Candidate not found.</div>

  return (
    <div>
      <PageHeader
        title={candidate.name}
        breadcrumbs={[{ label: 'Recruitment', href: '/recruitment' }, { label: candidate.name }]}
        actions={<Button variant="ghost" onClick={() => navigate(-1)}>← Back</Button>}
      />
      <div className="card max-w-2xl space-y-4">
        <div className="flex items-center gap-4">
          <Avatar name={candidate.name} size="lg" />
          <div>
            <h2 className="font-display text-lg font-bold">{candidate.name}</h2>
            <div className="text-sm text-text-muted">{candidate.email}</div>
            {candidate.phone && <div className="text-sm text-text-muted">{candidate.phone}</div>}
          </div>
        </div>
        <div>
          <h3 className="font-medium text-sm text-text-base mb-3">Applications</h3>
          <div className="space-y-2">
            {applications.map((app: any) => (
              <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-surface-offset rounded-lg text-sm gap-3">
                <div>
                  <div className="font-medium">{app.requisition_title ?? 'Unknown Position'}</div>
                  <div className="text-text-muted text-xs">{app.appliedAt ? format(new Date(app.appliedAt), 'dd MMM yyyy') : ''}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="info">{app.stage}</Badge>
                  {app.offer_id && (
                    <Button 
                      size="xs" 
                      variant="secondary" 
                      onClick={() => setPreviewOfferId(app.offer_id)}
                      icon={<FileText className="w-3 h-3" />}
                    >
                      Offer Letter
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PDFPreviewModal
        isOpen={!!previewOfferId}
        onClose={() => setPreviewOfferId(null)}
        title={`Offer Letter - ${candidate.name}`}
        pdfUrl={previewOfferId ? `/recruitment/offers/${previewOfferId}/pdf` : null}
        filename={`offer-${candidate.name.replace(/\s+/g, '-').toLowerCase()}.pdf`}
      />
    </div>
  )
}

