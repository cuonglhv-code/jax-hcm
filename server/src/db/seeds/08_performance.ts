import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  const superAdmin = await knex('users').where('role', 'super_admin').first();
  if (!superAdmin) return;

  const cycleId = uuidv4();
  await knex('appraisal_cycles').insert({
    id: cycleId,
    name: '2024 Mid-Year Review',
    start_date: '2024-06-01',
    end_date: '2024-06-30',
    is_active: true
  });

  const employees = await knex('employees').select('id', 'manager_id');
  const appraisals = [];
  
  for(let i = 0; i < Math.min(30, employees.length); i++) {
    const mgrId = employees[i].manager_id || employees[0].id; // Fallback to first emp if no manager
    appraisals.push({
      id: uuidv4(),
      cycle_id: cycleId,
      employee_id: employees[i].id,
      manager_id: mgrId,
      status: i % 2 === 0 ? 'draft' : 'reviewed'
    });
  }

  await knex('appraisals').insert(appraisals);

  const goals = [];
  for(let i = 0; i < 20; i++) {
    goals.push({
      id: uuidv4(),
      employee_id: employees[i % employees.length].id,
      cycle_id: cycleId,
      title: `Goal ${i + 1}`,
      completion_percentage: 30
    })
  }

  await knex('goals').insert(goals);
}
