import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// ─── Stable IDs for referencing ──────────────────────────────────────────────
const DEPT_ENG = uuidv4(); const DEPT_SALES = uuidv4();
const DEPT_HR = uuidv4();  const DEPT_FIN = uuidv4(); const DEPT_OPS = uuidv4();

const JT = { engLead: uuidv4(), engSr: uuidv4(), engJr: uuidv4(),
  salesMgr: uuidv4(), salesRep: uuidv4(), hrMgr: uuidv4(), hrBp: uuidv4(),
  finCtrl: uuidv4(), finAna: uuidv4(), opsDir: uuidv4(), opsCo: uuidv4() };

const USER_ADMIN = uuidv4(); const USER_HR_MGR = uuidv4();
const USER_LINE_MGR = uuidv4(); const USER_EMP = uuidv4();

const EMP_ADMIN = uuidv4(); const EMP_HR_MGR = uuidv4();
const EMP_LINE_MGR = uuidv4(); const EMP_BASIC = uuidv4();

const firstNames = ['Alice','Bob','Charlie','Diana','Edward','Fiona','George','Hannah',
  'Ivan','Julia','Kevin','Laura','Michael','Nina','Oscar','Priya','Quinn','Rachel',
  'Samuel','Tara','Uma','Victor','Wendy','Xander','Yasmine','Zoe','Aiden','Bella',
  'Connor','Daisy','Ethan','Farida','Grant','Helen','Isak','Jade','Kyle','Lena',
  'Marcus','Naomi','Oliver','Petra','Rashid','Silvia','Tom','Ursula','Wade','Xia'];
const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis',
  'Wilson','Taylor','Anderson','Thomas','Jackson','White','Harris','Martin','Lee','Walker',
  'Patel','Hall','Young','Allen','King','Wright','Lopez','Hill','Scott','Green',
  'Adams','Baker','Nelson','Carter','Mitchell','Parker','Evans','Turner','Collins','Stewart',
  'Morris','Rogers','Reed','Cook','Bell','Murphy','Bailey','Cooper','Howard','Ward'];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

const deptJobMap: Record<string, string[]> = {
  [DEPT_ENG]: [JT.engLead, JT.engSr, JT.engJr],
  [DEPT_SALES]: [JT.salesMgr, JT.salesRep],
  [DEPT_HR]: [JT.hrMgr, JT.hrBp],
  [DEPT_FIN]: [JT.finCtrl, JT.finAna],
  [DEPT_OPS]: [JT.opsDir, JT.opsCo],
};
const deptIds = [DEPT_ENG, DEPT_SALES, DEPT_HR, DEPT_FIN, DEPT_OPS];

