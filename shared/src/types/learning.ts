export type EnrolmentStatus = 'enrolled' | 'in_progress' | 'completed' | 'withdrawn'
export type CourseType = 'internal' | 'external'

export interface Course {
  id: string
  title: string
  description?: string
  type: CourseType
  provider?: string
  durationHours?: number
  isMandatory: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CourseEnrolment {
  id: string
  courseId: string
  employeeId: string
  status: EnrolmentStatus
  enrolledAt: string
  startedAt?: string
  completedAt?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface LearningPlan {
  id: string
  name: string
  assignedToEmployeeId?: string
  assignedToJobTitleId?: string
  createdById: string
  createdAt: string
  updatedAt: string
}

export interface LearningPlanItem {
  id: string
  planId: string
  courseId: string
  order: number
  isRequired: boolean
  createdAt: string
}

export interface TrainingCertificate {
  id: string
  enrolmentId: string
  employeeId: string
  courseId: string
  certificateNumber: string
  issuedAt: string
  expiresAt?: string
}

export interface MandatoryTraining {
  id: string
  courseId: string
  jobTitleId?: string
  departmentId?: string
  renewalPeriodDays?: number
  createdAt: string
  updatedAt: string
}
