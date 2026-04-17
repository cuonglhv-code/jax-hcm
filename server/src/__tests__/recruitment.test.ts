import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';
import { v4 as uuidv4 } from 'uuid';

describe('Recruitment API', () => {
  let hrToken: string;
  let hrUser: any;
  const createdIds: { table: string; id: string }[] = [];

  beforeAll(async () => {
    hrUser = await db('users').where({ email: 'hr1@jaxtina.com' }).first();
    hrToken = getTestToken('hr_manager', { userId: hrUser.id, email: hrUser.email });
  });

  afterEach(async () => {
    // Delete in reverse FK order
    for (const item of [...createdIds].reverse()) {
      await db(item.table).where({ id: item.id }).delete();
    }
    createdIds.length = 0;
  });

  describe('POST /api/recruitment/candidates', () => {
    it('creates candidate (hr_manager)', async () => {
      const email = `test-${uuidv4()}@example.com`;
      const res = await request(app)
        .post('/api/recruitment/candidates')
        .set('Authorization', hrToken)
        .send({ firstName: 'John', lastName: 'Doe', email, phone: '0123456789' });
      
      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      createdIds.push({ table: 'candidates', id: res.body.data.id });
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
      const candidateId = uuidv4();
      await db('candidates').insert({ id: candidateId, first_name: 'App', last_name: 'Test', email: `${candidateId}@test.com` });
      createdIds.push({ table: 'candidates', id: candidateId });
      
      const requisition = await db('job_requisitions').where('status', 'open').first();
      if (!requisition) {
        // Create one if seeds didn't provide
        const dept = await db('departments').first();
        const reqId = uuidv4();
        await db('job_requisitions').insert({
          id: reqId,
          title: 'Software Engineer',
          department_id: dept.id,
          status: 'open',
          created_by: hrUser.id
        });
        createdIds.push({ table: 'job_requisitions', id: reqId });
      }
      
      const latestReq = await db('job_requisitions').where('status', 'open').first();

      const res = await request(app)
        .post('/api/recruitment/applications')
        .set('Authorization', hrToken)
        .send({ candidateId, requisitionId: latestReq.id, notes: 'Good fit' });
      
      expect(res.status).toBe(201);
      expect(res.body.data.stage).toBe('applied');
      createdIds.push({ table: 'applications', id: res.body.data.id });
    });
  });

  describe('POST /api/recruitment/applications/:id/advance', () => {
    let appId: string;
    
    beforeEach(async () => {
      const candidateId = uuidv4();
      await db('candidates').insert({ id: candidateId, first_name: 'Staging', last_name: 'Test', email: `${candidateId}@test.com` });
      createdIds.push({ table: 'candidates', id: candidateId });
      
      const requisition = await db('job_requisitions').first();
      appId = uuidv4();
      await db('applications').insert({ id: appId, candidate_id: candidateId, requisition_id: requisition.id, stage: 'applied' });
      createdIds.push({ table: 'applications', id: appId });
    });

    it('advances stage: applied → screening', async () => {
      const res = await request(app).post(`/api/recruitment/applications/${appId}/advance`).set('Authorization', hrToken).send({ stage: 'screening' });
      expect(res.status).toBe(200);
      expect(res.body.data.stage).toBe('screening');
    });

    it('advances: screening → interview', async () => {
      // First advance to screening manually since we start at applied
      await db('applications').where({ id: appId }).update({ stage: 'screening' });
      
      const res = await request(app).post(`/api/recruitment/applications/${appId}/advance`).set('Authorization', hrToken).send({ stage: 'interview' });
      expect(res.status).toBe(200);
      expect(res.body.data.stage).toBe('interview');
    });

    it('returns 400 for invalid backward transition', async () => {
      // Set to interview
      await db('applications').where({ id: appId }).update({ stage: 'interview' });
      
      const res = await request(app).post(`/api/recruitment/applications/${appId}/advance`).set('Authorization', hrToken).send({ stage: 'applied' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/recruitment/applications/:id/convert', () => {
    it('creates user + employee record from hired candidate', async () => {
      const candidateId = uuidv4();
      const email = `${candidateId}@t.com`;
      await db('candidates').insert({ id: candidateId, first_name: 'Hired', last_name: 'Test', email });
      createdIds.push({ table: 'candidates', id: candidateId });
      
      const req = await db('job_requisitions').first();
      const title = await db('job_titles').first();
      const appId = uuidv4();
      await db('applications').insert({ id: appId, candidate_id: candidateId, requisition_id: req.id, stage: 'hired' });
      createdIds.push({ table: 'applications', id: appId });
      
      const res = await request(app).post(`/api/recruitment/applications/${appId}/convert`).set('Authorization', hrToken).send({
        employmentType: 'full_time',
        baseSalary: 60000,
        currency: 'GBP',
        departmentId: req.department_id,
        jobTitleId: title.id,
        hireDate: '2024-06-01'
      });
      
      expect(res.status).toBe(201);
      const newEmpId = res.body.data.id;
      createdIds.push({ table: 'employees', id: newEmpId });
      
      // The convert process also creates a user
      const user = await db('users').where({ email }).first();
      expect(user).toBeDefined();
      if (user) createdIds.push({ table: 'users', id: user.id });

      const checklist = await db('onboarding_checklists').where({ employee_id: newEmpId }).first();
      expect(checklist).toBeDefined();
      if (checklist) createdIds.push({ table: 'onboarding_checklists', id: checklist.id });
    });
  });
});
