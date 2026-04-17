import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';
import { v4 as uuidv4 } from 'uuid';

describe('Leave API', () => {
  let empUserId: string;
  let empId: string;
  let mgrToken: string;

  beforeAll(async () => {
    // Find an employee (not manager) to use for requests
    const empUser = await db('users').where('role', 'employee').first();
    empUserId = empUser.id;
    empId = empUser.employee_id;
    mgrToken = getTestToken('line_manager');
  });

  describe('POST /api/leave/requests', () => {
    it('creates pending request with valid dates + sufficient balance', async () => {
      const token = getTestToken('employee', empUserId);
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
    });

    it('returns 400 if endDate before startDate', async () => {
      const token = getTestToken('employee', empUserId);
      const leaveType = await db('leave_types').first();
      const res = await request(app)
        .post('/api/leave/requests')
        .set('Authorization', token)
        .send({ leaveTypeId: leaveType.id, startDate: '2026-10-05', endDate: '2026-10-01', reason: 'Vacation' });
      
      expect(res.status).toBe(400);
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
        total_days: 2 
      }).returning('*').then(r => r[0]);

      const res = await request(app)
        .post(`/api/leave/requests/${pendingReq.id}/review`)
        .set('Authorization', mgrToken)
        .send({ status: 'approved' });
      
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
        total_days: 2 
      }).returning('*').then(r => r[0]);
      const token = getTestToken('employee', empUserId);

      const res = await request(app).post(`/api/leave/requests/${pendingReq.id}/cancel`).set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('cancelled');
    });
  });

  describe('Attendance', () => {
    it('clock-in creates record', async () => {
      // Use a fresh user to avoid 'already clocked in' if test order varies
      const newUser = await db('users').where('role', 'employee').orderBy('id', 'desc').first();
      const token = getTestToken('employee', newUser.id);
      
      const res = await request(app).post('/api/leave/attendance/clock-in').set('Authorization', token);
      expect(res.status).toBe(201);
      expect(res.body.data.clockIn).toBeDefined();
    });

    it('clock-out sets time', async () => {
       const newUser = await db('users').where('role', 'employee').orderBy('id', 'desc').first();
       const token = getTestToken('employee', newUser.id);
       
       await request(app).post('/api/leave/attendance/clock-in').set('Authorization', token);
       const res = await request(app).post('/api/leave/attendance/clock-out').set('Authorization', token);
       expect(res.status).toBe(200);
       expect(res.body.data.clockOut).toBeDefined();
    });
  });
});
