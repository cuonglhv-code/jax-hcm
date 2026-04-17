import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';
import { v4 as uuidv4 } from 'uuid';

describe('Payroll API', () => {
  let hrToken: string;
  let adminUserId: string;
  let emp1: any;
  const createdIds: { table: string; id: string }[] = [];

  beforeAll(async () => {
    const hrUser = await db('users').where({ email: 'hr1@jaxtina.com' }).first();
    hrToken = getTestToken('hr_manager', { userId: hrUser.id, email: hrUser.email });
    
    adminUserId = (await db('users').where({ email: 'admin@jaxtina.com' }).first()).id;
    emp1 = await db('employees').where({ email: 'emp1@jaxtina.com' }).first();
    
    if (!emp1) throw new Error('emp1@jaxtina.com not found in seeds');
  });

  afterEach(async () => {
    for (const item of [...createdIds].reverse()) {
      await db(item.table).where({ id: item.id }).delete();
    }
    createdIds.length = 0;
  });

  describe('POST /api/payroll/runs', () => {
    it('creates run in draft status and auto-generates payslips', async () => {
      const res = await request(app)
        .post('/api/payroll/runs')
        .set('Authorization', hrToken)
        .send({ name: 'May 2026 Run', periodStart: '2026-05-01', periodEnd: '2026-05-31' });
      
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('draft');
      createdIds.push({ table: 'payroll_runs', id: res.body.data.id });

      // Check if payslips were generated
      const payslips = await db('payslips').where({ payroll_run_id: res.body.data.id });
      expect(payslips.length).toBeGreaterThan(0);
      
      // Net pay calculation check
      const p = payslips[0];
      const expectedNet = Number(p.gross_pay) - Number(p.total_deductions) - Number(p.tax) - Number(p.national_insurance);
      expect(Number(p.net_pay)).toBeCloseTo(expectedNet);
    });

    it('returns 400 if periodEnd < periodStart', async () => {
      const res = await request(app)
        .post('/api/payroll/runs')
        .set('Authorization', hrToken)
        .send({ name: 'Invalid Run', periodStart: '2026-02-01', periodEnd: '2026-01-31' });
      
      expect(res.status).toBe(400); 
    });
  });

  describe('PUT /api/payroll/runs/:id/status', () => {
    it('draft → reviewed', async () => {
      const run = await db('payroll_runs').insert({ 
        id: uuidv4(), name: 'Trans 1', period_start: '2026-01-01', period_end: '2026-01-31', status: 'draft', created_by: adminUserId
      }).returning('*').then(r => r[0]);
      createdIds.push({ table: 'payroll_runs', id: run.id });
      
      const res = await request(app)
        .put(`/api/payroll/runs/${run.id}/status`)
        .set('Authorization', hrToken)
        .send({ status: 'reviewed' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('reviewed');
    });

    it('reviewed → approved', async () => {
      const run = await db('payroll_runs').insert({ 
        id: uuidv4(), name: 'Trans 2', period_start: '2026-01-01', period_end: '2026-01-31', status: 'reviewed', created_by: adminUserId
      }).returning('*').then(r => r[0]);
      createdIds.push({ table: 'payroll_runs', id: run.id });
      
      const res = await request(app)
        .put(`/api/payroll/runs/${run.id}/status`)
        .set('Authorization', hrToken)
        .send({ status: 'approved' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });
  });

  describe('Salary & History', () => {
    it('creates salary and keeps history', async () => {
      const empId = emp1.id;
      
      // First salary update via API
      await request(app)
        .post(`/api/payroll/employees/${empId}/salary`)
        .set('Authorization', hrToken)
        .send({ baseSalary: 55000, effectiveDate: '2026-01-01', payFrequency: 'monthly', currency: 'GBP', reason: 'Yearly Increase' });
      
      // Second salary update via API
      const res = await request(app)
        .post(`/api/payroll/employees/${empId}/salary`)
        .set('Authorization', hrToken)
        .send({ baseSalary: 60000, effectiveDate: '2026-06-01', payFrequency: 'monthly', currency: 'GBP', reason: 'Promotion' });
      
      expect(res.status).toBe(201);
      
      const histRes = await request(app)
        .get(`/api/payroll/employees/${empId}/compensation-history`)
        .set('Authorization', hrToken);
      if (histRes.status !== 200) console.log('HISTORY ERROR 500:', histRes.body);
      expect(histRes.status).toBe(200);
      expect(histRes.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
