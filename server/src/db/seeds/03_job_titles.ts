import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  const depts = await knex('departments').select('id', 'name');
  const dMap: Record<string, string> = {};
  depts.forEach((d: any) => dMap[d.name] = d.id);

  const titles = [
    { id: uuidv4(), department_id: dMap['Engineering'], title: 'Frontend Developer' },
    { id: uuidv4(), department_id: dMap['Engineering'], title: 'Backend Developer' },
    { id: uuidv4(), department_id: dMap['Engineering'], title: 'Engineering Manager' },
    { id: uuidv4(), department_id: dMap['Sales'], title: 'Account Executive' },
    { id: uuidv4(), department_id: dMap['Sales'], title: 'Sales Manager' },
    { id: uuidv4(), department_id: dMap['HR'], title: 'HR Manager' },
    { id: uuidv4(), department_id: dMap['HR'], title: 'Recruiter' },
    { id: uuidv4(), department_id: dMap['Finance'], title: 'Accounting Manager' },
    { id: uuidv4(), department_id: dMap['Finance'], title: 'Financial Analyst' },
    { id: uuidv4(), department_id: dMap['Operations'], title: 'Operations Specialist' },
    { id: uuidv4(), department_id: dMap['Operations'], title: 'Operations Manager' },
  ];

  await knex('job_titles').insert(titles);
}
