import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // ─── Salary Records ─────────────────────────────────────────────────────────
  await knex.schema.createTable('salary_records', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('employee_id').notNullable()
      .references('id').inTable('employees').onDelete('CASCADE')
    t.decimal('base_salary', 14, 2).notNullable().checkPositive()
    t.string('currency', 10).notNullable().defaultTo('GBP')
    t.string('pay_frequency', 50).notNullable()
      .checkIn(['monthly', 'bi_weekly', 'weekly'])
    t.date('effective_date').notNullable()
    t.date('end_date').nullable()
    t.uuid('created_by').nullable()
      .references('id').inTable('users').onDelete('SET NULL')
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('deleted_at', { useTz: true }).nullable()
    t.index(['employee_id', 'effective_date'])
  })

  // ─── Compensation History ───────────────────────────────────────────────────
  await knex.schema.createTable('compensation_history', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('employee_id').notNullable()
      .references('id').inTable('employees').onDelete('CASCADE')
    t.decimal('salary_before', 14, 2).notNullable()
    t.decimal('salary_after', 14, 2).notNullable()
    t.string('reason', 255).nullable()
    t.date('effective_date').notNullable()
    t.uuid('approved_by').nullable()
      .references('id').inTable('users').onDelete('SET NULL')
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  // ─── Allowances ─────────────────────────────────────────────────────────────
  await knex.schema.createTable('allowances', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('employee_id').nullable()
      .references('id').inTable('employees').onDelete('CASCADE')
    t.string('name', 255).notNullable()
    t.decimal('amount', 14, 2).notNullable().checkPositive()
    t.boolean('is_percentage').notNullable().defaultTo(false)
    t.boolean('recurring').notNullable().defaultTo(true) // Changed from is_global to recurring to match service
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('deleted_at', { useTz: true }).nullable()
  })

  // ─── Deductions ─────────────────────────────────────────────────────────────
  await knex.schema.createTable('deductions', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('employee_id').nullable()
      .references('id').inTable('employees').onDelete('CASCADE')
    t.string('name', 255).notNullable()
    t.decimal('amount', 14, 2).notNullable().checkPositive()
    t.boolean('is_percentage').notNullable().defaultTo(false)
    t.boolean('recurring').notNullable().defaultTo(true) // Changed from is_global to recurring
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('deleted_at', { useTz: true }).nullable()
  })

  // ─── Tax Rules ──────────────────────────────────────────────────────────────
  await knex.schema.createTable('tax_rules', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.string('label', 255).notNullable() // Added label to match service
    t.string('jurisdiction', 100).notNullable()
    t.decimal('min_income', 14, 2).notNullable().defaultTo(0)
    t.decimal('max_income', 14, 2).nullable()
    t.decimal('rate', 6, 4).notNullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('deleted_at', { useTz: true }).nullable()
  })

  // ─── Payroll Runs ────────────────────────────────────────────────────────────
  await knex.schema.createTable('payroll_runs', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.string('name', 255).notNullable()
    t.date('period_start').notNullable()
    t.date('period_end').notNullable()
    t.string('status', 50).notNullable().defaultTo('draft')
      .checkIn(['draft', 'reviewed', 'approved', 'paid'])
    t.decimal('total_gross', 14, 2).notNullable().defaultTo(0)
    t.decimal('total_net', 14, 2).notNullable().defaultTo(0)
    t.integer('employee_count').notNullable().defaultTo(0)
    t.uuid('created_by').nullable()
      .references('id').inTable('users').onDelete('SET NULL')
    t.uuid('approved_by').nullable()
      .references('id').inTable('users').onDelete('SET NULL')
    t.timestamp('approved_at', { useTz: true }).nullable()
    t.timestamp('paid_at', { useTz: true }).nullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('deleted_at', { useTz: true }).nullable()
    t.index('status')
    t.index(['period_start', 'period_end'])
  })

  // ─── Payslips ────────────────────────────────────────────────────────────────
  await knex.schema.createTable('payslips', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('payroll_run_id').notNullable()
      .references('id').inTable('payroll_runs').onDelete('CASCADE')
    t.uuid('employee_id').notNullable()
      .references('id').inTable('employees').onDelete('CASCADE')
    t.decimal('gross_pay', 14, 2).notNullable()
    t.decimal('total_allowances', 14, 2).notNullable().defaultTo(0)
    t.decimal('total_deductions', 14, 2).notNullable().defaultTo(0)
    t.decimal('tax', 14, 2).notNullable().defaultTo(0) // Changed from tax_amount to tax to match service
    t.decimal('national_insurance', 14, 2).notNullable().defaultTo(0) // Added NI
    t.decimal('net_pay', 14, 2).notNullable()
    t.text('breakdown').nullable() // Match service JSON
    t.string('currency', 10).notNullable().defaultTo('GBP')
    t.timestamp('generated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.unique(['payroll_run_id', 'employee_id'])
    t.index('payroll_run_id')
    t.index('employee_id')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('payslips')
  await knex.schema.dropTableIfExists('payroll_runs')
  await knex.schema.dropTableIfExists('tax_rules')
  await knex.schema.dropTableIfExists('deductions')
  await knex.schema.dropTableIfExists('allowances')
  await knex.schema.dropTableIfExists('compensation_history')
  await knex.schema.dropTableIfExists('salary_records')
}
