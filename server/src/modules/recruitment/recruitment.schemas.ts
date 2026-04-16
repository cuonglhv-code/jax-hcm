import { z } from 'zod';

export const createRequisitionSchema = z.object({
  title:        z.string().min(1).max(255),
  departmentId: z.string().uuid(),
  headcount:    z.number().int().min(1).default(1),
  description:  z.string().optional(),
  closingDate:  z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/).optional(),
  status:       z.enum(['open','closed','on_hold']).default('open'),
});

export const createCandidateSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName:  z.string().min(1).max(100),
  email:     z.string().email(),
  phone:     z.string().max(50).optional(),
});

export const createApplicationSchema = z.object({
  candidateId:   z.string().uuid(),
  requisitionId: z.string().uuid(),
  notes:         z.string().optional(),
});

export const advanceStageSchema = z.object({
  stage: z.enum(['applied','screening','interview','offer','hired','rejected']),
  notes: z.string().optional(),
});

export const createInterviewSchema = z.object({
  scheduledAt:   z.string().datetime(),
  interviewerId: z.string().uuid(),
  notes:         z.string().optional(),
});

export const updateInterviewSchema = createInterviewSchema.partial().extend({
  outcome: z.enum(['pass','fail','pending']).optional(),
});

export const createOfferSchema = z.object({
  salary:     z.number().positive(),
  currency:   z.string().length(3).default('GBP'),
  startDate:  z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),
  expiryDate: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/).optional(),
});

export const convertCandidateSchema = z.object({
  departmentId:   z.string().uuid(),
  jobTitleId:     z.string().uuid(),
  managerId:      z.string().uuid().optional(),
  employmentType: z.enum(['full_time','part_time','contractor','intern']),
  hireDate:       z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),
});
