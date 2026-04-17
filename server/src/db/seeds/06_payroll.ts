import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  const employees = await knex('employees').select('id');
  const superAdmin = await knex('users').where('role', 'super_admin').first();
  
  if (!superAdmin) return;

  // Insert basic tax rules for GB
  await knex('tax_rules').insert([
    { id: uuidv4(), label: 'Personal Allowance', jurisdiction: 'GB', min_income: 0, max_income: 12570, rate: 0 },
    { id: uuidv4(), label: 'Basic Rate', jurisdiction: 'GB', min_income: 12571, max_income: 50270, rate: 0.2 },
    { id: uuidv4(), label: 'Higher Rate', jurisdiction: 'GB', min_income: 50271, max_income: 150000, rate: 0.4 },
  ]);

  const salaryRecords = [];
  for (const emp of employees) {
    salaryRecords.push({
      id: uuidv4(),
      employee_id: emp.id,
      base_salary: 50000 + (Math.random() * 20000),
      currency: 'GBP',
      pay_frequency: 'monthly',
      effective_date: '2024-01-01',
      created_by: superAdmin.id
    });
  }
  await knex('salary_records').insert(salaryRecords);

  const runId = uuidv4();
  await knex('payroll_runs').insert({
    id: runId,
    name: 'May 2024 Payroll',
    period_start: '2024-05-01',
    period_end: '2024-05-31',
    status: 'paid',
    total_gross: 250000,
    total_net: 190000,
    employee_count: employees.length,
    approved_by: superAdmin.id,
    paid_at: '2024-05-31',
    created_by: superAdmin.id
  });

  const payslips = [];
  for (const emp of employees) {
    payslips.push({
      id: uuidv4(),
      payroll_run_id: runId,
      employee_id: emp.id,
      gross_pay: 4000,
      net_pay: 3000,
      tax: 800,
      national_insurance: 200,
      total_allowances: 0,
      total_deductions: 0,
      currency: 'GBP'
    });
  }

  await knex('payslips').insert(payslips);
}
