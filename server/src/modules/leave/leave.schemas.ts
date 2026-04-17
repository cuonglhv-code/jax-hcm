import { z } from 'zod';

export const createLeaveTypeSchema = z.object({
  name:             z.string().min(1).max(100),
  isPaid:           z.boolean().default(true),
  defaultDays:      z.number().int().nonnegative().default(0),
  allowCarryOver:   z.boolean().default(false),
  maxCarryOverDays: z.number().int().positive().optional(),
});

export const createEntitlementSchema = z.object({
  employeeId:   z.string().uuid(),
  leaveTypeId:  z.string().uuid(),
  year:         z.number().int().min(2020).max(2100),
  totalDays:    z.number().positive(),
  carryOverDays: z.number().nonnegative().default(0),
});

export const createLeaveRequestSchema = z.object({
  leaveTypeId: z.string().uuid(),
  startDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason:      z.string().max(500).optional(),
}).refine(d => new Date(d.endDate) >= new Date(d.startDate), {
  message: 'endDate must be on or after startDate',
  path: ['endDate'],
});

export const reviewLeaveSchema = z.object({
  action: z.enum(['approve','reject']),
  notes:  z.string().optional(),
});

export const clockSchema = z.object({
  date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().optional(),
});


