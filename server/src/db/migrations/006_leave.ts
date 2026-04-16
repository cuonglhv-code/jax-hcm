import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // ─── Leave Types ─────────────────────────────────────────────────────────────
  await knex.schema.createTable('leave_types', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.string('name', 100).notNullable().unique()
    t.boolean('is_paid').notNullable().defaultTo(true)
    t.integer('default_days').notNullable().defaultTo(0)
    t.boolean('allow_carry_over').notNullable().defaultTo(false)
    t.integer('max_carry_over_days').nullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  // ─── Leave Entitlements ──────────────────────────────────────────────────────
  await knex.schema.createTable('leave_entitlements', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('employee_id').notNullable()
      .references('id').inTable('employees').onDelete('CASCADE')
    t.uuid('leave_type_id').notNullable()
      .references('id').inTable('leave_types').onDelete('CASCADE')
    t.integer('year').notNullable()
    t.decimal('total_days', 6, 2).notNullable()
    t.decimal('used_days', 6, 2).notNullable().defaultTo(0)
    t.decimal('carry_over_days', 6, 2).notNullable().defaultTo(0)
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.unique(['employee_id', 'leave_type_id', 'year'])
    t.index(['employee_id', 'year'])
  })

  // ─── Leave Requests ──────────────────────────────────────────────────────────
  await knex.schema.createTable('leave_requests', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('employee_id').notNullable()
      .references('id').inTable('employees').onDelete('CASCADE')
    t.uuid('leave_type_id').notNullable()
      .references('id').inTable('leave_types')
    t.date('start_date').notNullable()
    t.date('end_date').notNullable()
    t.decimal('days', 6, 2).notNullable()
    t.text('reason').nullable()
    t.string('status', 50).notNullable().defaultTo('pending')
      .checkIn(['pending', 'approved', 'rejected', 'cancelled'])
    t.uuid('reviewed_by_id').nullable()
      .references('id').inTable('users').onDelete('SET NULL')
    t.timestamp('reviewed_at', { useTz: true }).nullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.index(['employee_id', 'status'])
    t.index(['start_date', 'end_date'])
  })

  // ─── Public Holidays ─────────────────────────────────────────────────────────
  await knex.schema.createTable('public_holidays', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.string('name', 255).notNullable()
    t.date('date').notNullable()
    t.string('region', 100).notNullable().defaultTo('GB')
    t.integer('year').notNullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.unique(['date', 'region'])
    t.index(['date', 'region'])
  })

  // ─── Attendance Logs ─────────────────────────────────────────────────────────
  await knex.schema.createTable('attendance_logs', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('employee_id').notNullable()
      .references('id').inTable('employees').onDelete('CASCADE')
    t.date('date').notNullable()
    t.timestamp('clock_in', { useTz: true }).nullable()
    t.timestamp('clock_out', { useTz: true }).nullable()
    t.decimal('total_hours', 5, 2).nullable()
    t.text('notes').nullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.unique(['employee_id', 'date'])
    t.index(['employee_id', 'date'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('attendance_logs')
  await knex.schema.dropTableIfExists('public_holidays')
  await knex.schema.dropTableIfExists('leave_requests')
  await knex.schema.dropTableIfExists('leave_entitlements')
  await knex.schema.dropTableIfExists('leave_types')
}
