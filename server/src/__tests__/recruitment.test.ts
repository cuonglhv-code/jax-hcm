import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';
import { v4 as uuidv4 } from 'uuid';

describe('Recruitment API', () => {

  describe('POST /api/recruitment/candidates', () => {
    it('creates candidate (hr_manager)', async () => {
      const token = getTestToken('hr_manager');
      const email = `test-${uuidv4()}@example.com`;
      const res = await request(app)
        .post('/api/recruitment/candidates')
        .set('Authorization', token)
        .send({ firstName: 'John', lastName: 'Doe', email, phone: '0123456789' });
      
      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
    });

    it('returns 403 for employee-role', async () => {
      const token = getTestToken('employee');
      const res = await request(app)
        .post('/api/recruitment/candidates')
        .set('Authorization', token)
        .send({ firstName: 'J', lastName: 'D', email: 'jd@example.com' });
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/recruitment/applications', () => {
    it('creates application linking candidate + requisition', async () => {
      const token = getTestToken('hr_manager');
      const candidateId = uuidv4();
      await db('candidates').insert({ id: candidateId, first_name: 'App', last_name: 'Test', email: `${candidateId}@test.com` });
      const requisition = await db('job_requisitions').where('status', 'open').first();
      
      const res = await request(app)
        .post('/api/recruitment/applications')
        .set('Authorization', token)
        .send({ candidateId, requisitionId: requisition.id, notes: 'Good fit' });
      
      expect(res.status).toBe(201);
      expect(res.body.data.stage).toBe('applied');
    });
  });

  describe('POST /api/recruitment/applications/:id/advance', () => {
    let appId: string;
    beforeAll(async () => {
      const candidateId = uuidv4();
      await db('candidates').insert({ id: candidateId, first_name: 'Staging', last_name: 'Test', email: `${candidateId}@test.com` });
      const requisition = await db('job_requisitions').first();
      const appRecord = await db('applications').insert({ id: uuidv4(), candidate_id: candidateId, requisition_id: requisition.id, stage: 'applied' }).returning('*').then(r => r[0]);
      appId = appRecord.id;
    });

    it('advances stage: applied → screening', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).post(`/api/recruitment/applications/${appId}/advance`).set('Authorization', token).send({ stage: 'screening' });
      expect(res.status).toBe(200);
      expect(res.body.data.stage).toBe('screening');
    });

    it('advances: screening → interview', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).post(`/api/recruitment/applications/${appId}/advance`).set('Authorization', token).send({ stage: 'interview' });
      expect(res.status).toBe(200);
      expect(res.body.data.stage).toBe('interview');
    });

    it('returns 400 for invalid backward transition', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).post(`/api/recruitment/applications/${appId}/advance`).set('Authorization', token).send({ stage: 'applied' });
      expect(res.status).toBe(400);
    });

    it('can always advance to rejected from any stage', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).post(`/api/recruitment/applications/${appId}/advance`).set('Authorization', token).send({ stage: 'rejected' });
      expect(res.status).toBe(200);
      expect(res.body.data.stage).toBe('rejected');
    });
  });

  describe('POST /api/recruitment/applications/:id/convert', () => {
    it('returns 400 if application stage !== hired', async () => {
      const token = getTestToken('hr_manager');
      const candidateId = uuidv4();
      await db('candidates').insert({ id: candidateId, first_name: 'NotHired', last_name: 'Test', email: `${candidateId}@t.com` });
      const req = await db('job_requisitions').first();
      const applicationId = uuidv4();
      await db('applications').insert({ id: applicationId, candidate_id: candidateId, requisition_id: req.id, stage: 'interview' });

      const res = await request(app).post(`/api/recruitment/applications/${applicationId}/convert`).set('Authorization', token).send({
        employmentType: 'full_time',
        baseSalary: 50000,
        currency: 'GBP',
        departmentId: req.department_id,
        jobTitleId: uuidv4(), // Optional or mock
        hireDate: '2024-06-01'
      });
      expect(res.status).toBe(400);
    });

    it('creates user + employee record from hired candidate', async () => {
      const token = getTestToken('hr_manager');
      const candidateId = uuidv4();
      await db('candidates').insert({ id: candidateId, first_name: 'Hired', last_name: 'Test', email: `${candidateId}@t.com` });
      const req = await db('job_requisitions').first();
      const title = await db('job_titles').first();
      const appId = uuidv4();
      await db('applications').insert({ id: appId, candidate_id: candidateId, requisition_id: req.id, stage: 'hired' });
      await db('offer_letters').insert({ 
        id: uuidv4(), 
        application_id: appId, 
        status: 'accepted', 
        salary: 60000,
        start_date: '2024-06-01'
      });

      const res = await request(app).post(`/api/recruitment/applications/${appId}/convert`).set('Authorization', token).send({
        employmentType: 'full_time',
        baseSalary: 60000,
        currency: 'GBP',
        departmentId: req.department_id,
        jobTitleId: title.id,
        hireDate: '2024-06-01'
      });
      
      expect(res.status).toBe(201);
      const newEmpId = res.body.data.id;
      
      const user = await db('users').where({ email: `${candidateId}@t.com` }).first();
      expect(user).toBeDefined();

      const checklist = await db('onboarding_checklists').where({ employee_id: newEmpId }).first();
      expect(checklist).toBeDefined();
    });
  });

  describe('Onboarding', () => {
    let empId: string;
    beforeAll(async () => {
      const checklist = await db('onboarding_checklists').first();
      empId = checklist.employee_id;
    });

    it('GET /api/recruitment/onboarding/:employeeId returns checklist', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).get(`/api/recruitment/onboarding/${empId}`).set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBeGreaterThan(0);
    });

    it('PATCH /api/recruitment/onboarding/tasks/:taskId marks task complete', async () => {
      const token = getTestToken('hr_manager');
      const checklist = await db('onboarding_checklists').where({ employee_id: empId }).first();
      const task = await db('onboarding_tasks').where({ checklist_id: checklist.id }).first();
      
      const res = await request(app).patch(`/api/recruitment/onboarding/tasks/${task.id}`).set('Authorization', token).send({ completed: true });
      expect(res.status).toBe(200);
      expect(res.body.data.completed_at || res.body.data.completedAt).toBeDefined();
    });
  });
});
