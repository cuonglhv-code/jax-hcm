import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { useEmployee, useEmployeeDocuments, useUploadDocument, useDeleteDocument, useAuditLog } from '@/hooks/useEmployees'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/shared/components/PageHeader'
import { Badge } from '@/shared/components/Badge'
import { Avatar } from '@/shared/components/Avatar'
import { Button } from '@/shared/components/Button'
import { KpiCard } from '@/shared/components/KpiCard'
import { Tabs } from '@/shared/components/Tabs'
import { Table } from '@/shared/components/Table'
import { FileUpload } from '@/shared/components/FileUpload'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { Skeleton } from '@/shared/components/Skeleton'
import { useToast } from '@/shared/components/Toast'
import { useDeleteEmployee } from '@/hooks/useEmployees'

const STATUS_BADGE: Record<string, 'success' | 'neutral' | 'warning'> = {
  active: 'success', inactive: 'neutral', on_leave: 'warning',
}

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const isHrManager = user?.role === 'hr_manager' || user?.role === 'super_admin'

  const [activeTab, setActiveTab] = useState('overview')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: empData, isLoading } = useEmployee(id)
  const { data: docsData } = useEmployeeDocuments(id)
  const { data: auditData } = useAuditLog({ entityId: id })
  const uploadDoc = useUploadDocument()
  const deleteDoc = useDeleteDocument()
  const deleteEmployee = useDeleteEmployee()

  const emp = empData?.data
  const docs = docsData?.data ?? []
  const auditLog = auditData?.data ?? []

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'documents', label: 'Documents' },
    ...(isHrManager ? [{ id: 'audit', label: 'Audit Log' }] : []),
  ]

  const handleDocUpload = async (file: File) => {
    if (!id) return
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', file.name)
    try {
      await uploadDoc.mutateAsync({ id, formData: fd })
      toast({ message: 'Document uploaded', variant: 'success' })
    } catch {
      toast({ message: 'Upload failed', variant: 'error' })
    }
  }

  const handleDelete = async () => {
    if (!id) return
    await deleteEmployee.mutateAsync(id)
    toast({ message: 'Employee deleted', variant: 'success' })
    navigate('/employees')
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton variant="heading" />
        <Skeleton variant="rect" height="200px" />
      </div>
    )
  }
  if (!emp) return <div className="card text-text-muted">Employee not found.</div>

  const fullName = `${emp.firstName} ${emp.lastName}`

  return (
    <div>
      <PageHeader
        title={fullName}
        breadcrumbs={[{ label: 'Employees', href: '/employees' }, { label: fullName }]}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT */}
        <div className="flex-1 min-w-0">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Profile card */}
                <div className="card flex flex-col sm:flex-row items-start gap-4">
                  <Avatar name={fullName} src={emp.avatarUrl} size="lg" />
                  <div className="flex-1">
                    <h2 className="font-display text-lg font-bold text-text-base">{fullName}</h2>
                    <div className="text-sm text-text-muted">{emp.jobTitle}</div>
                    <div className="text-sm text-text-muted">{emp.department?.name}</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant={STATUS_BADGE[emp.status] ?? 'neutral'}>{emp.status?.replace('_', ' ')}</Badge>
                      <Badge variant="neutral">{emp.employmentType}</Badge>
                    </div>
                    {emp.hireDate && (
                      <div className="text-xs text-text-faint mt-2">
                        Hired {format(new Date(emp.hireDate), 'dd MMM yyyy')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact info */}
                <div className="card">
                  <h3 className="font-medium text-sm text-text-base mb-3">Contact Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-text-muted">Email</span>
                      <div className="text-text-base">{emp.email}</div>
                    </div>
                    <div>
                      <span className="text-text-muted">Phone</span>
                      <div className="text-text-base">{emp.phone ?? '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-4">
                  <KpiCard label="Tenure (yrs)" value={emp.hireDate ? Math.floor((Date.now() - new Date(emp.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365)) : '—'} />
                  <KpiCard label="Leave Remaining" value="—" />
                  <KpiCard label="Active Goals" value="—" />
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4">
                {isHrManager && <FileUpload onFileSelect={handleDocUpload} label="Upload Document" maxSizeMB={20} />}
                {docs.length === 0 ? (
                  <div className="text-text-muted text-sm text-center py-8">No documents uploaded yet.</div>
                ) : (
                  <div className="space-y-2">
                    {docs.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 card">
                        <div>
                          <div className="text-sm font-medium text-text-base">{doc.name}</div>
                          <div className="text-xs text-text-muted">{doc.uploadedAt ? format(new Date(doc.uploadedAt), 'dd MMM yyyy') : ''}</div>
                        </div>
                        <div className="flex gap-2">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Download</a>
                          {isHrManager && (
                            <button onClick={() => deleteDoc.mutate({ id: id!, docId: doc.id })} className="text-xs text-error hover:underline">Delete</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'audit' && isHrManager && (
              <Table
                columns={[
                  { key: 'action', header: 'Action' },
                  { key: 'actor', header: 'Actor', render: (r: any) => r.actorEmail ?? '—' },
                  { key: 'createdAt', header: 'When', render: (r: any) => r.createdAt ? format(new Date(r.createdAt), 'dd MMM yyyy HH:mm') : '—' },
                ]}
                data={auditLog}
              />
            )}
          </Tabs>
        </div>

        {/* RIGHT */}
        <div className="lg:w-72 space-y-4 lg:sticky lg:top-4 h-fit">
          {isHrManager && (
            <div className="card space-y-2">
              <h3 className="font-medium text-sm text-text-base mb-3">Quick Actions</h3>
              <Button variant="secondary" className="w-full justify-start" onClick={() => navigate(`/employees/${id}/edit`)}>Edit Profile</Button>
              <Button variant="secondary" className="w-full justify-start" onClick={() => navigate(`/leave?employeeId=${id}`)}>Manage Leave</Button>
              <Button variant="secondary" className="w-full justify-start" onClick={() => navigate(`/payroll?employeeId=${id}`)}>View Payslips</Button>
              <Button variant="danger" className="w-full justify-start" onClick={() => setConfirmDelete(true)}>Delete Employee</Button>
            </div>
          )}

          <div className="card">
            <h3 className="font-medium text-sm text-text-base mb-3">Reporting To</h3>
            {emp.manager ? (
              <div className="flex items-center gap-3">
                <Avatar name={`${emp.manager.firstName} ${emp.manager.lastName}`} size="sm" />
                <div>
                  <div className="text-sm font-medium text-text-base">{emp.manager.firstName} {emp.manager.lastName}</div>
                  <div className="text-xs text-text-muted">{emp.manager.jobTitle}</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted">No manager assigned</p>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message="This will permanently delete this employee record. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
