import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // ─── Departments (no head_id FK yet — employees doesn't exist) ──────────────
  await knex.schema.createTable('departments', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.string('name', 255).notNullable().unique()
    t.uuid('head_id').nullable()  // FK added after employees table
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('deleted_at', { useTz: true }).nullable()
  })

  // ─── Job Titles ─────────────────────────────────────────────────────────────
  await knex.schema.createTable('job_titles', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.string('title', 255).notNullable()
    t.uuid('department_id').notNullable()
      .references('id').inTable('departments')
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('deleted_at', { useTz: true }).nullable()
  })

  // ─── Employees ──────────────────────────────────────────────────────────────
  await knex.schema.createTable('employees', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('user_id').nullable().unique()
      .references('id').inTable('users').onDelete('SET NULL')
    t.string('first_name', 100).notNullable()
    t.string('last_name', 100).notNullable()
    t.string('email', 255).notNullable().unique()
    t.string('phone', 50).nullable()
    t.text('avatar_url').nullable()
    t.uuid('department_id').notNullable()
      .references('id').inTable('departments')
    t.uuid('job_title_id').notNullable()
      .references('id').inTable('job_titles')
    t.uuid('manager_id').nullable()
      .references('id').inTable('employees').onDelete('SET NULL')
    t.string('employment_type', 50).notNullable()
      .checkIn(['full_time', 'part_time', 'contractor', 'intern'])
    t.string('status', 50).notNullable().defaultTo('active')
      .checkIn(['active', 'inactive', 'on_leave'])
    t.date('hire_date').notNullable()
    t.date('end_date').nullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('deleted_at', { useTz: true }).nullable()
    t.index('department_id')
    t.index('manager_id')
    t.index('status')
    t.index('email')
    t.index('user_id')
  })

  // ─── Add departments.head_id FK → employees ──────────────────────────────────
  await knex.schema.alterTable('departments', t => {
    t.foreign('head_id').references('id').inTable('employees').onDelete('SET NULL')
  })

  // ─── Employee Documents ──────────────────────────────────────────────────────
  await knex.schema.createTable('employee_documents', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('employee_id').notNullable()
      .references('id').inTable('employees').onDelete('CASCADE')
    t.string('name', 255).notNullable()
    t.text('file_url').notNullable()
    t.string('file_type', 100).nullable()
    t.timestamp('uploaded_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  // ─── Audit Logs ─────────────────────────────────────────────────────────────
  await knex.schema.createTable('audit_logs', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.string('entity_type', 100).notNullable()
    t.uuid('entity_id').notNullable()
    t.uuid('actor_id').nullable()
      .references('id').inTable('users').onDelete('SET NULL')
    t.string('action', 50).notNullable()
      .checkIn(['CREATE', 'UPDATE', 'DELETE'])
    t.jsonb('before').nullable()
    t.jsonb('after').nullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.index(['entity_type', 'entity_id'])
    t.index('actor_id')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('audit_logs')
  await knex.schema.dropTableIfExists('employee_documents')
  await knex.schema.alterTable('departments', t => t.dropForeign(['head_id']))
  await knex.schema.dropTableIfExists('employees')
  await knex.schema.dropTableIfExists('job_titles')
  await knex.schema.dropTableIfExists('departments')
}
