import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  const tables = [
    'mandatory_training',
    'training_certificates',
    'learning_plan_items',
    'learning_plans',
    'course_enrolments',
    'courses',
    
    'attendance_logs',
    'leave_requests',
    'leave_entitlements',
    'leave_types',
    
    'goals',
    'appraisals',
    'appraisal_cycles',
    
    'onboarding_tasks',
    'onboarding_checklists',
    'offer_letters',
    'interviews',
    'applications',
    'job_requisitions',
    'candidates',
    
    'payslips',
    'payroll_runs',
    'salary_records',
    
    'employees',
    'job_titles',
    'departments',
    
    'users'
  ];

  for (const table of tables) {
    await knex(table).del();
  }
}
