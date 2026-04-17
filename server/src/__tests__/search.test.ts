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


