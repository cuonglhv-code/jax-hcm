import { Router } from 'express';
import { performanceController as ctrl } from './performance.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { paginate } from '../../middleware/paginate';
import { ROLES } from '@hcm/shared';
import * as schemas from './performance.schemas';

const router = Router();

// Cycles
router.get('/cycles', authenticate, paginate, ctrl.listCycles);
router.post('/cycles', authenticate, authorize(ROLES.HR_MANAGER), validate(schemas.createCycleSchema), ctrl.createCycle);
router.get('/cycles/:id', authenticate, ctrl.getCycle);
router.post('/cycles/:id/activate', authenticate, authorize(ROLES.HR_MANAGER), ctrl.activateCycle);

// Appraisals
router.get('/appraisals', authenticate, paginate, ctrl.listAppraisals);
router.post('/appraisals', authenticate, authorize(ROLES.HR_MANAGER), validate(schemas.createAppraisalSchema), ctrl.createAppraisal);
router.get('/appraisals/:id', authenticate, ctrl.getAppraisal);
router.post('/appraisals/:id/advance', authenticate, validate(schemas.advanceAppraisalSchema), ctrl.advanceAppraisal);
router.post('/appraisals/:id/responses', authenticate, validate(schemas.submitResponsesSchema), ctrl.saveResponses);

// Goals
router.get('/goals', authenticate, ctrl.listGoals);
router.post('/goals', authenticate, validate(schemas.createGoalSchema), ctrl.createGoal);
router.get('/goals/:id', authenticate, ctrl.getGoal);
router.put('/goals/:id', authenticate, validate(schemas.createGoalSchema.partial()), ctrl.updateGoal);
router.delete('/goals/:id', authenticate, ctrl.deleteGoal);

// Key Results
router.post('/key-results', authenticate, validate(schemas.createKeyResultSchema), ctrl.createKeyResult);
router.put('/key-results/:id', authenticate, validate(schemas.updateKeyResultSchema), ctrl.updateKeyResult);
router.delete('/key-results/:id', authenticate, ctrl.deleteKeyResult);

// Dashboard
router.get('/dashboard', authenticate, authorize(ROLES.LINE_MANAGER), ctrl.getDepartmentDashboard);

export { router as performanceRouter };
