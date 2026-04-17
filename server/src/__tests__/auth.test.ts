import request from 'supertest';
import app from '../app';
import { db } from '../config/database';
import jwt from 'jsonwebtoken';

describe('Auth API', () => {
  const adminCredentials = {
    email: 'admin@jaxtina.com',
    password: 'Password123!'
  };

  describe('POST /api/auth/login', () => {
    it('returns 200 + accessToken with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(adminCredentials);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('sets httpOnly refreshToken cookie on success', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(adminCredentials);

      const cookies = res.get('Set-Cookie');
      expect(cookies).toBeDefined();
      expect(cookies?.some(c => c.includes('refreshToken'))).toBe(true);
      expect(cookies?.some(c => c.includes('HttpOnly'))).toBe(true);
    });

    it('returns 401 with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: adminCredentials.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('returns 400 with missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'Password123!' });

      expect(res.status).toBe(400);
    });

    it('returns 400 with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notanemail', password: 'Password123!' });

      expect(res.status).toBe(400);
    });

    it('returns 401 with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@jaxtina.com', password: 'Password123!' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('returns new accessToken with valid refresh cookie', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send(adminCredentials);
      
      const refreshCookie = loginRes.get('Set-Cookie')!.find(c => c.includes('refreshToken'))!;

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [refreshCookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('returns 401 without cookie', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current user with valid token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send(adminCredentials);
      
      const token = loginRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(adminCredentials.email);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns 401 with expired token', async () => {
      const secret = process.env.JWT_SECRET || 'test-secret-32-chars-minimum-here';
      const expiredToken = jwt.sign(
        { userId: 'test-id', email: 'test@test.com', role: 'employee' },
        secret,
        { expiresIn: '1ms' }
      );

      await new Promise(resolve => setTimeout(resolve, 5));

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
        .send(adminCredentials);
      
      const refreshCookie = loginRes.get('Set-Cookie')!.find(c => c.includes('refreshToken'))!;

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [refreshCookie]);

      expect(res.status).toBe(200);
      const cookies = res.get('Set-Cookie');
      expect(cookies?.some(c => c.includes('refreshToken=;'))).toBe(true);
    });

    it('refresh token is invalid after logout', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send(adminCredentials);
      
      const refreshCookie = loginRes.get('Set-Cookie')!.find(c => c.includes('refreshToken'))!;

      await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [refreshCookie]);

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [refreshCookie]);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('returns 200 with correct current password', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send(adminCredentials);
      
      const token = loginRes.body.data.accessToken;

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!'
        });

      expect(res.status).toBe(200);
    });

    it('returns 400 with wrong current password', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send(adminCredentials);
      
      const token = loginRes.body.data.accessToken;

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'NewPassword123!'
        });

      expect(res.status).toBe(400);
    });

    it('returns 401 without token', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!'
        });

      expect(res.status).toBe(401);
    });
  });
});
