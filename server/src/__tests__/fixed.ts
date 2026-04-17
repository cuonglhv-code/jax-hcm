import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';
import bcrypt from 'bcryptjs';

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

    it('returns 403 for employee', async () => {
      const token = getTestToken('employee');
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

    it('search filter works on email', async () => {
      const token = getTestToken('super_admin');
      const adminUser = await db('users').where({ email: 'admin@jaxtina.com' }).first();
      // Should find admin
      const res = await request(app).get('/api/admin/users?search=admin').set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.some((u: any) => u.email === adminUser.email)).toBe(true);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('updates user role (super_admin)', async () => {
      const u = await db('users').join('roles', 'users.role_id', 'roles.id').where('roles.name', 'employee').select('users.*').first();
      const newRole = await db('roles').where({ name: 'line_manager' }).first();
      
      const adminId = (await db('users').join('roles', 'users.role_id', 'roles.id').where('roles.name', 'super_admin').select('users.*').first()).id;
      const token = getTestToken('super_admin', adminId);
      
      const res = await request(app).put(`/api/admin/users/${u.id}`).set('Authorization', token).send({ roleId: newRole.id });
      expect(res.status).toBe(200);
      expect(res.body.data.roleId).toBe(newRole.id);
    });

    it('returns 400 if trying to change own role', async () => {
      const adminId = (await db('users').join('roles', 'users.role_id', 'roles.id').where('roles.name', 'super_admin').select('users.*').first()).id;
      const newRole = await db('roles').where({ name: 'employee' }).first();
      const token = getTestToken('super_admin', adminId);
      
      const res = await request(app).put(`/api/admin/users/${adminId}`).set('Authorization', token).send({ roleId: newRole.id });
      expect(res.status).toBe(400); // Admin cannot change own role usually
    });

    it('returns 403 for hr_manager', async () => {
      const u = await db('users').first();
      const r = await db('roles').first();
      const token = getTestToken('hr_manager');
      
      const res = await request(app).put(`/api/admin/users/${u.id}`).set('Authorization', token).send({ roleId: r.id });
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/admin/users/:id/reset-password', () => {
    it('resets password, old password no longer works, new matches', async () => {
      const adminId = (await db('users').join('roles', 'users.role_id', 'roles.id').where('roles.name', 'super_admin').select('users.*').first()).id;
      const token = getTestToken('super_admin', adminId);

      const targetUser = await db('users').insert({ email: 'testreset@jaxtina.com', password_hash: await bcrypt.hash('old', 10), role_id: (await db('roles').first()).id }).returning('*').then(r => r[0]);

      // Login with old
      let loginRes = await request(app).post('/api/auth/login').send({ email: targetUser.email, password: 'old' });
      expect(loginRes.status).toBe(200);

      // Reset
      const res = await request(app).post(`/api/admin/users/${targetUser.id}/reset-password`).set('Authorization', token).send({ newPassword: 'newpassword123' });
      expect(res.status).toBe(200);

      // Login old should fail
      loginRes = await request(app).post('/api/auth/login').send({ email: targetUser.email, password: 'old' });
      expect(loginRes.status).toBe(401);

      // Login new should succeed
      loginRes = await request(app).post('/api/auth/login').send({ email: targetUser.email, password: 'newpassword123' });
      expect(loginRes.status).toBe(200);
    });
  });

  describe('GET /api/admin/activity-log', () => {
    it('returns audit log entries with actor email', async () => {
      const token = getTestToken('super_admin');
      
      // Ensure there's a log from some activity
      await db('audit_logs').insert({ table_name: 'test', record_id: 'test_id', action: 'create', new_data: {}, actor_id: (await db('users').first()).id });

      const res = await request(app).get('/api/admin/activity-log').set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.some((l: any) => l.actorEmail)).toBe(true);
    });
  });
});
import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getRawTestToken, getTestToken } from './helpers/getTestToken';

