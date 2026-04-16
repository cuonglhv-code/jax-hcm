import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // ─── Users ──────────────────────────────────────────────────────────────────
  await knex.schema.createTable('users', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.string('email', 255).notNullable().unique()
    t.string('password_hash', 255).notNullable()
    t.string('role', 50).notNullable()
      .checkIn(['super_admin', 'hr_manager', 'line_manager', 'employee'])
    t.boolean('is_active').notNullable().defaultTo(true)
    t.timestamp('last_login_at', { useTz: true }).nullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('deleted_at', { useTz: true }).nullable()
    t.index('email')
    t.index('role')
  })

  // ─── Refresh Tokens ─────────────────────────────────────────────────────────
  await knex.schema.createTable('refresh_tokens', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('user_id').notNullable()
      .references('id').inTable('users').onDelete('CASCADE')
    t.string('token_hash', 255).notNullable().unique()
    t.timestamp('expires_at', { useTz: true }).notNullable()
    t.timestamp('revoked_at', { useTz: true }).nullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.index('user_id')
    t.index('token_hash')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('refresh_tokens')
  await knex.schema.dropTableIfExists('users')
}
