import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

describe('Admin API', () => {

  describe('GET /api/admin/stats', () => {
    it('returns stats object (super_admin)', async () => {
      const token = getTestToken('super_admin');
      const res = await request(app).get('/api/admin/stats').set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.totalEmployees).toBeDefined();
    });

    it('returns 403 for hr_manager', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).get('/api/admin/stats').set('Authorization', token);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/users', () => {
    it('returns paginated user list (super_admin)', async () => {
      const token = getTestToken('super_admin');
      const res = await request(app).get('/api/admin/users').set('Authorization', token);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('updates user role (super_admin)', async () => {
      const u = await db('users').where('role', 'employee').first();
      const admin = await db('users').where('role', 'super_admin').first();
      const token = getTestToken('super_admin', admin.id);
      
      const res = await request(app).put(`/api/admin/users/${u.id}`).set('Authorization', token).send({ role: 'line_manager' });
      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('line_manager');
    });

    it('returns 400 if trying to change own role', async () => {
      const admin = await db('users').where('role', 'super_admin').first();
      const token = getTestToken('super_admin', admin.id);
      
      const res = await request(app).put(`/api/admin/users/${admin.id}`).set('Authorization', token).send({ role: 'employee' });
      expect(res.status).toBe(400); 
    });
  });

  describe('POST /api/admin/users/:id/reset-password', () => {
    it('resets password', async () => {
      const admin = await db('users').where('role', 'super_admin').first();
      const token = getTestToken('super_admin', admin.id);

      const email = `reset-${uuidv4()}@jaxtina.com`;
      const targetUser = await db('users').insert({ 
        id: uuidv4(), 
        email, 
        password_hash: await bcrypt.hash('oldPassword123!', 10), 
        role: 'employee' 
      }).returning('*').then(r => r[0]);

      // Login with old
      let loginRes = await request(app).post('/api/auth/login').send({ email: targetUser.email, password: 'oldPassword123!' });
      expect(loginRes.status).toBe(200);

      // Reset
      const res = await request(app).post(`/api/admin/users/${targetUser.id}/reset-password`).set('Authorization', token).send({ newPassword: 'NewPassword123!' });
      expect(res.status).toBe(200);

      // Login new should succeed
      loginRes = await request(app).post('/api/auth/login').send({ email: targetUser.email, password: 'NewPassword123!' });
      expect(loginRes.status).toBe(200);
    });
  });

  describe('GET /api/admin/activity-log', () => {
    it('returns activity log', async () => {
      const token = getTestToken('super_admin');
      const admin = await db('users').where('role', 'super_admin').first();
      
      await db('audit_logs').insert({ 
        id: uuidv4(),
        entity_type: 'test_entity', 
        entity_id: uuidv4(), 
        action: 'test_action', 
        performed_by: admin.id 
      });

      const res = await request(app).get('/api/admin/activity-log').set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.some((l: any) => l.actor_email)).toBe(true);
    });

    it('filters activity log by action', async () => {
      const token = getTestToken('super_admin');
      const admin = await db('users').where('role', 'super_admin').first();
      
      await db('audit_logs').insert([
        { id: uuidv4(), entity_type: 'e1', entity_id: uuidv4(), action: 'action_a', performed_by: admin.id },
        { id: uuidv4(), entity_type: 'e1', entity_id: uuidv4(), action: 'action_b', performed_by: admin.id }
      ]);

      const res = await request(app)
        .get('/api/admin/activity-log')
        .query({ action: 'action_a' })
        .set('Authorization', token);
      
      expect(res.status).toBe(200);
      expect(res.body.data.every((l: any) => l.action === 'action_a')).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});