describe('Auth API', () => {

  describe('POST /api/auth/login', () => {
    it('returns 200 + accessToken with valid credentials (admin@jaxtina.com)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@jaxtina.com', password: 'password123' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('sets httpOnly refreshToken cookie on success', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@jaxtina.com', password: 'password123' });
      
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/refreshToken=.*HttpOnly;/);
    });

    it('returns 401 with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@jaxtina.com', password: 'wrongpassword' });
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 with missing email (Zod)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'password123' });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@jaxtina.com', password: 'password123' });
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('returns new accessToken with valid refresh cookie', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@jaxtina.com', password: 'password123' });
      
      const cookie = loginRes.headers['set-cookie'][0];
      
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', cookie);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('returns 401 without cookie', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current user with valid token', async () => {
      // Need a valid DB user for /me to work
      const user = await db('users').where({ email: 'admin@jaxtina.com' }).first();
      const token = getTestToken('super_admin', user.id, user.email);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', token);
      
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('admin@jaxtina.com');
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns 401 with expired token', async () => {
      const user = await db('users').where({ email: 'admin@jaxtina.com' }).first();
      const expiredToken = getRawTestToken('super_admin', user.id, user.email, '1ms');
      
      await new Promise(r => setTimeout(r, 5)); // wait for expiry
      
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);
      
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns 200 and clears cookie', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@jaxtina.com', password: 'password123' });
      
      const cookie = loginRes.headers['set-cookie'][0];
      
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookie);
      
      expect(res.status).toBe(200);
      const afterCookies = res.headers['set-cookie'];
      expect(afterCookies[0]).toMatch(/refreshToken=;/);
    });

    it('refresh token is invalid after logout', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@jaxtina.com', password: 'password123' });
      
      const cookie = loginRes.headers['set-cookie'][0];
      
      await request(app).post('/api/auth/logout').set('Cookie', cookie);
      
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', cookie);
        
      expect(refreshRes.status).toBe(401);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('returns 200 with correct current password', async () => {
      const user = await db('users').where({ email: 'admin@jaxtina.com' }).first();
      const token = getTestToken('super_admin', user.id, user.email);

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', token)
        .send({ currentPassword: 'password123', newPassword: 'newpassword123' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Revert password to prevent breaking other tests
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', token)
        .send({ currentPassword: 'newpassword123', newPassword: 'password123' });
    });

    it('returns 400 with wrong current password', async () => {
      const user = await db('users').where({ email: 'admin@jaxtina.com' }).first();
      const token = getTestToken('super_admin', user.id, user.email);

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', token)
        .send({ currentPassword: 'wrong', newPassword: 'newpass' });
      
      expect(res.status).toBe(400);
    });

    it('returns 401 without token', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .send({ currentPassword: 'password123', newPassword: 'newpassword123' });
      
      expect(res.status).toBe(401);
    });
  });
});
import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';

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
      // Create user + employee to test isolation
      const hrToken = getTestToken('hr_manager');
      const resData = await request(app)
        .post('/api/employees')
        .set('Authorization', hrToken)
        .send({ firstName: 'Test', lastName: 'Emp', email: 'justanemp@jaxtina.com', departmentId: null, employmentType: 'full-time', status: 'active' });
      
      const newEmp = await db('employees').where({ email: 'justanemp@jaxtina.com' }).first();
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

    it('search param filters by name', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).get('/api/employees?search=Test').set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.some((e: any) => e.firstName.includes('Test'))).toBe(true);
    });

    it('departmentId filter returns correct subset', async () => {
      const token = getTestToken('hr_manager');
      const dept = await db('departments').first();
      const res = await request(app).get(`/api/employees?departmentId=${dept.id}`).set('Authorization', token);
      expect(res.status).toBe(200);
      res.body.data.forEach((e: any) => {
        expect(e.departmentId).toBe(dept.id);
      });
    });

    it('status filter works', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).get('/api/employees?status=active').set('Authorization', token);
      expect(res.status).toBe(200);
      res.body.data.forEach((e: any) => {
        expect(e.status).toBe('active');
      });
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

    it('returns 404 for soft-deleted employee', async () => {
      const token = getTestToken('hr_manager');
      const emp = await db('employees').insert({
        first_name: 'Soft', last_name: 'Deleted', email: 'del@x.com', deleted_at: new Date()
      }).returning('*').then(r => r[0]);

      const res = await request(app).get(`/api/employees/${emp.id}`).set('Authorization', token);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/employees', () => {
    it('creates employee (hr_manager)', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', token)
        .send({ firstName: 'New', lastName: 'Guy', email: 'newguy@jaxtina.com', employmentType: 'part-time', status: 'active' });
      
      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
    });

    it('returns 403 for employee-role token', async () => {
      const token = getTestToken('employee');
      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', token)
        .send({ firstName: 'New', lastName: 'Guy', email: 'newguy2@jaxtina.com', employmentType: 'part-time', status: 'active' });
      
      expect(res.status).toBe(403);
    });

    it('returns 409 if email already exists', async () => {
      const emp = await db('employees').first();
      const token = getTestToken('hr_manager');
      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', token)
        .send({ firstName: 'X', lastName: 'Y', email: emp.email, employmentType: 'full-time', status: 'active' });
      
      expect(res.status).toBe(409);
    });

    it('returns 400 for missing required fields', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).post('/api/employees').set('Authorization', token).send({ firstName: 'X' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/employees/:id', () => {
    it('updates employee fields (hr_manager) and records audit log', async () => {
      const hrUserId = (await db('users').join('roles', 'users.role_id', 'roles.id').where('roles.name', 'hr_manager').first()).id;
      const token = getTestToken('hr_manager', hrUserId);
      const emp = await db('employees').first();
      
      const res = await request(app)
        .put(`/api/employees/${emp.id}`)
        .set('Authorization', token)
        .send({ firstName: 'UpdatedName' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.firstName).toBe('UpdatedName');

      // Check audit log
      const log = await db('audit_logs')
        .where({ record_id: emp.id, action: 'update', table_name: 'employees' })
        .orderBy('created_at', 'desc')
        .first();
      
      expect(log).toBeDefined();
    });
  });

  describe('DELETE /api/employees/:id', () => {
    it('soft-deletes employee (hr_manager)', async () => {
      const token = getTestToken('hr_manager');
      const emp = await request(app)
        .post('/api/employees')
        .set('Authorization', token)
        .send({ firstName: 'T', lastName: 'T', email: 'del2@test.com', employmentType: 'full-time', status: 'active' });
      
      const id = emp.body.data.id;
      const res = await request(app).delete(`/api/employees/${id}`).set('Authorization', token);
      
      expect(res.status).toBe(204);
      
      // Does not appear in list
      const listRes = await request(app).get(`/api/employees/${id}`).set('Authorization', token);
      expect(listRes.status).toBe(404);
    });

    it('returns 403 for employee-role token', async () => {
      const token = getTestToken('employee');
      const res = await request(app).delete('/api/employees/00000000-0000-0000-0000-000000000000').set('Authorization', token);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/employees/org-chart', () => {
    it('returns flat array with managerId relationships', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).get('/api/employees/org-chart').set('Authorization', token);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('id');
        expect(res.body.data[0]).toHaveProperty('managerId');
      }
    });
  });
});
import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';

