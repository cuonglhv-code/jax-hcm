import { z } from 'zod';

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  dateOfBirth: z.string().date().optional(),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).optional(),
  nationality: z.string().max(100).optional(),
  address: z.string().optional(),
  departmentId: z.string().uuid(),
  jobTitleId: z.string().uuid(),
  managerId: z.string().uuid().optional(),
  employmentType: z
    .enum(['full_time', 'part_time', 'contract', 'intern'])
    .default('full_time'),
  startDate: z.string().date(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  status: z.enum(['active', 'inactive', 'on_leave', 'terminated']).optional(),
  endDate: z.string().date().optional(),
});

export const employeeQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  status: z.enum(['active', 'inactive', 'on_leave', 'terminated']).optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']).optional(),
});

export const createJobTitleSchema = z.object({
  title: z.string().min(1).max(150),
  departmentId: z.string().uuid(),
  level: z.number().int().min(1).max(5).default(2),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(1).max(150),
  code: z.string().min(1).max(20),
  description: z.string().optional(),
  managerId: z.string().uuid().optional(),
});
