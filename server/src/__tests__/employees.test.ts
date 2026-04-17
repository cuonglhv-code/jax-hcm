import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';
import { v4 as uuidv4 } from 'uuid';

describe('Employee API', () => {

  describe('GET /api/employees', () => {
    it('returns 200 + paginated list (hr_manager token)', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).get('/api/employees').set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
    });

    it('returns 200 for employee-role token (own access)', async () => {
      const hrToken = getTestToken('hr_manager');
      const dept = await db('departments').first();
      const title = await db('job_titles').first();
      const email = `emp-${uuidv4()}@jaxtina.com`;
      
      await request(app)
        .post('/api/employees')
        .set('Authorization', hrToken)
        .send({ 
          firstName: 'Test', 
          lastName: 'Emp', 
          email, 
          departmentId: dept.id, 
          jobTitleId: title.id,
          employmentType: 'full_time', 
          status: 'active' 
        });
      
      const newEmp = await db('employees').where({ email }).first();
      const newUser = await db('users').where({ employee_id: newEmp.id }).first();
      
      const token = getTestToken('employee', newUser.id, newUser.email);
      const res = await request(app).get('/api/employees').set('Authorization', token);
      
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(newEmp.id);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/employees');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/employees/:id', () => {
    it('returns employee details with manager info', async () => {
      const emp = await db('employees').first();
      const token = getTestToken('hr_manager');
      const res = await request(app).get(`/api/employees/${emp.id}`).set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(emp.id);
    });

    it('returns 404 for non-existent id', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).get('/api/employees/00000000-0000-0000-0000-000000000000').set('Authorization', token);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/employees', () => {
    it('creates employee (hr_manager)', async () => {
      const token = getTestToken('hr_manager');
      const dept = await db('departments').first();
      const title = await db('job_titles').first();
      const email = `newguy-${uuidv4()}@jaxtina.com`;

      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', token)
        .send({ 
          firstName: 'New', 
          lastName: 'Guy', 
          email, 
          departmentId: dept.id,
          jobTitleId: title.id,
          employmentType: 'full_time', 
          status: 'active' 
        });
      
      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
    });

    it('returns 409 if email already exists', async () => {
      const emp = await db('employees').first();
      const token = getTestToken('hr_manager');
      const dept = await db('departments').first();
      const title = await db('job_titles').first();

      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', token)
        .send({ 
          firstName: 'X', 
          lastName: 'Y', 
          email: emp.email, 
          departmentId: dept.id,
          jobTitleId: title.id,
          employmentType: 'full_time', 
          status: 'active' 
        });
      
      expect(res.status).toBe(409);
    });
  });

  describe('PUT /api/employees/:id', () => {
    it('updates employee fields (hr_manager)', async () => {
      const hrUser = await db('users').where('role', 'hr_manager').first();
      const token = getTestToken('hr_manager', hrUser.id);
      const emp = await db('employees').first();
      
      const res = await request(app)
        .put(`/api/employees/${emp.id}`)
        .set('Authorization', token)
        .send({ firstName: 'UpdatedName' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.firstName).toBe('UpdatedName');
    });
  });

  describe('DELETE /api/employees/:id', () => {
    it('soft-deletes employee (hr_manager)', async () => {
      const token = getTestToken('hr_manager');
      const dept = await db('departments').first();
      const title = await db('job_titles').first();
      const email = `del-${uuidv4()}@test.com`;

      const emp = await request(app)
        .post('/api/employees')
        .set('Authorization', token)
        .send({ 
          firstName: 'T', 
          lastName: 'T', 
          email, 
          departmentId: dept.id,
          jobTitleId: title.id,
          employmentType: 'full_time', 
          status: 'active' 
        });
      
      const id = emp.body.data.id;
      const res = await request(app).delete(`/api/employees/${id}`).set('Authorization', token);
      
      expect(res.status).toBe(204);
      
      const listRes = await request(app).get(`/api/employees/${id}`).set('Authorization', token);
      expect(listRes.status).toBe(404);
    });
  });

  describe('GET /api/employees/org-chart', () => {
    it('returns flat array', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).get('/api/employees/org-chart').set('Authorization', token);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });
});
