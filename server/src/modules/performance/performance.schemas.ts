import { z } from 'zod';

export const createCycleSchema = z.object({
  name:      z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isActive:  z.boolean().default(false),
});

export const createAppraisalSchema = z.object({
  cycleId:    z.string().uuid(),
  employeeId: z.string().uuid(),
  managerId:  z.string().uuid(),
});

export const submitResponsesSchema = z.object({
  responses: z.array(z.object({
    questionId:  z.string().uuid(),
    ratingValue: z.number().min(0).max(10).optional(),
    textValue:   z.string().optional(),
  })).min(1),
});

export const advanceAppraisalSchema = z.object({
  action: z.enum(['submit_self','submit_manager','acknowledge']),
});

export const createGoalSchema = z.object({
  title:       z.string().min(1).max(255),
  description: z.string().optional(),
  employeeId:  z.string().uuid().optional(),
  cycleId:     z.string().uuid().optional(),
  dueDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category:    z.string().optional(),
  weight:      z.number().int().min(0).max(100).default(0),
});

export const createKeyResultSchema = z.object({
  goalId:       z.string().uuid(),
  title:        z.string().min(1),
  startValue:   z.number().default(0),
  targetValue:  z.number(),
  currentValue: z.number().default(0),
  unit:         z.string().optional(),
});

export const updateKeyResultSchema = z.object({
  currentValue: z.number().nonnegative(),
});


