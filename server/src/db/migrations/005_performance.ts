import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // ─── Appraisal Cycles ────────────────────────────────────────────────────────
  await knex.schema.createTable('appraisal_cycles', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.string('name', 255).notNullable()
    t.date('start_date').notNullable()
    t.date('end_date').notNullable()
    t.string('status', 50).notNullable().defaultTo('draft') // Changed from is_active to status to match service
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  // ─── Appraisal Forms ─────────────────────────────────────────────────────────
  await knex.schema.createTable('appraisal_forms', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('cycle_id').notNullable()
      .references('id').inTable('appraisal_cycles').onDelete('CASCADE')
    t.string('name', 255).notNullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  // ─── Appraisal Questions ─────────────────────────────────────────────────────
  await knex.schema.createTable('appraisal_questions', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('form_id').notNullable()
      .references('id').inTable('appraisal_forms').onDelete('CASCADE')
    t.text('text').notNullable()
    t.string('rating_type', 50).notNullable()
      .checkIn(['numeric', 'descriptive'])
    t.jsonb('options').nullable()
    t.integer('order').notNullable().defaultTo(0)
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  // ─── Appraisals ──────────────────────────────────────────────────────────────
  await knex.schema.createTable('appraisals', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('cycle_id').notNullable()
      .references('id').inTable('appraisal_cycles').onDelete('CASCADE')
    t.uuid('employee_id').notNullable()
      .references('id').inTable('employees').onDelete('CASCADE')
    t.uuid('manager_id').nullable() // Changed to nullable to match common practices if manager not assigned yet
      .references('id').inTable('employees').onDelete('SET NULL')
    t.string('status', 50).notNullable().defaultTo('draft')
      .checkIn(['draft', 'submitted', 'reviewed', 'acknowledged'])
    t.timestamp('self_submitted_at', { useTz: true }).nullable()
    t.timestamp('manager_submitted_at', { useTz: true }).nullable()
    t.timestamp('acknowledged_at', { useTz: true }).nullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.unique(['cycle_id', 'employee_id'])
    t.index('cycle_id')
    t.index('employee_id')
    t.index('status')
  })

  // ─── Appraisal Responses ─────────────────────────────────────────────────────
  await knex.schema.createTable('appraisal_responses', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('appraisal_id').notNullable()
      .references('id').inTable('appraisals').onDelete('CASCADE')
    t.uuid('question_id').notNullable()
      .references('id').inTable('appraisal_questions').onDelete('CASCADE')
    t.uuid('responder_id').notNullable()
      .references('id').inTable('users').onDelete('CASCADE')
    t.string('responder_role', 50).notNullable()
      .checkIn(['self', 'manager'])
    t.decimal('rating_value', 5, 2).nullable()
    t.text('text_value').nullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.unique(['appraisal_id', 'question_id', 'responder_role'])
    t.index('appraisal_id')
  })

  // ─── Goals ───────────────────────────────────────────────────────────────────
  await knex.schema.createTable('goals', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('employee_id').notNullable()
      .references('id').inTable('employees').onDelete('CASCADE')
    t.uuid('cycle_id').nullable()
      .references('id').inTable('appraisal_cycles').onDelete('SET NULL')
    t.string('title', 255).notNullable()
    t.text('description').nullable()
    t.string('category', 50).nullable() // Added category
    t.integer('weight').notNullable().defaultTo(0) // Added weight
    t.decimal('completion_percentage', 5, 2).notNullable().defaultTo(0)
    t.date('due_date').nullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.index('employee_id')
    t.index('cycle_id')
  })

  // ─── Key Results ─────────────────────────────────────────────────────────────
  await knex.schema.createTable('key_results', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('goal_id').notNullable()
      .references('id').inTable('goals').onDelete('CASCADE')
    t.string('title', 255).notNullable()
    t.decimal('start_value', 14, 2).notNullable().defaultTo(0) // Added start_value
    t.decimal('target_value', 14, 2).notNullable()
    t.decimal('current_value', 14, 2).notNullable().defaultTo(0)
    t.string('unit', 50).nullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.index('goal_id')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('key_results')
  await knex.schema.dropTableIfExists('goals')
  await knex.schema.dropTableIfExists('appraisal_responses')
  await knex.schema.dropTableIfExists('appraisals')
  await knex.schema.dropTableIfExists('appraisal_questions')
  await knex.schema.dropTableIfExists('appraisal_forms')
  await knex.schema.dropTableIfExists('appraisal_cycles')
}
