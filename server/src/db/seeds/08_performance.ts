import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  const employees = await knex('employees').select('id');
  if (employees.length === 0) return;

  const cycleId = uuidv4();
  await knex('appraisal_cycles').insert({
    id: cycleId,
    name: '2024 Annual Review',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    status: 'active'
  });

  const goals = [];
  for (const emp of employees) {
    goals.push({
      id: uuidv4(),
      employee_id: emp.id,
      cycle_id: cycleId,
      title: 'Performance Target 2024',
      description: 'Main performance goal for the year',
      category: 'project',
      weight: 100,
      completion_percentage: 45.5,
      due_date: '2024-12-31'
    });
  }

  await knex('goals').insert(goals);
}