describe('Learning API', () => {

  describe('GET /api/learning/courses', () => {
    it('returns seeded courses', async () => {
      const token = getTestToken('employee');
      const res = await request(app).get('/api/learning/courses').set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('isMandatory filter returns only mandatory courses', async () => {
      const token = getTestToken('employee');
      const res = await request(app).get('/api/learning/courses?isMandatory=true').set('Authorization', token);
      expect(res.status).toBe(200);
      res.body.data.forEach((c: any) => {
        expect(c.isMandatory).toBe(true);
      });
    });
  });

  describe('POST /api/learning/enrolments', () => {
    let courseId: string;
    let employeeId: string;

    beforeAll(async () => {
      courseId = (await db('courses').first()).id;
      employeeId = (await db('employees').first()).id;
    });

    it('enrols employee in course', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app)
        .post('/api/learning/enrolments')
        .set('Authorization', token)
        .send({ employeeId, courseId });
      
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('not_started');
    });

    it('returns 409 on duplicate enrolment', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app)
        .post('/api/learning/enrolments')
        .set('Authorization', token)
        .send({ employeeId, courseId });
      
      expect(res.status).toBe(409);
    });
  });

  describe('PATCH /api/learning/enrolments/:id/status', () => {
    let enrolmentId: string;
    beforeAll(async () => {
      const course = await db('courses').first();
      const emp2 = await db('employees').insert({ first_name: 'Lrn', last_name: 'Test', email: 'lrn@t.com' }).returning('*').then(r => r[0]);
      const enr = await db('course_enrolments').insert({ employee_id: emp2.id, course_id: course.id, status: 'not_started' }).returning('*').then(r => r[0]);
      enrolmentId = enr.id;
    });

    it('in_progress sets started_at', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app)
        .patch(`/api/learning/enrolments/${enrolmentId}/status`)
        .set('Authorization', token)
        .send({ status: 'in_progress' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.startedAt).toBeDefined();
    });

    it('completed sets completed_at + generates certificate', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app)
        .patch(`/api/learning/enrolments/${enrolmentId}/status`)
        .set('Authorization', token)
        .send({ status: 'completed' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.completedAt).toBeDefined();
      expect(res.body.data.certificateId).toBeDefined();
    });
  });

  describe('GET /api/learning/certificates/:id', () => {
    it('returns certificate with employee + course data', async () => {
      const token = getTestToken('hr_manager');
      const cert = await db('training_certificates').first();
      if (!cert) return;
      const res = await request(app).get(`/api/learning/certificates/${cert.id}`).set('Authorization', token);
      
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(cert.id);
    });
  });

  describe('GET /api/learning/mandatory/status/:employeeId', () => {
    let empId: string;
    let newCourseId: string;

    beforeAll(async () => {
      empId = (await db('employees').first()).id;
      // Setup a clean course
      const crs = await db('courses').insert({ title: 'Mandatory Sec', is_mandatory: true, duration_minutes: 60, type: 'internal' }).returning('*').then(r => r[0]);
      newCourseId = crs.id;
      // Set rule: renewal every 365 days
      await db('mandatory_training').insert({ course_id: crs.id, applies_to_all: true, renewal_period_days: 365 });
    });

    it('returns not_started for unenrolled mandatory courses', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).get(`/api/learning/mandatory/status/${empId}`).set('Authorization', token);
      
      expect(res.status).toBe(200);
      const item = res.body.data.find((i: any) => i.courseId === newCourseId);
      expect(item).toBeDefined();
      expect(item.status).toBe('not_started');
    });

    it('returns current after completing mandatory course', async () => {
      const token = getTestToken('hr_manager');
      const enr = await db('course_enrolments').insert({ employee_id: empId, course_id: newCourseId, status: 'completed', completed_at: new Date() }).returning('*').then(r => r[0]);

      const res = await request(app).get(`/api/learning/mandatory/status/${empId}`).set('Authorization', token);
      
      expect(res.status).toBe(200);
      const item = res.body.data.find((i: any) => i.courseId === newCourseId);
      expect(item.status).toBe('current');
    });

    it('returns overdue when renewal period has elapsed', async () => {
      const token = getTestToken('hr_manager');
      // Set completion to 400 days ago
      const oldCompletion = new Date();
      oldCompletion.setDate(oldCompletion.getDate() - 400);

      await db('course_enrolments').where({ employee_id: empId, course_id: newCourseId }).update({ completed_at: oldCompletion });

      const res = await request(app).get(`/api/learning/mandatory/status/${empId}`).set('Authorization', token);
      
      expect(res.status).toBe(200);
      const item = res.body.data.find((i: any) => i.courseId === newCourseId);
      expect(item.status).toBe('overdue');
    });
  });
});
import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';

