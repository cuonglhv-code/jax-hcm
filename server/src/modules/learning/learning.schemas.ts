import { z } from 'zod';

export const createCourseSchema = z.object({
  title:         z.string().min(1).max(255),
  description:   z.string().optional(),
  type:          z.enum(['internal','external']),
  provider:      z.string().max(255).optional(),
  durationHours: z.number().positive().optional(),
  isMandatory:   z.boolean().default(false),
});

export const enrolSchema = z.object({
  courseId:    z.string().uuid(),
  employeeId:  z.string().uuid(),
  expiresAt:   z.string().datetime().optional(),
});

export const updateEnrolmentSchema = z.object({
  status: z.enum(['enrolled','in_progress','completed','withdrawn']),
});

export const createPlanSchema = z.object({
  name:                     z.string().min(1),
  assignedToEmployeeId:     z.string().uuid().optional(),
  assignedToJobTitleId:     z.string().uuid().optional(),
  items: z.array(z.object({
    courseId:   z.string().uuid(),
    order:      z.number().int().nonnegative(),
    isRequired: z.boolean().default(true),
  })).optional(),
});

export const createMandatoryTrainingSchema = z.object({
  courseId:           z.string().uuid(),
  jobTitleId:         z.string().uuid().optional(),
  departmentId:       z.string().uuid().optional(),
  renewalPeriodDays:  z.number().int().positive().optional(),
});


