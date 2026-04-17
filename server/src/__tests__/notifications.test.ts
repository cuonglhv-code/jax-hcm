import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';
import { v4 as uuidv4 } from 'uuid';

describe('Notifications API', () => {

  describe('GET /api/notifications', () => {
    it('returns empty array for new user', async () => {
      const dept = await db('departments').first();
      const title = await db('job_titles').first();
      const email = `nonotif-${uuidv4()}@test.com`;

      const emp = await db('employees').insert({ 
        id: uuidv4(), 
        first_name: 'No', 
        last_name: 'Notif', 
        email, 
        department_id: dept.id, 
        job_title_id: title.id,
        employment_type: 'full_time',
        status: 'active',
        hire_date: '2024-01-01'
      }).returning('*').then(r => r[0]);

      const user = await db('users').insert({ 
        id: uuidv4(), 
        role: 'employee', 
        email: emp.email, 
        password_hash: 'hi' 
      }).returning('*').then(r => r[0]);

      await db('employees').where('id', emp.id).update({ user_id: user.id });
      
      const token = getTestToken('employee', { userId: user.id });
      const res = await request(app).get('/api/notifications').set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    let notifId: string;
    let userId: string;

    beforeAll(async () => {
      const u = await db('users').first();
      userId = u.id;
      const n = await db('notifications').insert({ id: uuidv4(), user_id: userId, title: 'T', message: 'M', type: 'info', is_read: false }).returning('*').then(r => r[0]);
      notifId = n.id;
    });

    it('marks notification as read', async () => {
      const token = getTestToken('employee', { userId });
      const res = await request(app).patch(`/api/notifications/${notifId}/read`).set('Authorization', token);
      expect(res.status).toBe(200);
      
      const updated = await db('notifications').where({ id: notifId }).first();
      expect(updated.is_read).toBe(true);
    });

    it('returns 404 if notification belongs to different user', async () => {
      const token = getTestToken('employee', { userId: uuidv4() });
      const res = await request(app).patch(`/api/notifications/${notifId}/read`).set('Authorization', token);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    let userId: string;

    beforeAll(async () => {
      const user = await db('users').offset(1).first(); // next user
      userId = user.id;
      await db('notifications').insert([
        { id: uuidv4(), user_id: userId, title: '1', message: '1', type: 'info', is_read: false },
        { id: uuidv4(), user_id: userId, title: '2', message: '2', type: 'info', is_read: false },
      ]);
    });

    it('marks all user notifications as read', async () => {
      const token = getTestToken('employee', { userId });
      const res = await request(app).patch('/api/notifications/read-all').set('Authorization', token);
      expect(res.status).toBe(200);

      const notifs = await db('notifications').where({ user_id: userId, is_read: false });
      expect(notifs.length).toBe(0);
    });
  });

  describe('Integration: leave approval triggers notification', () => {
    it('after reviewLeaveRequest(approve), employee has new notification', async () => {
      const u = await db('users').where('role', 'employee').first();
      const emp = await db('employees').where('user_id', u.id).first();
      const empId = emp.id;
      const leaveType = await db('leave_types').first();
      
      const reqId = uuidv4();
      await db('leave_requests').insert({
        id: reqId,
        employee_id: empId,
        leave_type_id: leaveType.id,
        start_date: '2029-01-01',
        end_date: '2029-01-02',
        status: 'pending',
        total_days: 2
      });

      const mgrToken = getTestToken('line_manager');
      await request(app)
        .post(`/api/leave/requests/${reqId}/review`)
        .set('Authorization', mgrToken)
        .send({ status: 'approved' });

      const empToken = getTestToken('employee', { userId: u.id });
      const res = await request(app).get('/api/notifications').set('Authorization', empToken);
      
      expect(res.status).toBe(200);
      const notif = res.body.data.find((n: any) => n.title.includes('Leave') || n.message.includes('approv'));
      expect(notif).toBeDefined();
    });
  });
});
