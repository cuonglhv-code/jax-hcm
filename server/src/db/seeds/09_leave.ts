import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  const leaveTypeId = uuidv4();
  await knex('leave_types').insert({
    id: leaveTypeId,
    name: 'Annual Leave',
    is_paid: true,
    default_days: 25
  });

  const employees = await knex('employees').select('id');
  const entitlements = [];
  
  for (const emp of employees) {
    entitlements.push({
      employee_id: emp.id,
      leave_type_id: leaveTypeId,
      year: 2024,
      total_days: 25,
      carry_over_days: 2
    });
  }
  await knex('leave_entitlements').insert(entitlements);

  const requests = [];
  const statuses = ['approved', 'pending', 'rejected'];
  for (let i = 0; i < Math.min(25, employees.length); i++) {
    requests.push({
      id: uuidv4(),
      employee_id: employees[i].id,
      leave_type_id: leaveTypeId,
      start_date: '2024-08-01',
      end_date: '2024-08-05',
      days: 5,
      reason: 'Summer holiday',
      status: statuses[i % statuses.length]
    });
  }

  await knex('leave_requests').insert(requests);

  const logs = [];
  for (let i = 0; i < Math.min(10, employees.length); i++) {
    logs.push({
      employee_id: employees[i].id,
      date: '2024-05-15',
      clock_in: knex.fn.now(),
    });
  }
  await knex('attendance_logs').insert(logs);
}
