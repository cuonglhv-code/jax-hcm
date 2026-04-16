export type AppraisalStatus = 'draft' | 'submitted' | 'reviewed' | 'acknowledged'
export type RatingType = 'numeric' | 'descriptive'

export interface AppraisalCycle {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AppraisalQuestion {
  id: string
  formId: string
  text: string
  ratingType: RatingType
  options?: string[]
  order: number
}

export interface Appraisal {
  id: string
  cycleId: string
  employeeId: string
  managerId: string
  status: AppraisalStatus
  selfSubmittedAt?: string
  managerSubmittedAt?: string
  acknowledgedAt?: string
  createdAt: string
  updatedAt: string
}

export interface AppraisalResponse {
  id: string
  appraisalId: string
  questionId: string
  responderId: string
  responderRole: 'self' | 'manager'
  ratingValue?: number
  textValue?: string
  createdAt: string
}

export interface Goal {
  id: string
  employeeId: string
  cycleId?: string
  title: string
  description?: string
  completionPercentage: number
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface KeyResult {
  id: string
  goalId: string
  title: string
  targetValue: number
  currentValue: number
  unit?: string
  createdAt: string
  updatedAt: string
}
