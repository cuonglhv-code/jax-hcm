import db from '../../config/database'
import { v4 as uuidv4 } from 'uuid'
import { AppError } from '../../middleware/errorHandler'
import { getPagination, buildMeta } from '../../utils/pagination'
import { Request } from 'express'
import { AuthUser } from '@hcm/shared'

export function calculateTax(
  annualGrossPay: number,
  rules: Array<{
    min_income: string | number
    max_income: string | number | null
    rate: string | number
  }>
): number {
  if (!rules || rules.length === 0) return 0

  // Sort rules by min_income ascending
  const sorted = [...rules]
    .map(r => ({
      min: Number(r.min_income),
      max: r.max_income ? Number(r.max_income) : Infinity,
      rate: Number(r.rate),
    }))
    .sort((a, b) => a.min - b.min)

  let totalTax = 0
  for (const rule of sorted) {
    if (annualGrossPay > rule.min) {
      const taxableAtBand = Math.min(annualGrossPay, rule.max) - rule.min
      totalTax += taxableAtBand * rule.rate
    }
  }
  return totalTax
}

export function calculateTaxMonthly(monthlyGrossPay: number, rules: Array<any>): number {
  // convert monthly to annual, calculate tax, convert back to monthly
  const annualGross = monthlyGrossPay * 12
  const annualTax = calculateTax(annualGross, rules)
  return annualTax / 12
}

function calculateNI(grossPay: number): number {
  const niThreshold = 12570 / 12
  const niUpper = 50270 / 12
  if (grossPay <= niThreshold) return 0
  if (grossPay <= niUpper) return (grossPay - niThreshold) * 0.12
  return (niUpper - niThreshold) * 0.12 + (grossPay - niUpper) * 0.02
}

