import { calculateWorkingDays, hasOverlap } from '../../modules/leave/leave.utils';
import { db } from '../../config/database';

jest.mock('../../config/database', () => ({
  db: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    whereIn: jest.fn().mockReturnThis(),
  }))
}));

describe('Leave Service Unit Tests', () => {

  describe('Working days calculation', () => {
    it('Mon–Fri (5 days) → 5 working days', () => {
      expect(calculateWorkingDays('2026-06-01', '2026-06-05')).toBe(5); // Jun 1 2026 is Mon
    });

    it('Mon–Sun (7 days) → 5 working days (excludes weekend)', () => {
      expect(calculateWorkingDays('2026-06-01', '2026-06-07')).toBe(5);
    });

    it('Mon–Mon (8 days spanning weekend) → 6 working days', () => {
      expect(calculateWorkingDays('2026-06-01', '2026-06-08')).toBe(6);
    });

    it('Same day → 1 working day', () => {
      expect(calculateWorkingDays('2026-06-01', '2026-06-01')).toBe(1);
    });

    it('Saturday → 0 working days', () => {
      expect(calculateWorkingDays('2026-06-06', '2026-06-06')).toBe(0);
    });
  });

  describe('Leave overlap detection', () => {
    it('no overlap when ranges don\'t touch', () => {
      expect(hasOverlap('2026-01-01', '2026-01-05', '2026-01-10', '2026-01-15')).toBe(false);
    });

    it('overlap when new start is within existing range', () => {
      expect(hasOverlap('2026-01-04', '2026-01-08', '2026-01-01', '2026-01-05')).toBe(true);
    });

    it('overlap when new range contains existing range', () => {
      expect(hasOverlap('2026-01-01', '2026-01-10', '2026-01-04', '2026-01-05')).toBe(true);
    });

    it('no overlap after existing request is rejected (simulated)', () => {
      // It's tested via pure logic, the DB handles filtering rejected requests
      expect(hasOverlap('2026-01-01', '2026-01-05', '2026-02-01', '2026-02-05')).toBe(false);
    });
  });
});


