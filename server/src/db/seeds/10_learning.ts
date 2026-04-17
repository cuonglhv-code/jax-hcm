import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  const courses = [];
  for (let i = 1; i <= 10; i++) {
    courses.push({
      id: uuidv4(),
      title: `Course ${i}: Information Security`,
      description: 'Understanding infosec basics.',
      type: 'internal',
      provider: 'Internal',
      duration_hours: 2.5,
      is_mandatory: true
    });
  }

  await knex('courses').insert(courses);

  const employees = await knex('employees').select('id');
  const enrolments = [];
  const statuses = ['enrolled', 'in_progress', 'completed'];

  for (let i = 0; i < 40; i++) {
    const courseId = courses[i % courses.length].id;
    const empId = employees[i % employees.length].id;
    
    enrolments.push({
      id: uuidv4(),
      course_id: courseId,
      employee_id: empId,
      status: statuses[i % statuses.length],
      completed_at: statuses[i % statuses.length] === 'completed' ? knex.fn.now() : null
    });
  }

  await knex('course_enrolments').insert(enrolments);
  
  // Create certificates for completed enrolments
  const completed = enrolments.filter(e => e.status === 'completed');
  const certs = completed.map(e => ({
    enrolment_id: e.id,
    employee_id: e.employee_id,
    course_id: e.course_id,
    certificate_number: `CERT-SEED-${Math.random().toString(36).substring(7).toUpperCase()}`,
    issued_at: knex.fn.now()
  }));

  if (certs.length > 0) {
    await knex('training_certificates').insert(certs);
  }

  const superAdmin = await knex('users').where('role', 'super_admin').first();
  if (!superAdmin) return;

  const planId = uuidv4();
  await knex('learning_plans').insert({
    id: planId,
    name: 'Onboarding Track',
    created_by_id: superAdmin.id
  });

  const planItems = [];
  for (let i = 0; i < 3; i++) {
    planItems.push({
      plan_id: planId,
      course_id: courses[i].id,
      order: i,
      is_required: true,
    });
  }
  
  await knex('learning_plan_items').insert(planItems);

  await knex('mandatory_training').insert({
    id: uuidv4(),
    course_id: courses[0].id,
    renewal_period_days: 365
  });
}
