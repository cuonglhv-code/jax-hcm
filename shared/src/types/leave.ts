export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface LeaveType {
  id: string
  name: string
  isPaid: boolean
  defaultDays: number
  allowCarryOver: boolean
  maxCarryOverDays?: number
  createdAt: string
  updatedAt: string
}

export interface LeaveEntitlement {
  id: string
  employeeId: string
  leaveTypeId: string
  year: number
  totalDays: number
  usedDays: number
  carryOverDays: number
  createdAt: string
  updatedAt: string
}

export interface LeaveRequest {
  id: string
  employeeId: string
  leaveTypeId: string
  startDate: string
  endDate: string
  days: number
  reason?: string
  status: LeaveRequestStatus
  reviewedById?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}

export interface LeaveBalance {
  leaveTypeId: string
  leaveTypeName: string
  totalDays: number
  usedDays: number
  remainingDays: number
}

export interface PublicHoliday {
  id: string
  name: string
  date: string
  region: string
  year: number
  createdAt: string
}

export interface AttendanceLog {
  id: string
  employeeId: string
  date: string
  clockIn?: string
  clockOut?: string
  totalHours?: number
  notes?: string
  createdAt: string
  updatedAt: string
}
