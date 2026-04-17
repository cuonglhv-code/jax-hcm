import { getPagination, buildPaginationMeta } from '../../utils/pagination';

describe('Pagination Unit Tests', () => {

  describe('getPagination', () => {
    it('defaults: page=1, limit=20, offset=0', () => {
      expect(getPagination({})).toEqual({ page: 1, limit: 20, offset: 0 });
    });

    it('page=2, limit=10 → offset=10', () => {
      expect(getPagination({ page: '2', limit: '10' })).toEqual({ page: 2, limit: 10, offset: 10 });
    });

    it('limit > 100 is clamped to 100', () => {
      expect(getPagination({ page: '1', limit: '200' })).toEqual({ page: 1, limit: 100, offset: 0 });
    });

    it('limit < 1 defaults to 1 or 20', () => {
      const res = getPagination({ page: '1', limit: '0' });
      expect(res.limit).toBeGreaterThan(0);
    });

    it('non-numeric page defaults to 1', () => {
      expect(getPagination({ page: 'abc', limit: '10' })).toEqual({ page: 1, limit: 10, offset: 0 });
    });

    it('negative page defaults to 1', () => {
      expect(getPagination({ page: '-5', limit: '10' })).toEqual({ page: 1, limit: 10, offset: 0 });
    });
  });

  describe('buildMeta', () => {
    it('totalPages = ceil(total / limit)', () => {
      expect(buildPaginationMeta(100, 1, 30)).toEqual({
        total: 100,
        page: 1,
        limit: 30,
        totalPages: 4
      });
    });

    it('total=0 → totalPages=0', () => {
      expect(buildPaginationMeta(0, 1, 20)).toMatchObject({ totalPages: 0 });
    });

    it('total=1, limit=20 → totalPages=1', () => {
      expect(buildPaginationMeta(1, 1, 20)).toMatchObject({ totalPages: 1 });
    });
  });
});


