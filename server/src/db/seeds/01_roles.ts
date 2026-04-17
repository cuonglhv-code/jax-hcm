import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Roles are defined in user.role schema constraint so there's no actual roles table.
  // We'll skip creating a table for roles, as it's an ENUM/CHECK constraint.
}
