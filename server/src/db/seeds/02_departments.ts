import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  const depts = [
    { id: uuidv4(), name: 'Engineering' },
    { id: uuidv4(), name: 'Sales' },
    { id: uuidv4(), name: 'HR' },
    { id: uuidv4(), name: 'Finance' },
    { id: uuidv4(), name: 'Operations' }
  ];

  await knex('departments').insert(depts);
}
