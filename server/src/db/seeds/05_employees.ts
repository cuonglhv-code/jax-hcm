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
  const lineManagerId = uuidv4();

  const emps = [];

  // Find specific users for fixed roles to ensure tests have stable targets
  const adminUser = users.find(u => u.email === 'admin@jaxtina.com');
  const hr1User = users.find(u => u.email === 'hr1@jaxtina.com');
  const hr2User = users.find(u => u.email === 'hr2@jaxtina.com');
  const mgr1User = users.find(u => u.email === 'manager1@jaxtina.com');
  const mgr2User = users.find(u => u.email === 'manager2@jaxtina.com');

  if (adminUser) {
    emps.push({ id: uuidv4(), user_id: adminUser.id, first_name: 'Admin', last_name: 'User', email: adminUser.email, department_id: hrDId, job_title_id: getTId('HR Manager'), status: 'active', hire_date: '2023-01-01', employment_type: 'full_time' });
  }

  if (hr1User) {
    emps.push({ id: hrManagerId, user_id: hr1User.id, first_name: 'Jane', last_name: 'HR', email: hr1User.email, department_id: hrDId, job_title_id: getTId('HR Manager'), status: 'active', hire_date: '2023-02-01', employment_type: 'full_time' });
  }

  if (hr2User) {
    emps.push({ id: uuidv4(), user_id: hr2User.id, first_name: 'John', last_name: 'HR', email: hr2User.email, department_id: hrDId, job_title_id: getTId('HR Manager'), status: 'active', hire_date: '2023-02-15', employment_type: 'full_time' });
  }

  if (mgr1User) {
    emps.push({ id: lineManagerId, user_id: mgr1User.id, first_name: 'Manager', last_name: 'One', email: mgr1User.email, department_id: engDId, job_title_id: getTId('Engineering Manager'), status: 'active', hire_date: '2023-03-01', employment_type: 'full_time' });
  }

  if (mgr2User) {
    emps.push({ id: uuidv4(), user_id: mgr2User.id, first_name: 'Manager', last_name: 'Two', email: mgr2User.email, department_id: engDId, job_title_id: getTId('Engineering Manager'), status: 'active', hire_date: '2023-03-15', employment_type: 'full_time' });
  }

  // Link emp1-emp7
  const employeeUsers = users.filter(u => u.role === 'employee');
  for (const user of employeeUsers) {
    emps.push({ 
      id: uuidv4(), 
      user_id: user.id, 
      first_name: user.email.split('@')[0], 
      last_name: 'Seeded', 
      email: user.email, 
      department_id: engDId, 
      job_title_id: getTId('Frontend Developer'), 
      manager_id: lineManagerId, 
      status: 'active', 
      hire_date: '2023-04-01', 
      employment_type: 'full_time' 
    });
  }

  // Generate some dummy employees without users
  for (let i = 8; i <= 20; i++) {
    emps.push({
      id: uuidv4(),
      user_id: null,
      first_name: `Employee${i}`,
      last_name: `Dummy`,
      email: `employee${i}@example.com`,
      department_id: salesDId,
      job_title_id: getTId('Account Executive'),
      status: 'active',
      hire_date: '2024-01-01', 
      employment_type: 'full_time'
    });
  }

  await knex('employees').insert(emps);
}
