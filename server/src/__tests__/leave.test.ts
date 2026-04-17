import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';
import { v4 as uuidv4 } from 'uuid';

describe('Leave API', () => {
  let empUserId: string;
  let empId: string;
  let empUserEmail: string;
  let mgrToken: string;
  const createdIds: { table: string; id: string }[] = [];

  beforeAll(async () => {
    // 1. Look up the seeded employee user
    const empUser = await db('users')
      .where({ email: 'emp1@jaxtina.com' })
      .first();
    
    if (!empUser) {
      throw new Error('Seed user emp1@jaxtina.com not found. Run seeds.');
    }

    // 2. Look up their employee record
    const emp = await db('employees')
      .where({ user_id: empUser.id })
      .first();

    if (!emp) {
      throw new Error(`Employee record for user ${empUser.id} not found.`);
    }

    empUserId = empUser.id;
    empUserEmail = empUser.email;
    empId = emp.id;
    
    // 3. Line manager for approvals
    const mgrUser = await db('users').where({ email: 'manager1@jaxtina.com' }).first();
    mgrToken = getTestToken('line_manager', { userId: mgrUser.id, email: mgrUser.email });
  });

  afterEach(async () => {
    // Delete in reverse FK order
    for (const item of [...createdIds].reverse()) {
      await db(item.table).where({ id: item.id }).delete();
    }
    createdIds.length = 0;
  });

  describe('POST /api/leave/requests', () => {
    it('creates pending request with valid dates + sufficient balance', async () => {
      const token = getTestToken('employee', { userId: empUserId, email: empUserEmail, employeeId: empId });
      const leaveType = await db('leave_types').first();
      const year = new Date().getFullYear();
      
      // Provision balance
      await db('leave_entitlements').where({ employee_id: empId, leave_type_id: leaveType.id, year }).delete();
      await db('leave_entitlements').insert({ 
        id: uuidv4(),
        employee_id: empId, 
        leave_type_id: leaveType.id, 
        year, 
        total_days: 20, 
        used_days: 0 
      });

      const res = await request(app)
        .post('/api/leave/requests')
        .set('Authorization', token)
        .send({ leaveTypeId: leaveType.id, startDate: '2026-10-01', endDate: '2026-10-02', reason: 'Vacation' });
      
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
      createdIds.push({ table: 'leave_requests', id: res.body.data.id });
    });

    it('returns 400 if endDate before startDate', async () => {
      const token = getTestToken('employee', { userId: empUserId, email: empUserEmail, employeeId: empId });
      const leaveType = await db('leave_types').first();
      const res = await request(app)
        .post('/api/leave/requests')
        .set('Authorization', token)
        .send({ leaveTypeId: leaveType.id, startDate: '2026-10-05', endDate: '2026-10-01', reason: 'Vacation' });
      
      expect(res.status).toBe(400);
    });

    it('returns 400 if leave request overlaps with existing approved request', async () => {
      const token = getTestToken('employee', { userId: empUserId, email: empUserEmail, employeeId: empId });
      const leaveType = await db('leave_types').first();

      // 1. Create and approve first request
      const firstReq = await db('leave_requests').insert({
        id: uuidv4(),
        employee_id: empId,
        leave_type_id: leaveType.id,
        start_date: '2026-11-10',
        end_date: '2026-11-15',
        status: 'approved',
        days: 6
      }).returning('*').then(r => r[0]);
      createdIds.push({ table: 'leave_requests', id: firstReq.id });

      // 2. Try to create overlapping request
      const res = await request(app)
        .post('/api/leave/requests')
        .set('Authorization', token)
        .send({ 
          leaveTypeId: leaveType.id, 
          startDate: '2026-11-12', 
          endDate: '2026-11-13', 
          reason: 'Overlap' 
        });
      
      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/overlap/i);
    });
  });

  describe('POST /api/leave/requests/:id/review', () => {
    it('approves request (line_manager token)', async () => {
      const pendingReq = await db('leave_requests').insert({ 
        id: uuidv4(),
        employee_id: empId, 
        leave_type_id: (await db('leave_types').first()).id, 
        start_date: '2027-01-01', 
        end_date: '2027-01-02', 
        status: 'pending', 
        days: 2 
      }).returning('*').then(r => r[0]);
      createdIds.push({ table: 'leave_requests', id: pendingReq.id });

      const res = await request(app)
        .post(`/api/leave/requests/${pendingReq.id}/review`)
        .set('Authorization', mgrToken)
        .send({ action: 'approve' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });
  });

  describe('POST /api/leave/requests/:id/cancel', () => {
    it('cancels pending request', async () => {
      const pendingReq = await db('leave_requests').insert({ 
        id: uuidv4(),
        employee_id: empId, 
        leave_type_id: (await db('leave_types').first()).id, 
        start_date: '2027-05-01', 
        end_date: '2027-05-02', 
        status: 'pending', 
        days: 2 
      }).returning('*').then(r => r[0]);
      createdIds.push({ table: 'leave_requests', id: pendingReq.id });
      const token = getTestToken('employee', { userId: empUserId, email: empUserEmail, employeeId: empId });

      const res = await request(app).post(`/api/leave/requests/${pendingReq.id}/cancel`).set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.message).toMatch(/cancelled/i);
    });
  });

  describe('Attendance', () => {
    beforeEach(async () => {
      await db('attendance_logs').where({ employee_id: empId }).delete();
    });

    it('clock-in creates record', async () => {
      const token = getTestToken('employee', { userId: empUserId, email: empUserEmail, employeeId: empId });
      
      const res = await request(app).post('/api/leave/attendance/clock-in').set('Authorization', token);
      if (res.status !== 201) console.log('ERROR:', res.status, res.body);
      expect(res.status).toBe(201);
      expect(res.body.data.clock_in).toBeDefined();
      createdIds.push({ table: 'attendance_logs', id: res.body.data.id });
    });

    it('clock-out sets time', async () => {
      const token = getTestToken('employee', { userId: empUserId, email: empUserEmail, employeeId: empId });
      
      const clockInRes = await request(app).post('/api/leave/attendance/clock-in').set('Authorization', token);
      if (clockInRes.status !== 201) console.log('CLOCK IN ERROR:', clockInRes.status, clockInRes.body);
      createdIds.push({ table: 'attendance_logs', id: clockInRes.body.data.id });
      
      const res = await request(app).post('/api/leave/attendance/clock-out').set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.clock_out).toBeDefined();
    });
  });
});
