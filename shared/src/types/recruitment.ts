export type CandidateStage =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'

export type RequisitionStatus = 'open' | 'closed' | 'on_hold'

export interface JobRequisition {
  id: string
  title: string
  departmentId: string
  headcount: number
  description?: string
  closingDate?: string
  status: RequisitionStatus
  createdById: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface Candidate {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  resumeUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Application {
  id: string
  candidateId: string
  requisitionId: string
  stage: CandidateStage
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Interview {
  id: string
  applicationId: string
  scheduledAt: string
  interviewerId: string
  notes?: string
  outcome?: 'pass' | 'fail' | 'pending'
  createdAt: string
  updatedAt: string
}

export interface OfferLetter {
  id: string
  applicationId: string
  employeeId?: string
  salary: number
  currency: string
  startDate: string
  expiryDate?: string
  status: 'draft' | 'sent' | 'accepted' | 'declined'
  createdAt: string
  updatedAt: string
}

export interface OnboardingChecklist {
  id: string
  employeeId: string
  createdAt: string
}

export interface OnboardingTask {
  id: string
  checklistId: string
  title: string
  description?: string
  dueDate?: string
  completedAt?: string
  assignedToId?: string
}
