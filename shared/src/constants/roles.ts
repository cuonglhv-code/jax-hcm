export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  HR_MANAGER: 'hr_manager',
  LINE_MANAGER: 'line_manager',
  EMPLOYEE: 'employee',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<Role, number> = {
  super_admin: 4,
  hr_manager: 3,
  line_manager: 2,
  employee: 1,
};
