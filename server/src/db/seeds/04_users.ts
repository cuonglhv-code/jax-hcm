import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  const hash = await bcrypt.hash('Password123!', 10);

  const users = [
    { id: uuidv4(), email: 'admin@jaxtina.com', password_hash: hash, role: 'super_admin' },
    { id: uuidv4(), email: 'hr@jaxtina.com', password_hash: hash, role: 'hr_manager' },
    { id: uuidv4(), email: 'manager@jaxtina.com', password_hash: hash, role: 'line_manager' },
    { id: uuidv4(), email: 'employee@jaxtina.com', password_hash: hash, role: 'employee' },
  ];

  await knex('users').insert(users);
}
