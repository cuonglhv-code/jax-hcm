import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';
import { v4 as uuidv4 } from 'uuid';

describe('Learning API', () => {

  describe('GET /api/learning/courses', () => {
    it('returns seeded courses', async () => {
      const token = getTestToken('employee');
      const res = await request(app).get('/api/learning/courses').set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/learning/enrolments', () => {
    let courseId: string;
    let employeeId: string;

    beforeAll(async () => {
      const course = await db('courses').first();
      courseId = course.id;
      const emp = await db('employees').first();
      employeeId = emp.id;
    });

    it('enrols employee in course', async () => {
      const token = getTestToken('hr_manager');
      // Create fresh employee to avoid unique constraint if already enrolled
      const dept = await db('departments').first();
      const title = await db('job_titles').first();
      const email = `lrn-${uuidv4()}@test.com`;
      const emp = await db('employees').insert({ 
        id: uuidv4(), first_name: 'Lrn', last_name: 'Test', email, 
        department_id: dept.id, job_title_id: title.id, 
        employment_type: 'full_time', status: 'active' 
      }).returning('*').then(r => r[0]);

      const res = await request(app)
        .post('/api/learning/enrolments')
        .set('Authorization', token)
        .send({ employeeId: emp.id, courseId });
      
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('not_started');
    });
  });

  describe('PATCH /api/learning/enrolments/:id/status', () => {
    let enrolmentId: string;
    beforeAll(async () => {
      const course = await db('courses').first();
      const dept = await db('departments').first();
      const title = await db('job_titles').first();
      const email = `lrn2-${uuidv4()}@test.com`;
      const emp2 = await db('employees').insert({ 
        id: uuidv4(), first_name: 'Lrn', last_name: 'Test', email, 
        department_id: dept.id, job_title_id: title.id, 
        employment_type: 'full_time', status: 'active' 
      }).returning('*').then(r => r[0]);
      const enr = await db('course_enrolments').insert({ 
        id: uuidv4(), employee_id: emp2.id, course_id: course.id, status: 'not_started' 
      }).returning('*').then(r => r[0]);
      enrolmentId = enr.id;
    });

    it('in_progress sets started_at', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app)
        .patch(`/api/learning/enrolments/${enrolmentId}/status`)
        .set('Authorization', token)
        .send({ status: 'in_progress' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.startedAt).toBeDefined();
    });

    it('completed sets completed_at', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app)
        .patch(`/api/learning/enrolments/${enrolmentId}/status`)
        .set('Authorization', token)
        .send({ status: 'completed' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.completedAt).toBeDefined();
    });
  });
});
