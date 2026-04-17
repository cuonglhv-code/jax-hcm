import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  const users = await knex('users').select('id', 'email', 'role');
  const depts = await knex('departments').select('id', 'name');
  const titles = await knex('job_titles').select('id', 'title', 'department_id');

  const getDId = (name: string) => depts.find((d: any) => d.name === name)?.id;
  const getTId = (name: string) => titles.find((t: any) => t.title === name)?.id;

  const hrDId = getDId('HR');
  const engDId = getDId('Engineering');
  const salesDId = getDId('Sales');

  const hrManagerId = uuidv4();
  const emManagerId = uuidv4();

  const emps = [];

  // Core users
  for (const user of users) {
    if (user.role === 'super_admin') {
      emps.push({ id: uuidv4(), user_id: user.id, first_name: 'Super', last_name: 'Admin', email: user.email, department_id: hrDId, job_title_id: getTId('HR Manager'), status: 'active', hire_date: '2023-01-01', employment_type: 'full_time' });
    } else if (user.role === 'hr_manager') {
      emps.push({ id: hrManagerId, user_id: user.id, first_name: 'Jane', last_name: 'Doe', email: user.email, department_id: hrDId, job_title_id: getTId('HR Manager'), status: 'active', hire_date: '2023-02-01', employment_type: 'full_time' });
    } else if (user.role === 'line_manager') {
      emps.push({ id: emManagerId, user_id: user.id, first_name: 'John', last_name: 'Smith', email: user.email, department_id: engDId, job_title_id: getTId('Engineering Manager'), status: 'active', hire_date: '2023-03-01', employment_type: 'full_time' });
    } else {
      emps.push({ id: uuidv4(), user_id: user.id, first_name: 'Alice', last_name: 'Johnson', email: user.email, department_id: engDId, job_title_id: getTId('Frontend Developer'), manager_id: emManagerId, status: 'active', hire_date: '2023-04-01', employment_type: 'full_time' });
    }
  }

  // Generate 50 dummy employees
  for (let i = 5; i <= 50; i++) {
    emps.push({
      id: uuidv4(),
      user_id: null,
      first_name: `Employee${i}`,
      last_name: `Test`,
      email: `employee${i}@jaxtina.com`,
      department_id: salesDId,
      job_title_id: getTId('Account Executive'),
      status: 'active',
      hire_date: '2024-01-01', employment_type: 'full_time'
    });
  }

  await knex('employees').insert(emps);
}