describe('Leave API', () => {
  let empUserId: string;
  let empId: string;
  let mgrToken: string;

  beforeAll(async () => {
    // Find an employee (not manager) to use for requests
    const empUser = await db('users').join('roles', 'users.role_id', 'roles.id').where('roles.name', 'employee').first();
    empUserId = empUser.id;
    empId = empUser.employee_id;
    mgrToken = getTestToken('line_manager');
  });

  describe('POST /api/leave/requests', () => {
    it('creates pending request with valid dates + sufficient balance', async () => {
      const token = getTestToken('employee', empUserId);
      const leaveType = await db('leave_types').first();
      // Provision balance
      await db('leave_entitlements').insert({ employee_id: empId, leave_type_id: leaveType.id, year: new Date().getFullYear(), total_days: 20, used_days: 0 });

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

    it('returns 400 if insufficient leave balance', async () => {
      const token = getTestToken('employee', empUserId);
      const leaveType = await db('leave_types').first();
      // Use up balance
      await db('leave_entitlements').where({ employee_id: empId, leave_type_id: leaveType.id }).update({ used_days: 20 });
      
      const res = await request(app)
        .post('/api/leave/requests')
        .set('Authorization', token)
        .send({ leaveTypeId: leaveType.id, startDate: '2026-11-01', endDate: '2026-11-05', reason: 'Vacation' });
      
      expect(res.status).toBe(400);
    });

    it('returns 409 if overlapping approved request exists', async () => {
      const token = getTestToken('employee', empUserId);
      const leaveType = await db('leave_types').first();
      // Add balance again
      await db('leave_entitlements').where({ employee_id: empId, leave_type_id: leaveType.id }).update({ used_days: 0, total_days: 20 });
      
      const req1 = await db('leave_requests').insert({ employee_id: empId, leave_type_id: leaveType.id, start_date: '2026-12-01', end_date: '2026-12-05', status: 'approved', total_days: 5 }).returning('*').then(r => r[0]);

      const res = await request(app)
        .post('/api/leave/requests')
        .set('Authorization', token)
        .send({ leaveTypeId: leaveType.id, startDate: '2026-12-03', endDate: '2026-12-06', reason: 'Overlap' });
      
      expect(res.status).toBe(409);
    });
  });

  describe('PUT /api/leave/requests/:id/review', () => {
    it('approves request (line_manager token)', async () => {
      const pendingReq = await db('leave_requests').insert({ employee_id: empId, leave_type_id: (await db('leave_types').first()).id, start_date: '2027-01-01', end_date: '2027-01-02', status: 'pending', total_days: 2 }).returning('*').then(r => r[0]);

      const res = await request(app)
        .put(`/api/leave/requests/${pendingReq.id}/review`)
        .set('Authorization', mgrToken)
        .send({ status: 'approved' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });

    it('rejects request (line_manager token)', async () => {
      const pendingReq = await db('leave_requests').insert({ employee_id: empId, leave_type_id: (await db('leave_types').first()).id, start_date: '2027-02-01', end_date: '2027-02-02', status: 'pending', total_days: 2 }).returning('*').then(r => r[0]);

      const res = await request(app)
        .put(`/api/leave/requests/${pendingReq.id}/review`)
        .set('Authorization', mgrToken)
        .send({ status: 'rejected' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('rejected');
    });

    it('returns 403 for employee-role (cannot review own)', async () => {
      const pendingReq = await db('leave_requests').insert({ employee_id: empId, leave_type_id: (await db('leave_types').first()).id, start_date: '2027-03-01', end_date: '2027-03-02', status: 'pending', total_days: 2 }).returning('*').then(r => r[0]);
      const token = getTestToken('employee', empUserId);

      const res = await request(app)
        .put(`/api/leave/requests/${pendingReq.id}/review`)
        .set('Authorization', token)
        .send({ status: 'approved' });
      
      expect(res.status).toBe(403);
    });

    it('returns 400 if request already reviewed', async () => {
      const approvedReq = await db('leave_requests').insert({ employee_id: empId, leave_type_id: (await db('leave_types').first()).id, start_date: '2027-04-01', end_date: '2027-04-02', status: 'approved', total_days: 2 }).returning('*').then(r => r[0]);

      const res = await request(app)
        .put(`/api/leave/requests/${approvedReq.id}/review`)
        .set('Authorization', mgrToken)
        .send({ status: 'rejected' });
      
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/leave/requests/:id/cancel', () => {
    it('cancels pending request (own employee token)', async () => {
      const pendingReq = await db('leave_requests').insert({ employee_id: empId, leave_type_id: (await db('leave_types').first()).id, start_date: '2027-05-01', end_date: '2027-05-02', status: 'pending', total_days: 2 }).returning('*').then(r => r[0]);
      const token = getTestToken('employee', empUserId);

      const res = await request(app).put(`/api/leave/requests/${pendingReq.id}/cancel`).set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('cancelled');
    });

    it('returns 400 if request already approved', async () => {
      const approvedReq = await db('leave_requests').insert({ employee_id: empId, leave_type_id: (await db('leave_types').first()).id, start_date: '2027-06-01', end_date: '2027-06-02', status: 'approved', total_days: 2 }).returning('*').then(r => r[0]);
      const token = getTestToken('employee', empUserId);

      const res = await request(app).put(`/api/leave/requests/${approvedReq.id}/cancel`).set('Authorization', token);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/leave/balance/:employeeId/:year', () => {
    it('returns correct balance after approved request', async () => {
      const leaveType = await db('leave_types').first();
      await db('leave_entitlements').where({ employee_id: empId, leave_type_id: leaveType.id }).delete();
      await db('leave_entitlements').insert({ employee_id: empId, leave_type_id: leaveType.id, year: 2028, total_days: 20, used_days: 0 });
      
      const req = await db('leave_requests').insert({ employee_id: empId, leave_type_id: leaveType.id, start_date: '2028-01-01', end_date: '2028-01-02', status: 'pending', total_days: 2 }).returning('*').then(r => r[0]);
      
      // Approve it (should deduct 2 days)
      await request(app).put(`/api/leave/requests/${req.id}/review`).set('Authorization', mgrToken).send({ status: 'approved' });

      const res = await request(app).get(`/api/leave/balance/${empId}/2028`).set('Authorization', getTestToken('employee', empUserId));
      expect(res.status).toBe(200);
      const balance = res.body.data.find((b: any) => b.leaveTypeId === leaveType.id);
      expect(balance.usedDays).toBe(2);
      expect(balance.remaining).toBe(18);
    });
  });

  describe('POST /api/leave/attendance/clock-in', () => {
    it('creates attendance record', async () => {
      const token = getTestToken('employee', empUserId);
      const res = await request(app).post('/api/leave/attendance/clock-in').set('Authorization', token);
      expect(res.status).toBe(201);
      expect(res.body.data.clockIn).toBeDefined();
    });

    it('returns 409 if already clocked in today', async () => {
      const token = getTestToken('employee', empUserId);
      const res = await request(app).post('/api/leave/attendance/clock-in').set('Authorization', token);
      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/leave/attendance/clock-out', () => {
    it('sets clock_out and calculates total_hours', async () => {
      const token = getTestToken('employee', empUserId);
      const res = await request(app).post('/api/leave/attendance/clock-out').set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.clockOut).toBeDefined();
      expect(res.body.data.totalHours).toBeDefined();
    });

    it('returns 400 if not clocked in', async () => {
      const token = getTestToken('employee', empUserId);
      // Already clocked out in the test above
      const res = await request(app).post('/api/leave/attendance/clock-out').set('Authorization', token);
      expect(res.status).toBe(400); 
    });
  });
});
import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';

describe('Notifications API', () => {

  describe('GET /api/notifications', () => {
    it('returns empty array for new user', async () => {
      // create a clean new user
      const emp = await db('employees').insert({ first_name: 'No', last_name: 'Notif', email: 'nonotif@test.com' }).returning('*').then(r => r[0]);
      const role = await db('roles').where({ name: 'employee' }).first();
      const user = await db('users').insert({ employee_id: emp.id, role_id: role.id, email: emp.email, password_hash: 'hi' }).returning('*').then(r => r[0]);
      
      const token = getTestToken('employee', user.id);
      const res = await request(app).get('/api/notifications').set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.items).toEqual([]);
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
      const n = await db('notifications').insert({ user_id: userId, title: 'T', message: 'M', type: 'info', is_read: false }).returning('*').then(r => r[0]);
      notifId = n.id;
    });

    it('marks notification as read', async () => {
      const token = getTestToken('employee', userId);
      const res = await request(app).patch(`/api/notifications/${notifId}/read`).set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.isRead).toBe(true);
    });

    it('returns 404 if notification belongs to different user', async () => {
      // Use different userId
      const token = getTestToken('employee', '00000000-0000-0000-0000-000000000000');
      const res = await request(app).patch(`/api/notifications/${notifId}/read`).set('Authorization', token);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    let userId: string;

    beforeAll(async () => {
      const user = await db('users').first();
      userId = user.id;
      await db('notifications').insert([
        { user_id: userId, title: '1', message: '1', type: 'info', is_read: false },
        { user_id: userId, title: '2', message: '2', type: 'info', is_read: false },
      ]);
    });

    it('marks all user notifications as read', async () => {
      const token = getTestToken('employee', userId);
      const res = await request(app).patch('/api/notifications/read-all').set('Authorization', token);
      expect(res.status).toBe(200);

      const notifs = await db('notifications').where({ user_id: userId, is_read: false });
      expect(notifs.length).toBe(0);
    });
  });

  describe('Integration: leave approval triggers notification', () => {
    it('after reviewLeaveRequest(approve), employee has 1 new notification', async () => {
      const u = await db('users').join('roles', 'users.role_id', 'roles.id').where('roles.name', 'employee').select('users.*').first();
      const empId = u.employee_id;
      
      const leaveType = await db('leave_types').first();
      
      const reqRecord = await db('leave_requests').insert({
        employee_id: empId,
        leave_type_id: leaveType.id,
        start_date: '2029-01-01',
        end_date: '2029-01-02',
        status: 'pending',
        total_days: 2
      }).returning('*').then(r => r[0]);

      const mgrToken = getTestToken('line_manager');
      
      // Approve leave
      await request(app)
        .put(`/api/leave/requests/${reqRecord.id}/review`)
        .set('Authorization', mgrToken)
        .send({ status: 'approved' });

      // Check notification
      const empToken = getTestToken('employee', u.id);
      const res = await request(app).get('/api/notifications').set('Authorization', empToken);
      
      expect(res.status).toBe(200);
      const notif = res.body.data.items.find((n: any) => n.title.includes('Leave') || n.message.includes('approv'));
      expect(notif).toBeDefined();
    });
  });
});
import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';

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
        .send({ name: 'Test Run', periodStart: '2026-01-31', periodEnd: '2026-01-01' });
      
      expect(res.status).toBe(400); // Or whatever handled by logic/Zod
    });

    it('returns 403 for employee-role', async () => {
      const token = getTestToken('employee');
      const res = await request(app)
        .post('/api/payroll/runs')
        .set('Authorization', token)
        .send({ name: 'Test Run', periodStart: '2026-01-01', periodEnd: '2026-01-31' });
      
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/payroll/runs/:id/status', () => {
    it('draft → reviewed', async () => {
      const token = getTestToken('hr_manager');
      const run = await db('payroll_runs').insert({ name: 'Trans', period_start: '2026-01-01', period_end: '2026-01-31', status: 'draft' }).returning('*').then(r => r[0]);
      
      const res = await request(app).put(`/api/payroll/runs/${run.id}/status`).set('Authorization', token).send({ status: 'reviewed' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('reviewed');
    });

    it('reviewed → approved', async () => {
      const token = getTestToken('hr_manager');
      const run = await db('payroll_runs').insert({ name: 'Trans', period_start: '2026-01-01', period_end: '2026-01-31', status: 'reviewed' }).returning('*').then(r => r[0]);
      
      const res = await request(app).put(`/api/payroll/runs/${run.id}/status`).set('Authorization', token).send({ status: 'approved' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });

    it('approved → paid', async () => {
      const token = getTestToken('hr_manager');
      const run = await db('payroll_runs').insert({ name: 'Trans', period_start: '2026-01-01', period_end: '2026-01-31', status: 'approved' }).returning('*').then(r => r[0]);
      
      const res = await request(app).put(`/api/payroll/runs/${run.id}/status`).set('Authorization', token).send({ status: 'paid' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('paid');
    });

    it('returns 400 for invalid transition (e.g. draft → approve)', async () => {
      const token = getTestToken('hr_manager');
      const run = await db('payroll_runs').insert({ name: 'Trans', period_start: '2026-01-01', period_end: '2026-01-31', status: 'draft' }).returning('*').then(r => r[0]);
      
      const res = await request(app).put(`/api/payroll/runs/${run.id}/status`).set('Authorization', token).send({ status: 'approved' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for unknown action', async () => {
      const token = getTestToken('hr_manager');
      const run = await db('payroll_runs').first();
      // Zod validation should catch this
      const res = await request(app).put(`/api/payroll/runs/${run.id}/status`).set('Authorization', token).send({ status: 'unknown' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/payroll/runs/:id/payslips/:employeeId', () => {
    it('returns payslip', async () => {
      const token = getTestToken('hr_manager');
      const payslip = await db('payslips').first();
      if (!payslip) return;
      const res = await request(app).get(`/api/payroll/runs/${payslip.payroll_run_id}/payslips/${payslip.employee_id}`).set('Authorization', token);
      expect(res.status).toBe(200);
      expect(parseFloat(res.body.data.netPay)).toBeGreaterThan(0);
    });
  });

  describe('GET /api/payroll/employees/:id/salary', () => {
    it('returns current active salary', async () => {
      const token = getTestToken('hr_manager');
      const rec = await db('salary_records').whereNull('end_date').first();
      const res = await request(app).get(`/api/payroll/employees/${rec.employee_id}/salary`).set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.baseSalary).toBe(rec.base_salary);
    });

    it('returns 404 if no salary record', async () => {
      const token = getTestToken('hr_manager');
      const emp = await db('employees').insert({ first_name: 'No', last_name: 'Sal', email: 'nosal@example.com' }).returning('*').then(r => r[0]);
      const res = await request(app).get(`/api/payroll/employees/${emp.id}/salary`).set('Authorization', token);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/payroll/employees/:id/salary', () => {
    it('creates salary, sets previous salary end_date, keeps history', async () => {
      const token = getTestToken('hr_manager');
      // Create fresh employee
      const emp = await db('employees').insert({ first_name: 'Sal', last_name: 'Test', email: 'saltest@example.com' }).returning('*').then(r => r[0]);
      
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
      expect(hist.body.data.salaries[0].endDate).toBeDefined(); // Previous
      expect(hist.body.data.salaries[1].endDate).toBeNull(); // Current
    });
  });

  describe('GET /api/payroll/tax-rules', () => {
    it('returns seeded GB tax bands', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).get('/api/payroll/tax-rules').set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});
import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';

describe('Performance API', () => {

  describe('POST /api/performance/cycles', () => {
    it('creates cycle (hr_manager)', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app)
        .post('/api/performance/cycles')
        .set('Authorization', token)
        .send({ name: '2026 Q1', startDate: '2026-01-01', endDate: '2026-03-31' });
      
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
      const oldActive = await db('appraisal_cycles').insert({ name: 'Old', start_date: '2025-01-01', end_date: '2025-12-31', status: 'active' }).returning('*').then(r => r[0]);
      const newCycle = await db('appraisal_cycles').insert({ name: 'New', start_date: '2027-01-01', end_date: '2027-12-31', status: 'draft' }).returning('*').then(r => r[0]);

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

    it('creates appraisal in draft status', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app)
        .post('/api/performance/appraisals')
        .set('Authorization', token)
        .send({ employeeId: empId, cycleId, selfReview: 'Good year', goalsScore: 4, coreValuesScore: 4 });
      
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('draft');
    });

    it('returns 409 if duplicate (same cycle + employee)', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app)
        .post('/api/performance/appraisals')
        .set('Authorization', token)
        .send({ employeeId: empId, cycleId, selfReview: 'Again?' });
      
      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/performance/appraisals/:id/advance', () => {
    let appraisalId: string;
    beforeAll(async () => {
      const empId = (await db('employees').first()).id;
      const cycleId = (await db('appraisal_cycles').first()).id;
      // use another employee to avoid duplicate error
      const emp2 = await db('employees').insert({ first_name: 'App', last_name: 'Test', email: 'app@test.com' }).returning('*').then(r => r[0]);
      const appRecord = await db('appraisals').insert({ employee_id: emp2.id, cycle_id: cycleId, status: 'draft' }).returning('*').then(r => r[0]);
      appraisalId = appRecord.id;
    });

    it('submit_self moves to submitted', async () => {
      const token = getTestToken('employee');
      const res = await request(app).post(`/api/performance/appraisals/${appraisalId}/advance`).set('Authorization', token).send({ action: 'submit_self' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('submitted');
    });

    it('submit_manager moves to reviewed', async () => {
      const token = getTestToken('line_manager');
      const res = await request(app).post(`/api/performance/appraisals/${appraisalId}/advance`).set('Authorization', token).send({ action: 'submit_manager' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('reviewed');
    });

    it('acknowledge moves to acknowledged', async () => {
      const token = getTestToken('employee');
      const res = await request(app).post(`/api/performance/appraisals/${appraisalId}/advance`).set('Authorization', token).send({ action: 'acknowledge' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('acknowledged');
    });

    it('returns 400 for invalid transition', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).post(`/api/performance/appraisals/${appraisalId}/advance`).set('Authorization', token).send({ action: 'submit_manager' });
      expect(res.status).toBe(400);
    });
  });

  describe('Goals & Key Results', () => {
    let goalId: string;
    let employeeId: string;

    beforeAll(async () => {
      employeeId = (await db('employees').first()).id;
    });

    it('POST /api/performance/goals creates goal for employee', async () => {
      const token = getTestToken('employee');
      const cycleId = (await db('appraisal_cycles').first()).id;
      const res = await request(app)
        .post('/api/performance/goals')
        .set('Authorization', token)
        .send({ employeeId, cycleId, title: 'Test Goal', description: 'desc', category: 'project', weight: 100 });
      
      expect(res.status).toBe(201);
      goalId = res.body.data.id;
    });

    it('POST /api/performance/key-results creates key result, goal completion % = 0', async () => {
      const token = getTestToken('employee');
      const res = await request(app)
        .post('/api/performance/key-results')
        .set('Authorization', token)
        .send({ goalId, title: 'KR 1', startValue: 0, targetValue: 10, unit: 'count' });
      
      expect(res.status).toBe(201);
      expect(res.body.data.currentValue).toBe(0);

      const goal = await db('goals').where({ id: goalId }).first();
      expect(Number(goal.completion_percentage)).toBe(0);
    });

    it('PUT /api/performance/key-results/:id updates currentValue, recalculates goal completion %', async () => {
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

    it('multiple key results: completion % is correct average', async () => {
      const token = getTestToken('employee');
      await request(app)
        .post('/api/performance/key-results')
        .set('Authorization', token)
        .send({ goalId, title: 'KR 2', startValue: 0, targetValue: 100, unit: 'percent', currentValue: 100 });
      
      // KR1 is at 50%, KR2 is at 100%, avg should be 75%
      const goal = await db('goals').where({ id: goalId }).first();
      expect(Number(goal.completion_percentage)).toBe(75);
    });
  });
});
import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';

describe('Recruitment API', () => {

  describe('POST /api/recruitment/candidates', () => {
    it('creates candidate (hr_manager)', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app)
        .post('/api/recruitment/candidates')
        .set('Authorization', token)
        .send({ firstName: 'John', lastName: 'Doe', email: 'johndoe@example.com', source: 'linkedin' });
      
      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
    });

    it('returns 403 for employee-role', async () => {
      const token = getTestToken('employee');
      const res = await request(app)
        .post('/api/recruitment/candidates')
        .set('Authorization', token)
        .send({ firstName: 'J', lastName: 'D', email: 'jd@example.com', source: 'linkedin' });
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/recruitment/applications', () => {
    it('creates application linking candidate + requisition', async () => {
      const token = getTestToken('hr_manager');
      const candidate = await db('candidates').first();
      const requisition = await db('job_requisitions').where('status', 'open').first();
      
      const res = await request(app)
        .post('/api/recruitment/applications')
        .set('Authorization', token)
        .send({ candidateId: candidate.id, requisitionId: requisition.id, notes: 'Good fit' });
      
      expect(res.status).toBe(201);
      expect(res.body.data.stage).toBe('applied');
    });
  });

  describe('PUT /api/recruitment/applications/:id/stage', () => {
    let appId: string;
    beforeAll(async () => {
      const candidate = await db('candidates').insert({ first_name: 'Staging', last_name: 'Test', email: 'stage@test.com' }).returning('*').then(r => r[0]);
      const requisition = await db('job_requisitions').first();
      const appRecord = await db('applications').insert({ candidate_id: candidate.id, requisition_id: requisition.id, stage: 'applied' }).returning('*').then(r => r[0]);
      appId = appRecord.id;
    });

    it('advances stage: applied → screening', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).put(`/api/recruitment/applications/${appId}/stage`).set('Authorization', token).send({ stage: 'screening' });
      expect(res.status).toBe(200);
      expect(res.body.data.stage).toBe('screening');
    });

    it('advances: screening → interview', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).put(`/api/recruitment/applications/${appId}/stage`).set('Authorization', token).send({ stage: 'interview' });
      expect(res.status).toBe(200);
      expect(res.body.data.stage).toBe('interview');
    });

    it('returns 400 for invalid backward transition', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).put(`/api/recruitment/applications/${appId}/stage`).set('Authorization', token).send({ stage: 'applied' });
      expect(res.status).toBe(400);
    });

    it('can always advance to rejected from any stage', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).put(`/api/recruitment/applications/${appId}/stage`).set('Authorization', token).send({ stage: 'rejected' });
      expect(res.status).toBe(200);
      expect(res.body.data.stage).toBe('rejected');
    });
  });

  describe('POST /api/recruitment/applications/:id/convert', () => {
    it('returns 400 if application stage !== hired', async () => {
      const token = getTestToken('hr_manager');
      const candidate = await db('candidates').insert({ first_name: 'NotHired', last_name: 'Test', email: 'no_h@t.com' }).returning('*').then(r => r[0]);
      const req = await db('job_requisitions').first();
      const application = await db('applications').insert({ candidate_id: candidate.id, requisition_id: req.id, stage: 'interview' }).returning('*').then(r => r[0]);

      const res = await request(app).post(`/api/recruitment/applications/${application.id}/convert`).set('Authorization', token).send({
        employmentType: 'full-time',
        baseSalary: 50000,
        currency: 'GBP'
      });
      expect(res.status).toBe(400);
    });

    it('creates user + employee record from hired candidate and creates onboarding checklist', async () => {
      const token = getTestToken('hr_manager');
      const candidate = await db('candidates').insert({ first_name: 'Hired', last_name: 'Test', email: 'hire_me@t.com' }).returning('*').then(r => r[0]);
      const req = await db('job_requisitions').first();
      const application = await db('applications').insert({ candidate_id: candidate.id, requisition_id: req.id, stage: 'hired' }).returning('*').then(r => r[0]);
      const offer = await db('offer_letters').insert({ application_id: application.id, status: 'accepted', salary: 60000 }).returning('*').then(r => r[0]);

      const res = await request(app).post(`/api/recruitment/applications/${application.id}/convert`).set('Authorization', token).send({
        employmentType: 'full-time',
        baseSalary: 60000,
        currency: 'GBP'
      });
      
      expect(res.status).toBe(201);
      const newEmpId = res.body.data.id;
      
      const user = await db('users').where({ employee_id: newEmpId }).first();
      expect(user).toBeDefined();

      const checklist = await db('onboarding_checklists').where({ employee_id: newEmpId }).first();
      expect(checklist).toBeDefined();
    });
  });

  describe('Onboarding', () => {
    let empId: string;
    beforeAll(async () => {
      const checklist = await db('onboarding_checklists').first();
      empId = checklist.employee_id;
    });

    it('GET /api/recruitment/onboarding/:employeeId returns checklist with default tasks', async () => {
      const token = getTestToken('employee');
      const res = await request(app).get(`/api/recruitment/onboarding/${empId}`).set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBeGreaterThan(0);
    });

    it('PATCH /api/recruitment/onboarding/tasks/:taskId marks task complete/incomplete', async () => {
      const token = getTestToken('employee');
      const checklist = await db('onboarding_checklists').where({ employee_id: empId }).first();
      const task = await db('onboarding_tasks').where({ checklist_id: checklist.id }).first();
      
      // Complete
      let res = await request(app).put(`/api/recruitment/onboarding/tasks/${task.id}`).set('Authorization', token).send({ completed: true });
      expect(res.status).toBe(200);
      expect(res.body.data.completedAt).toBeDefined();
      
      // Incomplete
      res = await request(app).put(`/api/recruitment/onboarding/tasks/${task.id}`).set('Authorization', token).send({ completed: false });
      expect(res.status).toBe(200);
      expect(res.body.data.completedAt).toBeNull();
    });
  });
});
import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import { getTestToken } from './helpers/getTestToken';

describe('Search API', () => {

  describe('GET /api/search?q=:query', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/search?q=test');
      expect(res.status).toBe(401);
    });

    it('returns 400 if q shorter than 2 chars', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).get('/api/search?q=a').set('Authorization', token);
      expect(res.status).toBe(400);
    });

    it('searching parts of name returns employees array', async () => {
      const token = getTestToken('hr_manager');
      // "Emp" since I seeded 'justanemp' or 'App Test'  
      const res = await request(app).get('/api/search?q=Test').set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.employees).toBeDefined();
      expect(Array.isArray(res.body.data.employees)).toBe(true);
    });

    it('searching title returns courses array', async () => {
      const token = getTestToken('hr_manager');
      await db('courses').insert({ title: 'Annual Safety Protocol', type: 'internal' });
      const res = await request(app).get('/api/search?q=Annual').set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.courses).toBeDefined();
      expect(res.body.data.courses.length).toBeGreaterThan(0);
    });

    it('employee-role token: employees array is empty', async () => {
      const token = getTestToken('employee');
      const res = await request(app).get('/api/search?q=Test').set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body.data.employees).toBeDefined();
      expect(res.body.data.employees.length).toBe(0);
    });

    it('results each have: type, id, title, subtitle, url fields', async () => {
      const token = getTestToken('hr_manager');
      const res = await request(app).get('/api/search?q=Test').set('Authorization', token);
      
      const item = res.body.data.employees[0];
      if (item) {
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('subtitle');
        expect(item).toHaveProperty('url');
      }
    });
  });
});
