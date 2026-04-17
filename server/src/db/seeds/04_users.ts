import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  const hash = await bcrypt.hash('Password123!', 10);
  const adminHash = await bcrypt.hash('Admin123!', 10);
  const hrHash = await bcrypt.hash('HrPass1!', 10);
  const mgrHash = await bcrypt.hash('MgrPass1!', 10);
  const empHash = await bcrypt.hash('EmpPass1!', 10);

  const users = [
    { id: uuidv4(), email: 'admin@jaxtina.com', password_hash: adminHash, role: 'super_admin' },
    { id: uuidv4(), email: 'hr1@jaxtina.com', password_hash: hrHash, role: 'hr_manager' },
    { id: uuidv4(), email: 'hr2@jaxtina.com', password_hash: hrHash, role: 'hr_manager' },
    { id: uuidv4(), email: 'manager1@jaxtina.com', password_hash: mgrHash, role: 'line_manager' },
    { id: uuidv4(), email: 'manager2@jaxtina.com', password_hash: mgrHash, role: 'line_manager' },
  ];

  for (let i = 1; i <= 7; i++) {
    users.push({
      id: uuidv4(),
      email: `emp${i}@jaxtina.com`,
      password_hash: empHash,
      role: 'employee'
    });
  }

  await knex('users').insert(users);
}