export async function seed(knex: Knex): Promise<void> {
  // Clean (in reverse FK order)
  const tables = ['learning_plan_assignments','learning_plan_courses','learning_plans',
    'training_certificates','course_enrolments','courses','attendance_logs','public_holidays',
    'leave_requests','leave_entitlements','leave_types','key_results','goals',
    'assessment_responses','appraisals','assessment_questions','rating_scales','appraisal_cycles',
    'onboarding_checklist_items','onboarding_checklists','offer_letters','interviews',
    'candidate_pipeline_stages','candidates','job_requisitions','payslips','payroll_runs',
    'deductions','allowances','compensation_history','salary_records','audit_logs',
    'employee_documents','refresh_tokens','users','employees','job_titles','departments'];
  for (const t of tables) {
    await knex(t).del().catch(() => {});
  }

  // ─── Departments ────────────────────────────────────────────────────────────
  await knex('departments').insert([
    { id: DEPT_ENG,  name: 'Engineering',  code: 'ENG' },
    { id: DEPT_SALES, name: 'Sales',       code: 'SAL' },
    { id: DEPT_HR,   name: 'HR',           code: 'HR'  },
    { id: DEPT_FIN,  name: 'Finance',      code: 'FIN' },
    { id: DEPT_OPS,  name: 'Operations',   code: 'OPS' },
  ]);

  // ─── Job Titles ─────────────────────────────────────────────────────────────
  await knex('job_titles').insert([
    { id: JT.engLead,  title: 'Engineering Lead',       department_id: DEPT_ENG,  level: 4 },
    { id: JT.engSr,    title: 'Senior Engineer',         department_id: DEPT_ENG,  level: 3 },
    { id: JT.engJr,    title: 'Junior Engineer',         department_id: DEPT_ENG,  level: 1 },
    { id: JT.salesMgr, title: 'Sales Manager',           department_id: DEPT_SALES, level: 4 },
    { id: JT.salesRep, title: 'Sales Representative',    department_id: DEPT_SALES, level: 2 },
    { id: JT.hrMgr,    title: 'HR Manager',              department_id: DEPT_HR,   level: 4 },
    { id: JT.hrBp,     title: 'HR Business Partner',     department_id: DEPT_HR,   level: 3 },
    { id: JT.finCtrl,  title: 'Financial Controller',    department_id: DEPT_FIN,  level: 4 },
    { id: JT.finAna,   title: 'Financial Analyst',       department_id: DEPT_FIN,  level: 2 },
    { id: JT.opsDir,   title: 'Operations Director',     department_id: DEPT_OPS,  level: 5 },
    { id: JT.opsCo,    title: 'Operations Coordinator',  department_id: DEPT_OPS,  level: 2 },
  ]);

  // ─── Seed employees for demo users ─────────────────────────────────────────
  const coreEmployees = [
    { id: EMP_ADMIN, employee_number: 'EMP-2024-0001', first_name: 'Admin', last_name: 'User',
      email: 'admin@jaxtina.com', department_id: DEPT_HR, job_title_id: JT.hrMgr,
      employment_type: 'full_time', status: 'active', start_date: '2020-01-01' },
    { id: EMP_HR_MGR, employee_number: 'EMP-2024-0002', first_name: 'Sarah', last_name: 'Chen',
      email: 'manager@jaxtina.com', department_id: DEPT_HR, job_title_id: JT.hrBp,
      employment_type: 'full_time', status: 'active', start_date: '2021-06-15' },
    { id: EMP_LINE_MGR, employee_number: 'EMP-2024-0003', first_name: 'James', last_name: 'Wilson',
      email: 'linemanager@jaxtina.com', department_id: DEPT_ENG, job_title_id: JT.engLead,
      employment_type: 'full_time', status: 'active', start_date: '2019-03-01' },
    { id: EMP_BASIC, employee_number: 'EMP-2024-0004', first_name: 'Emily', last_name: 'Parker',
      email: 'employee@jaxtina.com', department_id: DEPT_ENG, job_title_id: JT.engJr,
      manager_id: EMP_LINE_MGR, employment_type: 'full_time', status: 'active', start_date: '2023-09-01' },
  ];
  await knex('employees').insert(coreEmployees);

  // ─── Users ──────────────────────────────────────────────────────────────────
  const hash = async (pw: string) => bcrypt.hash(pw, 10);
  await knex('users').insert([
    { id: USER_ADMIN,    email: 'admin@jaxtina.com',      password_hash: await hash('Admin@123'),   role: 'super_admin',  employee_id: EMP_ADMIN },
    { id: USER_HR_MGR,  email: 'manager@jaxtina.com',    password_hash: await hash('Manager@123'), role: 'hr_manager',   employee_id: EMP_HR_MGR },
    { id: USER_LINE_MGR, email: 'linemanager@jaxtina.com', password_hash: await hash('Manager@123'), role: 'line_manager', employee_id: EMP_LINE_MGR },
    { id: USER_EMP,     email: 'employee@jaxtina.com',   password_hash: await hash('Emp@123'),     role: 'employee',     employee_id: EMP_BASIC },
  ]);

  // ─── 46 additional employees ─────────────────────────────────────────────
  const allEmpIds = [EMP_ADMIN, EMP_HR_MGR, EMP_LINE_MGR, EMP_BASIC];
  const managers = [EMP_LINE_MGR, EMP_HR_MGR];
  const bulk: Record<string, unknown>[] = [];
  for (let i = 5; i <= 50; i++) {
    const empId = uuidv4();
    allEmpIds.push(empId);
    const deptId = deptIds[i % deptIds.length];
    const jtArr = deptJobMap[deptId];
    const startYear = 2018 + (i % 6);
    bulk.push({
      id: empId,
      employee_number: `EMP-2024-${String(i).padStart(4, '0')}`,
      first_name: firstNames[i % firstNames.length],
      last_name: lastNames[(i * 3) % lastNames.length],
      email: `emp${i}@jaxtina.com`,
      department_id: deptId,
      job_title_id: jtArr[i % jtArr.length],
      manager_id: i % 8 === 0 ? null : managers[i % managers.length],
      employment_type: i % 10 === 0 ? 'contract' : i % 7 === 0 ? 'part_time' : 'full_time',
      status: i % 15 === 0 ? 'inactive' : 'active',
      start_date: `${startYear}-${String((i % 12) + 1).padStart(2, '0')}-01`,
    });
  }
  await knex('employees').insert(bulk);

  // ─── Salary records ──────────────────────────────────────────────────────
  const baseSalaries = [65000, 72000, 55000, 48000, 90000, 45000, 58000, 80000, 62000, 52000];
  for (let i = 0; i < allEmpIds.length; i++) {
    await knex('salary_records').insert({
      id: uuidv4(), employee_id: allEmpIds[i],
      base_salary: baseSalaries[i % baseSalaries.length] + (i * 500),
      currency: 'GBP', pay_frequency: 'monthly',
      effective_date: '2024-01-01', created_by: USER_ADMIN,
    });
  }

  // ─── Leave Types ──────────────────────────────────────────────────────────
  const LEAVE_ANNUAL = uuidv4(); const LEAVE_SICK = uuidv4();
  const LEAVE_PARENTAL = uuidv4(); const LEAVE_UNPAID = uuidv4();
  await knex('leave_types').insert([
    { id: LEAVE_ANNUAL, name: 'Annual Leave', code: 'AL', default_entitlement_days: 25, is_paid: true, requires_approval: true, allow_carry_over: true, max_carry_over_days: 5, color: '#4361ee' },
    { id: LEAVE_SICK, name: 'Sick Leave', code: 'SL', default_entitlement_days: 10, is_paid: true, requires_approval: false, color: '#ef4444' },
    { id: LEAVE_PARENTAL, name: 'Parental Leave', code: 'PL', default_entitlement_days: 90, is_paid: true, requires_approval: true, color: '#8b5cf6' },
    { id: LEAVE_UNPAID, name: 'Unpaid Leave', code: 'UL', default_entitlement_days: 30, is_paid: false, requires_approval: true, color: '#6b7280' },
  ]);

  // Leave entitlements for all employees
  for (const empId of allEmpIds) {
    await knex('leave_entitlements').insert([
      { id: uuidv4(), employee_id: empId, leave_type_id: LEAVE_ANNUAL, year: 2025, entitled_days: 25, used_days: Math.floor(Math.random() * 10), carried_over_days: Math.floor(Math.random() * 3) },
      { id: uuidv4(), employee_id: empId, leave_type_id: LEAVE_SICK, year: 2025, entitled_days: 10, used_days: Math.floor(Math.random() * 3), carried_over_days: 0 },
    ]);
  }

  // Sample leave requests
  for (let i = 0; i < 10; i++) {
    await knex('leave_requests').insert({
      id: uuidv4(), employee_id: allEmpIds[i + 4],
      leave_type_id: LEAVE_ANNUAL, start_date: `2025-0${(i % 8) + 1}-10`,
      end_date: `2025-0${(i % 8) + 1}-14`, days_requested: 5,
      reason: 'Annual holiday', status: i < 5 ? 'requested' : 'approved',
      reviewed_by: i >= 5 ? USER_HR_MGR : null, reviewed_at: i >= 5 ? new Date() : null,
    });
  }

  // ─── Public Holidays (UK 2025) ────────────────────────────────────────────
  const holidays2025 = [
    ['New Year\'s Day', '2025-01-01'],
    ['Good Friday', '2025-04-18'],
    ['Easter Monday', '2025-04-21'],
    ['Early May Bank Holiday', '2025-05-05'],
    ['Spring Bank Holiday', '2025-05-26'],
    ['Summer Bank Holiday', '2025-08-25'],
    ['Christmas Day', '2025-12-25'],
    ['Boxing Day', '2025-12-26'],
  ];
  await knex('public_holidays').insert(
    holidays2025.map(([name, date]) => ({ id: uuidv4(), name, date, region: 'UK', year: 2025 }))
  );

  // ─── Courses ──────────────────────────────────────────────────────────────
  const COURSE1 = uuidv4(); const COURSE2 = uuidv4(); const COURSE3 = uuidv4();
  const COURSE4 = uuidv4(); const COURSE5 = uuidv4();
  await knex('courses').insert([
    { id: COURSE1, title: 'Health & Safety Essentials', type: 'internal', duration_hours: 4, is_mandatory: true, expires_after_months: 12 },
    { id: COURSE2, title: 'Data Protection & GDPR', type: 'online', duration_hours: 2, is_mandatory: true, expires_after_months: 24 },
    { id: COURSE3, title: 'Leadership Fundamentals', type: 'internal', duration_hours: 16, is_mandatory: false, provider: 'Internal L&D' },
    { id: COURSE4, title: 'Advanced TypeScript', type: 'online', duration_hours: 12, is_mandatory: false, provider: 'Udemy' },
    { id: COURSE5, title: 'Project Management Professional (PMP)', type: 'certification', duration_hours: 40, is_mandatory: false, provider: 'PMI', expires_after_months: 36 },
  ]);

  // Enrolments
  for (let i = 0; i < Math.min(20, allEmpIds.length); i++) {
    await knex('course_enrolments').insert({
      id: uuidv4(), course_id: i % 2 === 0 ? COURSE1 : COURSE2,
      employee_id: allEmpIds[i], status: i < 10 ? 'completed' : 'enrolled',
      enrolled_at: new Date('2025-01-15'),
      completed_at: i < 10 ? new Date('2025-02-01') : null,
    }).catch(() => {}); // ignore duplicate constraint
  }

  // ─── Appraisal Cycle ──────────────────────────────────────────────────────
  const CYCLE1 = uuidv4();
  await knex('appraisal_cycles').insert({
    id: CYCLE1, name: 'Annual Appraisal 2025', frequency: 'annual',
    start_date: '2025-01-01', end_date: '2025-12-31',
    self_assessment_deadline: '2025-11-30', manager_review_deadline: '2025-12-15',
    is_active: true,
  });

  // ─── Job Requisitions ─────────────────────────────────────────────────────
  await knex('job_requisitions').insert([
    { id: uuidv4(), title: 'Senior Backend Engineer', department_id: DEPT_ENG, headcount: 2, status: 'open', created_by: USER_ADMIN, closing_date: '2025-06-30' },
    { id: uuidv4(), title: 'Sales Development Representative', department_id: DEPT_SALES, headcount: 3, status: 'open', created_by: USER_ADMIN, closing_date: '2025-05-31' },
    { id: uuidv4(), title: 'HR Business Partner', department_id: DEPT_HR, headcount: 1, status: 'on_hold', created_by: USER_HR_MGR },
  ]);

  console.log('✅ Seed complete: 50 employees, leave types, courses, appraisal cycle, requisitions seeded.');
}
