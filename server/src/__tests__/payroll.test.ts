import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';
import { v4 as uuidv4 } from 'uuid';

describe('Payroll API', () => {

  describe('POST /api/payroll/runs', () => {
    it('creates run in draft status (hr_manager)', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app)
        .post('/api/payroll/runs')
        .set('Authorization', token)
        .send({ name: 'Test Run', periodStart: '2026-01-01', periodEnd: '2026-01-31' });
      
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('draft');
    });

    it('returns 400 if periodEnd < periodStart', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app)
        .post('/api/payroll/runs')
        .set('Authorization', token)
        .send({ name: 'Test Run', periodStart: '2026-02-01', periodEnd: '2026-01-31' });
      
      expect(res.status).toBe(400); 
    });
  });

  describe('POST /api/payroll/runs/:id/status', () => {
    it('draft → reviewed', async () => {
      const token = getTestToken('hr_manager');
      const run = await db('payroll_runs').insert({ id: uuidv4(), name: 'Trans', period_start: '2026-01-01', period_end: '2026-01-31', status: 'draft' }).returning('*').then(r => r[0]);
      
      const res = await request(app).post(`/api/payroll/runs/${run.id}/status`).set('Authorization', token).send({ status: 'reviewed' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('reviewed');
    });

    it('reviewed → approved', async () => {
      const token = getTestToken('hr_manager');
      const run = await db('payroll_runs').insert({ id: uuidv4(), name: 'Trans', period_start: '2026-01-01', period_end: '2026-01-31', status: 'reviewed' }).returning('*').then(r => r[0]);
      
      const res = await request(app).post(`/api/payroll/runs/${run.id}/status`).set('Authorization', token).send({ status: 'approved' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });

    it('returns 400 for invalid transition', async () => {
      const token = getTestToken('hr_manager');
      const run = await db('payroll_runs').insert({ id: uuidv4(), name: 'Trans', period_start: '2026-01-01', period_end: '2026-01-31', status: 'draft' }).returning('*').then(r => r[0]);
      
      const res = await request(app).post(`/api/payroll/runs/${run.id}/status`).set('Authorization', token).send({ status: 'approved' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/payroll/employees/:id/salary', () => {
    it('creates salary and keeps history', async () => {
      const token = getTestToken('hr_manager');
      const dept = await db('departments').first();
      const title = await db('job_titles').first();
      const email = `saltest-${uuidv4()}@example.com`;

      const emp = await db('employees').insert({ 
        id: uuidv4(), 
        first_name: 'Sal', 
        last_name: 'Test', 
        email, 
        department_id: dept.id, 
        job_title_id: title.id,
        employment_type: 'full_time',
        status: 'active'
      }).returning('*').then(r => r[0]);
      
      // First salary
      await request(app)
        .post(`/api/payroll/employees/${emp.id}/salary`)
        .set('Authorization', token)
        .send({ baseSalary: 50000, effectiveDate: '2026-01-01', payFrequency: 'monthly', currency: 'GBP', reason: 'Initial' });
      
      // Second salary
      const res = await request(app)
        .post(`/api/payroll/employees/${emp.id}/salary`)
        .set('Authorization', token)
        .send({ baseSalary: 60000, effectiveDate: '2026-06-01', payFrequency: 'monthly', currency: 'GBP', reason: 'Promotion' });
      
      expect(res.status).toBe(201);
      
      // History
      const hist = await request(app).get(`/api/payroll/employees/${emp.id}/compensation-history`).set('Authorization', token);
      expect(hist.body.data.salaries.length).toBe(2);
    });
  });
});
