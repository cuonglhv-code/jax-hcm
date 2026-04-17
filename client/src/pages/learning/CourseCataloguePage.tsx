import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCourses, useCreateCourse, useEnrolmentsByEmployee } from '@/hooks/useLearning'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/shared/components/PageHeader'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { EmptyState } from '@/shared/components/EmptyState'
import { useToast } from '@/shared/components/Toast'
import { BookOpen } from 'lucide-react'

export default function CourseCataloguePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const isHrManager = user?.role === 'hr_manager' || user?.role === 'super_admin'

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [mandatoryOnly, setMandatoryOnly] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'internal', description: '', durationHours: '', provider: '', isMandatory: false })

  const { data, isLoading } = useCourses({ search: search || undefined, type: typeFilter || undefined, isMandatory: mandatoryOnly || undefined })
  const { data: enrolmentsData } = useEnrolmentsByEmployee(user?.id)
  const createCourse = useCreateCourse()

  const courses = data?.data ?? []
  const enrolments = enrolmentsData?.data ?? []

  const getEnrolment = (courseId: string) => enrolments.find((e: any) => e.courseId === courseId)

  const handleCreate = async () => {
    try {
      await createCourse.mutateAsync({ ...form, durationHours: form.durationHours ? parseInt(form.durationHours) : undefined })
      toast({ message: 'Course created', variant: 'success' })
      setAddModalOpen(false)
    } catch { toast({ message: 'Failed to create course', variant: 'error' }) }
  }

  return (
    <div>
      <PageHeader
        title="Course Catalogue"
        subtitle="Browse and enrol in training courses"
        actions={isHrManager ? <Button size="sm" onClick={() => setAddModalOpen(true)}>+ Add Course</Button> : undefined}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Input placeholder="Search courses…" value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
        <Select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          options={[{ value: '', label: 'All Types' }, { value: 'internal', label: 'Internal' }, { value: 'external', label: 'External' }]}
          className="w-36"
        />
        <label className="flex items-center gap-2 text-sm cursor-pointer bg-surface-offset px-3 rounded-md border border-border">
          <input type="checkbox" checked={mandatoryOnly} onChange={e => setMandatoryOnly(e.target.checked)} className="accent-primary" />
          Mandatory only
        </label>
      </div>

      {isLoading ? (
        <div className="text-text-muted text-sm">Loading courses…</div>
      ) : courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses found" description="Try different filters or add a new course." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course: any) => {
            const enrolment = getEnrolment(course.id)
            return (
              <div key={course.id} className="card relative flex flex-col" onClick={() => navigate(`/learning/courses/${course.id}`)} style={{ cursor: 'pointer' }}>
                {course.isMandatory && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="warning">Mandatory</Badge>
                  </div>
                )}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral">{course.type}</Badge>
                    {course.durationHours && <span className="text-xs text-text-muted">{course.durationHours}h</span>}
                  </div>
                </div>
                <h3 className="font-display font-bold text-base text-text-base mb-1">{course.title}</h3>
                {course.provider && <div className="text-xs text-text-muted mb-2">{course.provider}</div>}
                {course.description && (
                  <p className="text-sm text-text-muted mb-3 line-clamp-2">{course.description}</p>
                )}
                <div className="mt-auto" onClick={e => e.stopPropagation()}>
                  {!enrolment && (
                    <Button size="sm" variant="secondary" className="w-full" onClick={() => navigate(`/learning/courses/${course.id}`)}>
                      View & Enrol
                    </Button>
                  )}
                  {enrolment?.status === 'in_progress' && (
                    <Badge variant="info">In Progress</Badge>
                  )}
                  {enrolment?.status === 'completed' && (
                    <Badge variant="success">Completed ✓</Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Course"
        footer={<div className="flex gap-2"><Button variant="ghost" onClick={() => setAddModalOpen(false)}>Cancel</Button><Button onClick={handleCreate} loading={createCourse.isPending}>Create</Button></div>}
      >
        <div className="space-y-4">
          <Input label="Course Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} options={[{ value: 'internal', label: 'Internal' }, { value: 'external', label: 'External' }]} />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" rows={2} className="w-full px-3 py-2 text-sm bg-surface-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Duration (hours)" type="number" value={form.durationHours} onChange={e => setForm(f => ({ ...f, durationHours: e.target.value }))} />
            <Input label="Provider" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isMandatory} onChange={e => setForm(f => ({ ...f, isMandatory: e.target.checked }))} className="accent-primary" />
            Mandatory Training
          </label>
        </div>
      </Modal>
    </div>
  )
}
