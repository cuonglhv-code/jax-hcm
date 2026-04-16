import db from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../middleware/errorHandler';
import { getPagination, buildMeta } from '../../utils/pagination';
import { Request } from 'express';
import { AuthUser } from '@hcm/shared';

// Simple UK tax calculation hook (configurable in future)
function calculateTax(grossPay: number): number {
  if (grossPay <= 12570 / 12) return 0; // Personal allowance
  if (grossPay <= 50270 / 12) return (grossPay - 12570 / 12) * 0.2;
  return (50270 / 12 - 12570 / 12) * 0.2 + (grossPay - 50270 / 12) * 0.4;
}

function calculateNI(grossPay: number): number {
  const niThreshold = 12570 / 12;
  const niUpper = 50270 / 12;
  if (grossPay <= niThreshold) return 0;
  if (grossPay <= niUpper) return (grossPay - niThreshold) * 0.12;
  return (niUpper - niThreshold) * 0.12 + (grossPay - niUpper) * 0.02;
}

export const payrollService = {
  async getSalary(employeeId: string) {
    return db('salary_records')
      .where({ employee_id: employeeId })
      .whereNull('deleted_at')
      .whereNull('end_date')
      .orderBy('effective_date', 'desc')
      .first();
  },

  async setSalary(employeeId: string, data: Record<string, unknown>, user: AuthUser) {
    // End previous salary record
    await db('salary_records')
      .where({ employee_id: employeeId })
      .whereNull('end_date')
      .whereNull('deleted_at')
      .update({ end_date: data.effectiveDate, updated_at: new Date() });

    const [record] = await db('salary_records').insert({
      id: uuidv4(),
      employee_id: employeeId,
      base_salary: data.baseSalary,
      currency: data.currency || 'GBP',
      pay_frequency: data.payFrequency || 'monthly',
      effective_date: data.effectiveDate,
      created_by: user.id,
    }).returning('*');

    // Record compensation history
    const prev = await db('salary_records')
      .where({ employee_id: employeeId })
      .whereNotNull('end_date')
      .orderBy('effective_date', 'desc')
      .first();

    if (prev) {
      await db('compensation_history').insert({
        id: uuidv4(),
        employee_id: employeeId,
        salary_before: prev.base_salary,
        salary_after: data.baseSalary,
        reason: (data.reason as string) || 'Salary update',
        effective_date: data.effectiveDate,
        approved_by: user.id,
      });
    }

    return record;
  },

  async getCompensationHistory(employeeId: string, req: Request) {
    const { page, limit, offset } = getPagination(req);
    const query = db('compensation_history')
      .where({ employee_id: employeeId })
      .join('users', 'compensation_history.approved_by', 'users.id')
      .select('compensation_history.*', 'users.email as approved_by_email');

    const [{ count }] = await query.clone().count('compensation_history.id as count');
    const data = await query.orderBy('effective_date', 'desc').limit(limit).offset(offset);
    return { data, meta: buildMeta(Number(count), page, limit) };
  },

  async getAllowances(employeeId: string) {
    return db('allowances')
      .where(function () {
        this.where({ employee_id: employeeId }).orWhereNull('employee_id');
      })
      .whereNull('deleted_at');
  },

  async addAllowance(employeeId: string | null, data: Record<string, unknown>) {
    const [a] = await db('allowances').insert({
      id: uuidv4(),
      employee_id: employeeId,
      name: data.name,
      amount: data.amount,
      is_percentage: data.isPercentage ?? false,
      recurring: data.recurring ?? true,
    }).returning('*');
    return a;
  },

  async addDeduction(employeeId: string | null, data: Record<string, unknown>) {
    const [d] = await db('deductions').insert({
      id: uuidv4(),
      employee_id: employeeId,
      name: data.name,
      amount: data.amount,
      is_percentage: data.isPercentage ?? false,
      recurring: data.recurring ?? true,
    }).returning('*');
    return d;
  },

  async listRuns(req: Request) {
    const { page, limit, offset } = getPagination(req);
    const query = db('payroll_runs')
      .whereNull('deleted_at')
      .join('users', 'payroll_runs.created_by', 'users.id')
      .select('payroll_runs.*', 'users.email as created_by_email');

    const [{ count }] = await query.clone().count('payroll_runs.id as count');
    const data = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);
    return { data, meta: buildMeta(Number(count), page, limit) };
  },

  async createRun(data: Record<string, unknown>, user: AuthUser) {
    const [run] = await db('payroll_runs').insert({
      id: uuidv4(),
      name: data.name,
      period_start: data.periodStart,
      period_end: data.periodEnd,
      status: 'draft',
      created_by: user.id,
    }).returning('*');

    // Auto-generate payslips for all active employees with salary
    const employees = await db('employees')
      .where({ status: 'active' })
      .whereNull('deleted_at');

    let totalGross = 0;
    let totalNet = 0;

    for (const emp of employees) {
      const salary = await payrollService.getSalary(emp.id);
      if (!salary) continue;

      const gross = Number(salary.base_salary);
      const allowances = await payrollService.getAllowances(emp.id);
      const deductions = await db('deductions')
        .where(function () {
          this.where({ employee_id: emp.id }).orWhereNull('employee_id');
        })
        .whereNull('deleted_at');

      let totalAllowances = 0;
      for (const a of allowances) {
        totalAllowances += a.is_percentage ? gross * Number(a.amount) / 100 : Number(a.amount);
      }

      let totalDeductions = 0;
      for (const d of deductions) {
        totalDeductions += d.is_percentage ? gross * Number(d.amount) / 100 : Number(d.amount);
      }

      const grossWithAllowances = gross + totalAllowances;
      const tax = calculateTax(grossWithAllowances);
      const ni = calculateNI(grossWithAllowances);
      const net = grossWithAllowances - tax - ni - totalDeductions;

      totalGross += grossWithAllowances;
      totalNet += net;

      await db('payslips').insert({
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
          ...allowances.map((a) => ({ label: a.name, amount: a.is_percentage ? gross * Number(a.amount) / 100 : Number(a.amount), type: 'earning' })),
          { label: 'Income Tax', amount: tax, type: 'tax' },
          { label: 'National Insurance', amount: ni, type: 'tax' },
          ...deductions.map((d) => ({ label: d.name, amount: d.is_percentage ? gross * Number(d.amount) / 100 : Number(d.amount), type: 'deduction' })),
        ]),
      });
    }

    await db('payroll_runs').where({ id: run.id }).update({
      total_gross: totalGross,
      total_net: totalNet,
      employee_count: employees.length,
    });

    return db('payroll_runs').where({ id: run.id }).first();
  },

  async advanceRunStatus(runId: string, newStatus: string, user: AuthUser) {
    const run = await db('payroll_runs').where({ id: runId }).first();
    if (!run) throw new AppError(404, 'Payroll record not found');

    const allowed: Record<string, string[]> = {
      draft: ['reviewed'],
      reviewed: ['approved'],
      approved: ['paid'],
    };
    if (!allowed[run.status]?.includes(newStatus)) {
      throw new AppError(400, `Cannot transition from ${run.status} to ${newStatus}`);
    }

    const updates: Record<string, unknown> = { status: newStatus, updated_at: new Date() };
    if (newStatus === 'approved') updates.approved_by = user.id;
    if (newStatus === 'paid') updates.paid_at = new Date();

    const [updated] = await db('payroll_runs').where({ id: runId }).update(updates).returning('*');
    return updated;
  },

  async getPayslip(runId: string, employeeId: string) {
    const payslip = await db('payslips')
      .where({ payroll_run_id: runId, employee_id: employeeId })
      .join('employees', 'payslips.employee_id', 'employees.id')
      .join('payroll_runs', 'payslips.payroll_run_id', 'payroll_runs.id')
      .select('payslips.*', 'employees.first_name', 'employees.last_name', 'employees.employee_number', 'payroll_runs.period_start', 'payroll_runs.period_end', 'payroll_runs.name as run_name')
      .first();
    if (!payslip) throw new AppError(404, 'Payslip not found');
    return payslip;
  },

  async getEmployeePayslips(employeeId: string, req: Request) {
    const { page, limit, offset } = getPagination(req);
    const query = db('payslips')
      .where('payslips.employee_id', employeeId)
      .join('payroll_runs', 'payslips.payroll_run_id', 'payroll_runs.id')
      .select('payslips.*', 'payroll_runs.name as run_name', 'payroll_runs.period_start', 'payroll_runs.period_end', 'payroll_runs.status as run_status');

    const [{ count }] = await query.clone().count('payslips.id as count');
    const data = await query.orderBy('payroll_runs.period_start', 'desc').limit(limit).offset(offset);
    return { data, meta: buildMeta(Number(count), page, limit) };
  },
};
