export type PayrollRunStatus = 'draft' | 'reviewed' | 'approved' | 'paid'
export type PayFrequency = 'monthly' | 'bi_weekly' | 'weekly'

export interface SalaryRecord {
  id: string
  employeeId: string
  baseSalary: number
  currency: string
  payFrequency: PayFrequency
  effectiveDate: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

export interface Allowance {
  id: string
  employeeId?: string
  name: string
  amount: number
  isPercentage: boolean
  isGlobal: boolean
  createdAt: string
}

export interface Deduction {
  id: string
  employeeId?: string
  name: string
  amount: number
  isPercentage: boolean
  isGlobal: boolean
  createdAt: string
}

export interface TaxRule {
  id: string
  name: string
  jurisdiction: string
  minIncome: number
  maxIncome?: number
  rate: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PayrollRun {
  id: string
  name: string
  periodStart: string
  periodEnd: string
  status: PayrollRunStatus
  totalGross: number
  totalNet: number
  employeeCount: number
  approvedById?: string
  approvedAt?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
}

export interface Payslip {
  id: string
  payrollRunId: string
  employeeId: string
  grossPay: number
  totalAllowances: number
  totalDeductions: number
  taxAmount: number
  netPay: number
  currency: string
  periodStart: string
  periodEnd: string
  generatedAt: string
}
