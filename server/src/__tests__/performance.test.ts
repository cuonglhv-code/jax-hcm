import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';
import { v4 as uuidv4 } from 'uuid';

describe('Performance API', () => {
  let hrToken: string;
  let hrUser: any;
  let emp1: any;
  let emp1Token: string;
  const createdIds: { table: string; id: string }[] = [];

  beforeAll(async () => {
    hrUser = await db('users').where({ email: 'hr1@jaxtina.com' }).first();
    hrToken = getTestToken('hr_manager', { userId: hrUser.id, email: hrUser.email });
    
    emp1 = await db('employees').where({ email: 'emp1@jaxtina.com' }).first();
    const emp1User = await db('users').where({ id: emp1.user_id }).first();
    emp1Token = getTestToken('employee', { userId: emp1User.id, email: emp1User.email, employeeId: emp1.id });
  });

  afterEach(async () => {
    for (const item of [...createdIds].reverse()) {
      await db(item.table).where({ id: item.id }).delete();
    }
    createdIds.length = 0;
  });

  describe('POST /api/performance/cycles', () => {
    it('creates cycle (hr_manager)', async () => {
      const res = await request(app)
        .post('/api/performance/cycles')
        .set('Authorization', hrToken)
        .send({ name: `Cycle-${uuidv4()}`, startDate: '2026-01-01', endDate: '2026-03-31' });
      
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('draft');
      createdIds.push({ table: 'appraisal_cycles', id: res.body.data.id });
    });
  });

  describe('POST /api/performance/cycles/:id/activate', () => {
    it('activates cycle, deactivates others', async () => {
      const oldActive = await db('appraisal_cycles').insert({ id: uuidv4(), name: 'Old', start_date: '2025-01-01', end_date: '2025-12-31', status: 'active' }).returning('*').then(r => r[0]);
      createdIds.push({ table: 'appraisal_cycles', id: oldActive.id });
      
      const newCycle = await db('appraisal_cycles').insert({ id: uuidv4(), name: 'New', start_date: '2027-01-01', end_date: '2027-12-31', status: 'draft' }).returning('*').then(r => r[0]);
      createdIds.push({ table: 'appraisal_cycles', id: newCycle.id });

      const res = await request(app).post(`/api/performance/cycles/${newCycle.id}/activate`).set('Authorization', hrToken);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');

      const checkingOld = await db('appraisal_cycles').where({ id: oldActive.id }).first();
      expect(checkingOld.status).toBe('completed');
    });
  });

  describe('POST /api/performance/appraisals', () => {
    it('creates appraisal', async () => {
      const dept = await db('departments').first();
      const title = await db('job_titles').first();
      const email = `perf-${uuidv4()}@test.com`;
      const employee = await db('employees').insert({ id: uuidv4(), first_name: 'P', last_name: 'T', email, department_id: dept.id, job_title_id: title.id, employment_type: 'full_time', status: 'active', hire_date: '2024-01-01' }).returning('*').then(r => r[0]);
      createdIds.push({ table: 'employees', id: employee.id });
      
      const cycle = await db('appraisal_cycles').insert({ id: uuidv4(), name: `C-${uuidv4()}`, start_date: '2026-01-01', end_date: '2026-12-31', status: 'active' }).returning('*').then(r => r[0]);
      createdIds.push({ table: 'appraisal_cycles', id: cycle.id });

      const res = await request(app)
        .post('/api/performance/appraisals')
        .set('Authorization', hrToken)
        .send({ employeeId: employee.id, cycleId: cycle.id, managerId: hrUser.id });
      
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('draft');
      createdIds.push({ table: 'appraisals', id: res.body.data.id });
    });
  });

  describe('Goals & Key Results', () => {
    let goalId: string;

    it('POST /api/performance/goals creates goal', async () => {
      const cycle = await db('appraisal_cycles').first();
      const res = await request(app)
        .post('/api/performance/goals')
        .set('Authorization', emp1Token)
        .send({ employeeId: emp1.id, cycleId: cycle.id, title: 'Test Goal', description: 'desc', category: 'project', weight: 100 });
      
      expect(res.status).toBe(201);
      goalId = res.body.data.id;
      createdIds.push({ table: 'goals', id: goalId });
    });

    it('POST /api/performance/key-results creates key result', async () => {
      const res = await request(app)
        .post('/api/performance/key-results')
        .set('Authorization', emp1Token)
        .send({ goalId, title: 'KR 1', startValue: 0, targetValue: 10, unit: 'count' });
      
      expect(res.status).toBe(201);
      createdIds.push({ table: 'key_results', id: res.body.data.id });
    });

    it('PUT /api/performance/key-results/:id updates value', async () => {
      const kr = await db('key_results').where({ goal_id: goalId }).first();
      
      const res = await request(app)
        .put(`/api/performance/key-results/${kr.id}`)
        .set('Authorization', emp1Token)
        .send({ currentValue: 5 });
      
      expect(res.status).toBe(200);
      
      const goal = await db('goals').where({ id: goalId }).first();
      expect(Number(goal.completion_percentage)).toBe(50);
    });
  });
});
