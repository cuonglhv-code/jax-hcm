import { ROLES } from '@hcm/shared/src/constants/roles';

describe('Shared Workspace Integration', () => {
  it('correctly imports constants from @hcm/shared', () => {
    expect(ROLES.SUPER_ADMIN).toBe('super_admin');
    expect(ROLES.HR_MANAGER).toBe('hr_manager');
    expect(ROLES.LINE_MANAGER).toBe('line_manager');
    expect(ROLES.EMPLOYEE).toBe('employee');
  });

  it('verifies Role values match database constraints', () => {
     // Database uses 'super_admin', 'hr_manager', 'line_manager', 'employee'
     const roles = Object.values(ROLES);
     expect(roles).toContain('super_admin');
     expect(roles).toContain('employee');
  });
});
