import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // ─── Job Requisitions ────────────────────────────────────────────────────────
  await knex.schema.createTable('job_requisitions', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.string('title', 255).notNullable()
    t.uuid('department_id').notNullable()
      .references('id').inTable('departments')
    t.integer('headcount').notNullable().defaultTo(1)
    t.text('description').nullable()
    t.date('closing_date').nullable()
    t.string('status', 50).notNullable().defaultTo('open')
      .checkIn(['open', 'closed', 'on_hold'])
    t.uuid('created_by_id').nullable()
      .references('id').inTable('users').onDelete('SET NULL')
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('deleted_at', { useTz: true }).nullable()
  })

  // ─── Candidates ──────────────────────────────────────────────────────────────
  await knex.schema.createTable('candidates', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.string('first_name', 100).notNullable()
    t.string('last_name', 100).notNullable()
    t.string('email', 255).notNullable().unique()
    t.string('phone', 50).nullable()
    t.text('resume_url').nullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  // ─── Applications ────────────────────────────────────────────────────────────
  await knex.schema.createTable('applications', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('candidate_id').notNullable()
      .references('id').inTable('candidates').onDelete('CASCADE')
    t.uuid('requisition_id').notNullable()
      .references('id').inTable('job_requisitions').onDelete('CASCADE')
    t.string('stage', 50).notNullable().defaultTo('applied')
      .checkIn(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'])
    t.text('notes').nullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.unique(['candidate_id', 'requisition_id'])
    t.index('candidate_id')
    t.index('requisition_id')
    t.index('stage')
  })

  // ─── Interviews ──────────────────────────────────────────────────────────────
  await knex.schema.createTable('interviews', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('application_id').notNullable()
      .references('id').inTable('applications').onDelete('CASCADE')
    t.timestamp('scheduled_at', { useTz: true }).notNullable()
    t.uuid('interviewer_id').nullable()
      .references('id').inTable('users').onDelete('SET NULL')
    t.text('notes').nullable()
    t.string('outcome', 50).nullable()
      .checkIn(['pass', 'fail', 'pending'])
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.index('application_id')
    t.index('scheduled_at')
  })

  // ─── Offer Letters ───────────────────────────────────────────────────────────
  await knex.schema.createTable('offer_letters', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('application_id').notNullable()
      .references('id').inTable('applications').onDelete('CASCADE')
    t.uuid('employee_id').nullable()
      .references('id').inTable('employees').onDelete('SET NULL')
    t.decimal('salary', 14, 2).notNullable()
    t.string('currency', 10).notNullable().defaultTo('GBP')
    t.date('start_date').notNullable()
    t.date('expiry_date').nullable()
    t.string('status', 50).notNullable().defaultTo('draft')
      .checkIn(['draft', 'sent', 'accepted', 'declined'])
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.index('application_id')
    t.index('status')
  })

  // ─── Onboarding Checklists ───────────────────────────────────────────────────
  await knex.schema.createTable('onboarding_checklists', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('employee_id').notNullable()
      .references('id').inTable('employees').onDelete('CASCADE')
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  // ─── Onboarding Tasks ────────────────────────────────────────────────────────
  await knex.schema.createTable('onboarding_tasks', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('checklist_id').notNullable()
      .references('id').inTable('onboarding_checklists').onDelete('CASCADE')
    t.string('title', 255).notNullable()
    t.text('description').nullable()
    t.date('due_date').nullable()
    t.timestamp('completed_at', { useTz: true }).nullable()
    t.uuid('assigned_to_id').nullable()
      .references('id').inTable('users').onDelete('SET NULL')
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.index('checklist_id')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('onboarding_tasks')
  await knex.schema.dropTableIfExists('onboarding_checklists')
  await knex.schema.dropTableIfExists('offer_letters')
  await knex.schema.dropTableIfExists('interviews')
  await knex.schema.dropTableIfExists('applications')
  await knex.schema.dropTableIfExists('candidates')
  await knex.schema.dropTableIfExists('job_requisitions')
}
