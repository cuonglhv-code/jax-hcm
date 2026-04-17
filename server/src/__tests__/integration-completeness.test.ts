import fs from 'fs';
import path from 'path';

describe('Integration Completeness', () => {
  const testDir = __dirname;
  const requiredTests = [
    'auth.test.ts',
    'employees.test.ts',
    'leave.test.ts',
    'payroll.test.ts',
    'performance.test.ts',
    'learning.test.ts',
    'notifications.test.ts',
    'admin.test.ts',
    'shared-workspace.test.ts'
  ];

  it('has all required integration test files', () => {
    requiredTests.forEach(testFile => {
      const filePath = path.join(testDir, testFile);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});
