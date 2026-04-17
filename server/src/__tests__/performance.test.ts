import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';
import { v4 as uuidv4 } from 'uuid';

describe('Performance API', () => {

  describe('POST /api/performance/cycles', () => {
    it('creates cycle (hr_manager)', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app)
        .post('/api/performance/cycles')
        .set('Authorization', token)
        .send({ name: `Cycle-${uuidv4()}`, startDate: '2026-01-01', endDate: '2026-03-31' });
      
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('draft');
    });

    it('returns 403 for employee', async () => {
      const token = getTestToken('employee');
      const res = await request(app)
        .post('/api/performance/cycles')
        .set('Authorization', token)
        .send({ name: '2026 Q2', startDate: '2026-04-01', endDate: '2026-06-30' });
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/performance/cycles/:id/activate', () => {
    it('activates cycle, deactivates others', async () => {
      const token = getTestToken('hr_manager');
      const oldActive = await db('appraisal_cycles').insert({ id: uuidv4(), name: 'Old', start_date: '2025-01-01', end_date: '2025-12-31', status: 'active' }).returning('*').then(r => r[0]);
      const newCycle = await db('appraisal_cycles').insert({ id: uuidv4(), name: 'New', start_date: '2027-01-01', end_date: '2027-12-31', status: 'draft' }).returning('*').then(r => r[0]);

      const res = await request(app).post(`/api/performance/cycles/${newCycle.id}/activate`).set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');

      const checkingOld = await db('appraisal_cycles').where({ id: oldActive.id }).first();
      expect(checkingOld.status).toBe('completed');
    });
  });

  describe('POST /api/performance/appraisals', () => {
    let empId: string;
    let cycleId: string;

    beforeAll(async () => {
      empId = (await db('employees').first()).id;
      cycleId = (await db('appraisal_cycles').first()).id;
    });

    it('creates appraisal', async () => {
      const token = getTestToken('hr_manager');
      // Create new employee and cycle to avoid duplicate
      const dept = await db('departments').first();
      const title = await db('job_titles').first();
      const email = `perf-${uuidv4()}@test.com`;
      const employee = await db('employees').insert({ id: uuidv4(), first_name: 'P', last_name: 'T', email, department_id: dept.id, job_title_id: title.id, employment_type: 'full_time', status: 'active' }).returning('*').then(r => r[0]);
      const cycle = await db('appraisal_cycles').insert({ id: uuidv4(), name: `C-${uuidv4()}`, start_date: '2026-01-01', end_date: '2026-12-31', status: 'active' }).returning('*').then(r => r[0]);

      const res = await request(app)
        .post('/api/performance/appraisals')
        .set('Authorization', token)
        .send({ employeeId: employee.id, cycleId: cycle.id });
      
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('draft');
    });
  });

  describe('Goals & Key Results', () => {
    let goalId: string;
    let employeeId: string;

    beforeAll(async () => {
      employeeId = (await db('employees').first()).id;
    });

    it('POST /api/performance/goals creates goal', async () => {
      const token = getTestToken('employee');
      const cycleId = (await db('appraisal_cycles').first()).id;
      const res = await request(app)
        .post('/api/performance/goals')
        .set('Authorization', token)
        .send({ employeeId, cycleId, title: 'Test Goal', description: 'desc', category: 'project', weight: 100 });
      
      expect(res.status).toBe(201);
      goalId = res.body.data.id;
    });

    it('POST /api/performance/key-results creates key result', async () => {
      const token = getTestToken('employee');
      const res = await request(app)
        .post('/api/performance/key-results')
        .set('Authorization', token)
        .send({ goalId, title: 'KR 1', startValue: 0, targetValue: 10, unit: 'count' });
      
      expect(res.status).toBe(201);
    });

    it('PUT /api/performance/key-results/:id updates value', async () => {
      const token = getTestToken('employee');
      const kr = await db('key_results').where({ goal_id: goalId }).first();
      
      const res = await request(app)
        .put(`/api/performance/key-results/${kr.id}`)
        .set('Authorization', token)
        .send({ currentValue: 5 });
      
      expect(res.status).toBe(200);
      
      const goal = await db('goals').where({ id: goalId }).first();
      expect(Number(goal.completion_percentage)).toBe(50);
    });
  });
});
