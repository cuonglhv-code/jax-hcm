import { success, error } from '../../utils/responseEnvelope';

describe('Response Envelope Unit Tests', () => {

  describe('success()', () => {
    it('{ success: true, data: value }', () => {
      const res = success({ key: 'value' });
      expect(res).toEqual({ success: true, data: { key: 'value' } });
    });

    it('with meta: includes meta field', () => {
      const metaObj = { total: 10, limit: 10, page: 1, totalPages: 1 };
      const res = success({ key: 'value' }, metaObj);
      expect(res).toEqual({ success: true, data: { key: 'value' }, meta: metaObj });
    });

    it('without meta: no meta key present', () => {
      const res = success('ok');
      expect(res).not.toHaveProperty('meta');
    });
  });

  describe('error()', () => {
    it('{ success: false, error: message }', () => {
      const res = error('Something went wrong');
      expect(res).toEqual({ success: false, error: 'Something went wrong' });
    });

    it('data key is absent', () => {
      const res = error('Something went wrong');
      expect(res).not.toHaveProperty('data');
    });
  });
});


