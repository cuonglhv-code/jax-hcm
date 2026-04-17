import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCourse, useEnrolEmployee, useUpdateEnrolmentStatus, useEnrolmentsByEmployee, useEnrolmentsByCourse } from '@/hooks/useLearning'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/shared/components/PageHeader'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Table } from '@/shared/components/Table'
import { Skeleton } from '@/shared/components/Skeleton'
import { useToast } from '@/shared/components/Toast'
import { format } from 'date-fns'

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const isHrManager = user?.role === 'hr_manager' || user?.role === 'super_admin'

  const { data: courseData, isLoading } = useCourse(id)
  const { data: myEnrolmentsData } = useEnrolmentsByEmployee(user?.id)
  const { data: enrolmentsByCourseData } = useEnrolmentsByCourse(id)
  const enrolEmployee = useEnrolEmployee()
  const updateStatus = useUpdateEnrolmentStatus()

  const course = courseData?.data
  const myEnrolment = (myEnrolmentsData?.data ?? []).find((e: any) => e.courseId === id)
  const allEnrolments = enrolmentsByCourseData?.data ?? []

  const handleEnrol = async () => {
    try {
      await enrolEmployee.mutateAsync({ courseId: id, employeeId: user?.id })
      toast({ message: 'Enrolled successfully!', variant: 'success' })
    } catch { toast({ message: 'Failed to enrol', variant: 'error' }) }
  }

  const handleMarkComplete = async () => {
    if (!myEnrolment) return
    try {
      await updateStatus.mutateAsync({ id: myEnrolment.id, status: 'completed' })
      toast({ message: 'Course marked as complete!', variant: 'success' })
    } catch { toast({ message: 'Failed to update', variant: 'error' }) }
  }

  if (isLoading) return <div className="space-y-4"><Skeleton variant="heading" /><Skeleton variant="rect" height="300px" /></div>
  if (!course) return <div className="card text-text-muted">Course not found.</div>

  return (
    <div>
      <PageHeader
        title={course.title}
        breadcrumbs={[{ label: 'Learning', href: '/learning' }, { label: course.title }]}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          {/* Hero */}
          <div className="card">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="neutral">{course.type}</Badge>
              {course.durationHours && <Badge variant="neutral">{course.durationHours}h</Badge>}
              {course.provider && <Badge variant="neutral">{course.provider}</Badge>}
              {course.isMandatory && <Badge variant="warning">Mandatory</Badge>}
            </div>
            <h1 className="font-display text-2xl font-bold text-text-base mb-3">{course.title}</h1>
            {course.description && <p className="text-sm text-text-muted leading-relaxed">{course.description}</p>}
          </div>

          {/* Enrollment action */}
          <div className="card">
            <h2 className="font-medium text-sm text-text-base mb-3">My Enrollment</h2>
            {!myEnrolment && (
              <Button onClick={handleEnrol} loading={enrolEmployee.isPending}>Enrol in this Course</Button>
            )}
            {myEnrolment?.status === 'in_progress' && (
              <div className="flex items-center gap-3">
                <Badge variant="info">In Progress</Badge>
                <Button size="sm" onClick={handleMarkComplete} loading={updateStatus.isPending}>Mark Complete</Button>
              </div>
            )}
            {myEnrolment?.status === 'completed' && (
              <div className="flex items-center gap-3">
                <Badge variant="success">Completed ✓</Badge>
                {myEnrolment.certificateId && (
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/learning/certificates/${myEnrolment.certificateId}`)}>
                    View Certificate
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* All enrolments (hr_manager+) */}
          {isHrManager && allEnrolments.length > 0 && (
            <div className="card">
              <h2 className="font-medium text-sm text-text-base mb-3">All Enrolled Employees</h2>
              <Table
                columns={[
                  { key: 'name', header: 'Employee', render: (r: any) => `${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}` },
                  { key: 'status', header: 'Status', render: (r: any) => <Badge variant={r.status === 'completed' ? 'success' : 'info'}>{r.status}</Badge> },
                  { key: 'enrolledAt', header: 'Enrolled', render: (r: any) => r.enrolledAt ? format(new Date(r.enrolledAt), 'dd MMM yyyy') : '—' },
                ]}
                data={allEnrolments}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
