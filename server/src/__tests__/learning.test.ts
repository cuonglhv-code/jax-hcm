import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';
import { v4 as uuidv4 } from 'uuid';

describe('Learning API', () => {
  let hrToken: string;
  let emp1: any;
  const createdIds: { table: string; id: string }[] = [];

  beforeAll(async () => {
    const hrUser = await db('users').where({ email: 'hr1@jaxtina.com' }).first();
    hrToken = getTestToken('hr_manager', { userId: hrUser.id, email: hrUser.email });
    
    emp1 = await db('employees').where({ email: 'emp1@jaxtina.com' }).first();
  });

  afterEach(async () => {
    for (const item of [...createdIds].reverse()) {
      await db(item.table).where({ id: item.id }).delete();
    }
    createdIds.length = 0;
  });

  describe('GET /api/learning/courses', () => {
    it('returns seeded courses', async () => {
      const token = getTestToken('employee');
      const res = await request(app).get('/api/learning/courses').set('Authorization', token);
      if (res.status !== 200) console.log('COURSES ERROR 500:', res.body);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/learning/enrolments', () => {
    it('enrols employee in course', async () => {
      const course = await db('courses').first();
      // Use a fresh employee for this test
      const dept = await db('departments').first();
      const title = await db('job_titles').first();
      const email = `lrn-${uuidv4()}@test.com`;
      const emp = await db('employees').insert({ 
        id: uuidv4(), first_name: 'Lrn', last_name: 'Test', email, 
        department_id: dept.id, job_title_id: title.id, 
        employment_type: 'full_time', status: 'active', hire_date: '2024-01-01'
      }).returning('*').then(r => r[0]);
      createdIds.push({ table: 'employees', id: emp.id });

      const res = await request(app)
        .post('/api/learning/enrolments')
        .set('Authorization', hrToken)
        .send({ employeeId: emp.id, courseId: course.id });
      
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('enrolled');
      createdIds.push({ table: 'course_enrolments', id: res.body.data.id });
    });
  });

  describe('PATCH /api/learning/enrolments/:id/status', () => {
    let enrolmentId: string;
    
    beforeEach(async () => {
      const course = await db('courses').first();
      const dept = await db('departments').first();
      const title = await db('job_titles').first();
      const email = `lrn-upd-${uuidv4()}@test.com`;
      const emp = await db('employees').insert({ 
        id: uuidv4(), first_name: 'Lrn', last_name: 'Test', email, 
        department_id: dept.id, job_title_id: title.id, 
        employment_type: 'full_time', status: 'active', hire_date: '2024-01-01'
      }).returning('*').then(r => r[0]);
      createdIds.push({ table: 'employees', id: emp.id });

      const enr = await db('course_enrolments').insert({ 
        id: uuidv4(), employee_id: emp.id, course_id: course.id, status: 'enrolled' 
      }).returning('*').then(r => r[0]);
      enrolmentId = enr.id;
      createdIds.push({ table: 'course_enrolments', id: enrolmentId });
    });

    it('in_progress sets started_at', async () => {
      const res = await request(app)
        .patch(`/api/learning/enrolments/${enrolmentId}/status`)
        .set('Authorization', hrToken)
        .send({ status: 'in_progress' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.started_at).toBeDefined();
    });

    it('completed sets completed_at', async () => {
      const res = await request(app)
        .patch(`/api/learning/enrolments/${enrolmentId}/status`)
        .set('Authorization', hrToken)
        .send({ status: 'completed' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.completed_at).toBeDefined();
    });
  });
});
