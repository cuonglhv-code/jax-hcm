import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  const depts = await knex('departments').select('id', 'name');
  const engDId = depts.find((d: any) => d.name === 'Engineering')?.id;
  const superAdmin = await knex('users').where('role', 'super_admin').first();

  if (!superAdmin) return;

  const reqId1 = uuidv4();
  const reqId2 = uuidv4();

  await knex('job_requisitions').insert([
    { id: reqId1, title: 'Senior Frontend Engineer', department_id: engDId, headcount: 2, status: 'open', created_by_id: superAdmin.id },
    { id: reqId2, title: 'Backend Lead', department_id: engDId, headcount: 1, status: 'open', created_by_id: superAdmin.id }
  ]);

  const candidates = [];
  for(let i = 1; i <= 15; i++) {
    candidates.push({
      id: uuidv4(),
      first_name: `Candidate${i}`,
      last_name: `Test`,
      email: `candidate${i}@example.com`,
      phone: `+4470000000${i.toString().padStart(2, '0')}`
    })
  }
  await knex('candidates').insert(candidates);

  const applications = [];
  const stages = ['applied', 'screening', 'interview', 'offer', 'rejected'];
  
  for(let i=0; i<15; i++) {
    applications.push({
      id: uuidv4(),
      requisition_id: i % 2 === 0 ? reqId1 : reqId2,
      candidate_id: candidates[i].id,
      stage: stages[i % stages.length],
    })
  }

  await knex('applications').insert(applications);
}
