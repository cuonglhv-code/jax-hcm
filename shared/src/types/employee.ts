export type EmploymentType = 'full_time' | 'part_time' | 'contractor' | 'intern'
export type EmployeeStatus = 'active' | 'inactive' | 'on_leave'

export interface Department {
  id: string
  name: string
  headId?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface JobTitle {
  id: string
  title: string
  departmentId: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  avatarUrl?: string
  departmentId: string
  jobTitleId: string
  managerId?: string
  employmentType: EmploymentType
  status: EmployeeStatus
  hireDate: string
  endDate?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface EmployeeDocument {
  id: string
  employeeId: string
  name: string
  fileUrl: string
  fileType: string
  uploadedAt: string
}

export interface AuditLog {
  id: string
  entityType: string
  entityId: string
  actorId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  createdAt: string
}
