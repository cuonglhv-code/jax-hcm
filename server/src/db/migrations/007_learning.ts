import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // ─── Courses ─────────────────────────────────────────────────────────────────
  await knex.schema.createTable('courses', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.string('title', 255).notNullable()
    t.text('description').nullable()
    t.string('type', 50).notNullable()
      .checkIn(['internal', 'external'])
    t.string('provider', 255).nullable()
    t.decimal('duration_hours', 6, 2).nullable()
    t.boolean('is_mandatory').notNullable().defaultTo(false)
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('deleted_at', { useTz: true }).nullable()
  })

  // ─── Course Enrolments ───────────────────────────────────────────────────────
  await knex.schema.createTable('course_enrolments', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('course_id').notNullable()
      .references('id').inTable('courses').onDelete('CASCADE')
    t.uuid('employee_id').notNullable()
      .references('id').inTable('employees').onDelete('CASCADE')
    t.string('status', 50).notNullable().defaultTo('enrolled')
      .checkIn(['enrolled', 'in_progress', 'completed', 'withdrawn'])
    t.timestamp('enrolled_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('started_at', { useTz: true }).nullable()
    t.timestamp('completed_at', { useTz: true }).nullable()
    t.timestamp('expires_at', { useTz: true }).nullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.unique(['course_id', 'employee_id'])
    t.index(['employee_id', 'status'])
    t.index('course_id')
  })

  // ─── Learning Plans ──────────────────────────────────────────────────────────
  await knex.schema.createTable('learning_plans', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.string('name', 255).notNullable()
    t.uuid('assigned_to_employee_id').nullable()
      .references('id').inTable('employees').onDelete('CASCADE')
    t.uuid('assigned_to_job_title_id').nullable()
      .references('id').inTable('job_titles').onDelete('CASCADE')
    t.uuid('created_by_id').nullable()
      .references('id').inTable('users').onDelete('SET NULL')
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  // ─── Learning Plan Items ─────────────────────────────────────────────────────
  await knex.schema.createTable('learning_plan_items', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('plan_id').notNullable()
      .references('id').inTable('learning_plans').onDelete('CASCADE')
    t.uuid('course_id').notNullable()
      .references('id').inTable('courses').onDelete('CASCADE')
    t.integer('order').notNullable().defaultTo(0)
    t.boolean('is_required').notNullable().defaultTo(true)
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.unique(['plan_id', 'course_id'])
    t.index('plan_id')
  })

  // ─── Training Certificates ───────────────────────────────────────────────────
  await knex.schema.createTable('training_certificates', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('enrolment_id').notNullable()
      .references('id').inTable('course_enrolments').onDelete('CASCADE')
    t.uuid('employee_id').notNullable()
      .references('id').inTable('employees').onDelete('CASCADE')
    t.uuid('course_id').notNullable()
      .references('id').inTable('courses').onDelete('CASCADE')
    t.string('certificate_number', 100).notNullable().unique()
    t.timestamp('issued_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('expires_at', { useTz: true }).nullable()
    t.index('employee_id')
    t.index('certificate_number')
  })

  // ─── Mandatory Training ──────────────────────────────────────────────────────
  await knex.schema.createTable('mandatory_training', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('course_id').notNullable()
      .references('id').inTable('courses').onDelete('CASCADE')
    t.uuid('job_title_id').nullable()
      .references('id').inTable('job_titles').onDelete('CASCADE')
    t.uuid('department_id').nullable()
      .references('id').inTable('departments').onDelete('CASCADE')
    t.integer('renewal_period_days').nullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.index('course_id')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('mandatory_training')
  await knex.schema.dropTableIfExists('training_certificates')
  await knex.schema.dropTableIfExists('learning_plan_items')
  await knex.schema.dropTableIfExists('learning_plans')
  await knex.schema.dropTableIfExists('course_enrolments')
  await knex.schema.dropTableIfExists('courses')
}
