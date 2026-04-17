import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as authService from '../../modules/auth/auth.service';
import * as payrollService from '../../modules/payroll/payroll.service';

describe('Auth Service Unit Tests', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-32-chars-minimum-here';
    process.env.JWT_EXPIRES_IN = '15m';
  });

  describe('signAccessToken', () => {
    it('returns a string that jwt.verify decodes correctly', () => {
      const payload = { userId: '123', email: 'test@t.com', role: 'admin' as any };
      const token = authService.signAccessToken(payload);
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('contains userId, email, role in payload', () => {
      const payload = { userId: '123', email: 'test@t.com', role: 'admin' as any };
      const token = authService.signAccessToken(payload);
      const decoded = jwt.decode(token) as any;
      
      expect(decoded).toMatchObject(payload);
    });
  });

  describe('signRefreshToken', () => {
    it('raw is 64 hex chars, hash is SHA-256 of raw, raw !== hash', () => {
      const { raw, hash } = authService.signRefreshToken();
      expect(raw).toHaveLength(64);
      expect(raw).toMatch(/^[0-9a-f]+$/);
      
      const expectedHash = crypto.createHash('sha256').update(raw).digest('hex');
      expect(hash).toBe(expectedHash);
      expect(raw).not.toBe(hash);
    });
  });
});

describe('Payroll Tax Service Unit', () => {
  describe('calculateTax', () => {
    const rules = [
      { min_income: '0', max_income: '12570', rate: '0' },
      { min_income: '12570', max_income: '50270', rate: '0.20' },
      { min_income: '50270', max_income: '125140', rate: '0.40' },
      { min_income: '125140', max_income: null, rate: '0.45' }
    ] as any;

    it('income £10,000 → tax = 0 (below personal allowance)', () => {
      const tax = payrollService.calculateTax(10000, rules);
      expect(tax).toBe(0);
    });

    it('income £20,000 → tax = (20000 - 12570) * 0.20 = £1,486', () => {
      const tax = payrollService.calculateTax(20000, rules);
      expect(tax).toBe(1486);
    });

    it('income £60,000 → basic rate on 12570–50270 + higher on 50270–60000', () => {
      const tax = payrollService.calculateTax(60000, rules);
      const basic = (50270 - 12570) * 0.20; 
      const higher = (60000 - 50270) * 0.40; 
      expect(tax).toBe(basic + higher);
    });

    it('handles empty tax rules array → returns 0', () => {
      const tax = payrollService.calculateTax(50000, []);
      expect(tax).toBe(0);
    });
  });
});