export const payrollService = {
  async getSalary(employeeId: string) {
    return db('salary_records')
      .where({ employee_id: employeeId })
      .whereNull('deleted_at')
      .whereNull('end_date')
      .orderBy('effective_date', 'desc')
      .first()
  },

  async setSalary(employeeId: string, data: Record<string, unknown>, user: AuthUser) {
    // End previous salary record
    await db('salary_records')
      .where({ employee_id: employeeId })
      .whereNull('end_date')
      .whereNull('deleted_at')
      .update({ end_date: data.effectiveDate, updated_at: new Date() })

    const [record] = await db('salary_records')
      .insert({
        id: uuidv4(),
        employee_id: employeeId,
        base_salary: data.baseSalary,
        currency: data.currency || 'GBP',
        pay_frequency: data.payFrequency || 'monthly',
        effective_date: data.effectiveDate,
        created_by: (user as any).userId || (user as any).id,
      })
      .returning('*')

    // Record compensation history
    const prev = await db('salary_records')
      .where({ employee_id: employeeId })
      .whereNotNull('end_date')
      .orderBy('effective_date', 'desc')
      .first()

    if (prev) {
      await db('compensation_history').insert({
        id: uuidv4(),
        employee_id: employeeId,
        salary_before: prev.base_salary,
        salary_after: data.baseSalary,
        reason: (data.reason as string) || 'Salary update',
        effective_date: data.effectiveDate,
        approved_by: (user as any).userId || (user as any).id,
      })
    }

    return record
  },

  async getCompensationHistory(employeeId: string, req: Request) {
    const { page, limit, offset } = getPagination(req)
    const baseQuery = db('compensation_history').where({ employee_id: employeeId })
    const totalResult = await baseQuery.clone().count('id as count').first()
    const total = Number(totalResult?.count || 0)

    const data = await baseQuery.clone()
      .leftJoin('users', 'compensation_history.approved_by', 'users.id')
      .select('compensation_history.*', 'users.email as approved_by_email')
      .orderBy('effective_date', 'desc')
      .limit(limit)
      .offset(offset)

    return { data, meta: buildMeta(total, page, limit) }
  },

  async getAllowances(employeeId: string) {
    return db('allowances')
      .where(function () {
        this.where({ employee_id: employeeId }).orWhereNull('employee_id')
      })
      .whereNull('deleted_at')
  },

  async addAllowance(employeeId: string | null, data: Record<string, unknown>) {
    const [a] = await db('allowances')
      .insert({
        id: uuidv4(),
        employee_id: employeeId,
        name: data.name,
        amount: data.amount,
        is_percentage: data.isPercentage ?? false,
        recurring: data.recurring ?? true,
      })
      .returning('*')
    return a
  },

  async addDeduction(employeeId: string | null, data: Record<string, unknown>) {
    const [d] = await db('deductions')
      .insert({
        id: uuidv4(),
        employee_id: employeeId,
        name: data.name,
        amount: data.amount,
        is_percentage: data.isPercentage ?? false,
        recurring: data.recurring ?? true,
      })
      .returning('*')
    return d
  },

  async listRuns(req: Request) {
    const { page, limit, offset } = getPagination(req)
    const query = db('payroll_runs')
      .whereNull('deleted_at')
      .join('users', 'payroll_runs.created_by', 'users.id')
      .select('payroll_runs.*', 'users.email as created_by_email')

    const [{ count }] = await query.clone().count('payroll_runs.id as count')
    const data = await query.orderBy('created_at', 'desc').limit(limit).offset(offset)
    return { data, meta: buildMeta(Number(count), page, limit) }
  },

  async createRun(data: Record<string, unknown>, user: AuthUser) {
    const [run] = await db('payroll_runs')
      .insert({
        id: uuidv4(),
        name: data.name,
        period_start: data.periodStart,
        period_end: data.periodEnd,
        status: 'draft',
        created_by: (user as any).userId || (user as any).id,
      })
      .returning('*')

    // Auto-generate payslips for all active employees with salary
    const employees = await db('employees').where({ status: 'active' }).whereNull('deleted_at')

    const employeeIds = employees.map(e => e.id)
    const activeTaxRules = await db('tax_rules').whereNull('deleted_at')

    // Batch fetch ALL salaries, allowances, deductions in parallel
    const [salaries, allowances, deductions] = await Promise.all([
      db('salary_records')
        .whereIn('employee_id', employeeIds)
        .whereNull('end_date')
        .whereNull('deleted_at'),
      db('allowances')
        .where(q => q.whereIn('employee_id', employeeIds).orWhereNull('employee_id'))
        .whereNull('deleted_at'),
      db('deductions')
        .where(q => q.whereIn('employee_id', employeeIds).orWhereNull('employee_id'))
        .whereNull('deleted_at'),
    ])

    // Build Maps for O(1) lookup
    const salaryMap = new Map(salaries.map(s => [s.employee_id, s]))
    const allowanceMap = new Map(allowances.map(a => [a.employee_id, a]))
    const deductionMap = new Map(deductions.map(d => [d.employee_id, d]))

    let totalGross = 0
    let totalNet = 0
    const payslipsToInsert = []

    for (const emp of employees) {
      const salary = salaryMap.get(emp.id)
      if (!salary) continue

      const gross = Number(salary.base_salary)
      const empAllowances = allowanceMap.get(emp.id) ? [allowanceMap.get(emp.id)] : []
      const globalAllowances = allowances.filter(a => !a.employee_id)
      const allAllowances = [...empAllowances, ...globalAllowances].filter(Boolean)

      const empDeductions = deductionMap.get(emp.id) ? [deductionMap.get(emp.id)] : []
      const globalDeductions = deductions.filter(d => !d.employee_id)
      const allDeductions = [...empDeductions, ...globalDeductions].filter(Boolean)

      let totalAllowances = 0
      for (const a of allAllowances) {
        totalAllowances += a.is_percentage ? (gross * Number(a.amount)) / 100 : Number(a.amount)
      }

      let totalDeductions = 0
      for (const d of allDeductions) {
        totalDeductions += d.is_percentage ? (gross * Number(d.amount)) / 100 : Number(d.amount)
      }

      const grossWithAllowances = gross + totalAllowances
      const tax = calculateTaxMonthly(grossWithAllowances, activeTaxRules)
      const ni = calculateNI(grossWithAllowances)
      const net = grossWithAllowances - tax - ni - totalDeductions

      totalGross += grossWithAllowances
      totalNet += net

      payslipsToInsert.push({
        id: uuidv4(),
        payroll_run_id: run.id,
        employee_id: emp.id,
        gross_pay: grossWithAllowances,
        net_pay: net,
        tax,
        national_insurance: ni,
        total_allowances: totalAllowances,
        total_deductions: totalDeductions,
        breakdown: JSON.stringify([
          { label: 'Base Salary', amount: gross, type: 'earning' },
          ...allAllowances.map(a => ({
            label: a.name,
            amount: a.is_percentage ? (gross * Number(a.amount)) / 100 : Number(a.amount),
            type: 'earning',
          })),
          { label: 'Income Tax', amount: tax, type: 'tax' },
          { label: 'National Insurance', amount: ni, type: 'tax' },
          ...allDeductions.map(d => ({
            label: d.name,
            amount: d.is_percentage ? (gross * Number(d.amount)) / 100 : Number(d.amount),
            type: 'deduction',
          })),
        ]),
      })
    }

    // Bulk insert all payslips
    if (payslipsToInsert.length > 0) {
      await db('payslips').insert(payslipsToInsert)
    }

    await db('payroll_runs').where({ id: run.id }).update({
      total_gross: totalGross,
      total_net: totalNet,
      employee_count: employees.length,
    })

    return db('payroll_runs').where({ id: run.id }).first()
  },

  async advanceRunStatus(runId: string, newStatus: string, user: AuthUser) {
    const run = await db('payroll_runs').where({ id: runId }).first()
    if (!run) throw new AppError(404, 'Payroll record not found')

    const allowed: Record<string, string[]> = {
      draft: ['reviewed'],
      reviewed: ['approved'],
      approved: ['paid'],
    }
    if (!allowed[run.status]?.includes(newStatus)) {
      throw new AppError(400, `Cannot transition from ${run.status} to ${newStatus}`)
    }

    const updates: Record<string, unknown> = { status: newStatus, updated_at: new Date() }
    if (newStatus === 'approved') updates.approved_by = (user as any).userId || (user as any).id
    if (newStatus === 'paid') updates.paid_at = new Date()

    const [updated] = await db('payroll_runs').where({ id: runId }).update(updates).returning('*')
    return updated
  },

  async getPayslip(runId: string, employeeId: string) {
    const payslip = await db('payslips')
      .where({ payroll_run_id: runId, employee_id: employeeId })
      .join('employees', 'payslips.employee_id', 'employees.id')
      .join('payroll_runs', 'payslips.payroll_run_id', 'payroll_runs.id')
      .select(
        'payslips.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_number',
        'payroll_runs.period_start',
        'payroll_runs.period_end',
        'payroll_runs.name as run_name'
      )
      .first()
    if (!payslip) throw new AppError(404, 'Payslip not found')
    return payslip
  },

  async getEmployeePayslips(employeeId: string, req: Request) {
    const { page, limit, offset } = getPagination(req)
    const query = db('payslips')
      .where('payslips.employee_id', employeeId)
      .join('payroll_runs', 'payslips.payroll_run_id', 'payroll_runs.id')
      .select(
        'payslips.*',
        'payroll_runs.name as run_name',
        'payroll_runs.period_start',
        'payroll_runs.period_end',
        'payroll_runs.status as run_status'
      )

    const [{ count }] = await query.clone().count('payslips.id as count')
    const data = await query
      .orderBy('payroll_runs.period_start', 'desc')
      .limit(limit)
      .offset(offset)
    return { data, meta: buildMeta(Number(count), page, limit) }
  },

  async getPayslipById(id: string) {
    const payslip = await db('payslips')
      .where('payslips.id', id)
      .join('employees', 'payslips.employee_id', 'employees.id')
      .join('payroll_runs', 'payslips.payroll_run_id', 'payroll_runs.id')
      .leftJoin('job_titles', 'employees.job_title_id', 'job_titles.id')
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .select(
        'payslips.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_number',
        'payroll_runs.period_start',
        'payroll_runs.period_end',
        'payroll_runs.name as run_name',
        'payroll_runs.paid_at',
        'job_titles.title as job_title',
        'departments.name as department'
      )
      .first()
    if (!payslip) throw new AppError(404, 'Payslip not found')
    return payslip
  },

  // Tax Rules
  async listTaxRules(jurisdiction?: string) {
    const query = db('tax_rules').whereNull('deleted_at').orderBy('min_income', 'asc')
    if (jurisdiction) query.where({ jurisdiction })
    return query
  },

  async createTaxRule(data: Record<string, unknown>) {
    const [rule] = await db('tax_rules')
      .insert({
        id: uuidv4(),
        jurisdiction: data.jurisdiction || 'GB',
        min_income: data.minIncome,
        max_income: data.maxIncome ?? null,
        rate: data.rate,
        label: data.label ?? '',
      })
      .returning('*')
    return rule
  },

  async updateTaxRule(id: string, data: Record<string, unknown>) {
    const [rule] = await db('tax_rules')
      .where({ id })
      .update({
        min_income: data.minIncome,
        max_income: data.maxIncome ?? null,
        rate: data.rate,
        label: data.label,
        jurisdiction: data.jurisdiction,
        updated_at: new Date(),
      })
      .returning('*')
    if (!rule) throw new AppError(404, 'Tax rule not found')
    return rule
  },

  async deleteTaxRule(id: string) {
    await db('tax_rules').where({ id }).update({ deleted_at: new Date() })
  },
}
