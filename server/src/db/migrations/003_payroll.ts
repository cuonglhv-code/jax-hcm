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
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.index(['employee_id', 'effective_date'])
  })

  // ─── Allowances ─────────────────────────────────────────────────────────────
  await knex.schema.createTable('allowances', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('employee_id').nullable()
      .references('id').inTable('employees').onDelete('CASCADE')
    t.string('name', 255).notNullable()
    t.decimal('amount', 14, 2).notNullable().checkPositive()
    t.boolean('is_percentage').notNullable().defaultTo(false)
    t.boolean('is_global').notNullable().defaultTo(false)
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  // ─── Deductions ─────────────────────────────────────────────────────────────
  await knex.schema.createTable('deductions', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.uuid('employee_id').nullable()
      .references('id').inTable('employees').onDelete('CASCADE')
    t.string('name', 255).notNullable()
    t.decimal('amount', 14, 2).notNullable().checkPositive()
    t.boolean('is_percentage').notNullable().defaultTo(false)
    t.boolean('is_global').notNullable().defaultTo(false)
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  // ─── Tax Rules ──────────────────────────────────────────────────────────────
  await knex.schema.createTable('tax_rules', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    t.string('name', 255).notNullable()
    t.string('jurisdiction', 100).notNullable()
    t.decimal('min_income', 14, 2).notNullable().defaultTo(0)
    t.decimal('max_income', 14, 2).nullable()
    t.decimal('rate', 6, 4).notNullable()
    t.boolean('is_active').notNullable().defaultTo(true)
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
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
    t.uuid('approved_by_id').nullable()
      .references('id').inTable('users').onDelete('SET NULL')
    t.timestamp('approved_at', { useTz: true }).nullable()
    t.timestamp('paid_at', { useTz: true }).nullable()
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
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
    t.decimal('tax_amount', 14, 2).notNullable().defaultTo(0)
    t.decimal('net_pay', 14, 2).notNullable()
    t.string('currency', 10).notNullable().defaultTo('GBP')
    t.date('period_start').notNullable()
    t.date('period_end').notNullable()
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
  await knex.schema.dropTableIfExists('salary_records')
}
