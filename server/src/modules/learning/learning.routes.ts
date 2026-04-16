import { Router } from 'express';
import { learningController as ctrl } from './learning.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { paginate } from '../../middleware/paginate';
import { ROLES } from '@hcm/shared';
import * as schemas from './learning.schemas';

const router = Router();

// Courses
router.get('/courses', authenticate, paginate, ctrl.listCourses);
router.post('/courses', authenticate, authorize(ROLES.HR_MANAGER), validate(schemas.createCourseSchema), ctrl.createCourse);
router.get('/courses/:id', authenticate, ctrl.getCourse);
router.put('/courses/:id', authenticate, authorize(ROLES.HR_MANAGER), ctrl.updateCourse);
router.delete('/courses/:id', authenticate, authorize(ROLES.HR_MANAGER), ctrl.deleteCourse);

// Enrolments
router.post('/enrolments', authenticate, validate(schemas.enrolSchema), ctrl.enrolEmployee);
router.get('/enrolments/employee/:employeeId', authenticate, ctrl.listEnrolmentsByEmployee);
router.get('/enrolments/course/:courseId', authenticate, authorize(ROLES.HR_MANAGER), paginate, ctrl.listEnrolmentsByCourse);
router.patch('/enrolments/:id/status', authenticate, validate(schemas.updateEnrolmentSchema), ctrl.updateEnrolmentStatus);

// Certificates
router.get('/certificates/:id', authenticate, ctrl.getCertificate);

// Learning Plans
router.get('/plans', authenticate, paginate, ctrl.listPlans);
router.post('/plans', authenticate, authorize(ROLES.HR_MANAGER), validate(schemas.createPlanSchema), ctrl.createPlan);
router.get('/plans/:id', authenticate, ctrl.getPlan);
router.put('/plans/:id/items', authenticate, authorize(ROLES.HR_MANAGER), ctrl.updatePlanItems);

// Mandatory Training
router.get('/mandatory', authenticate, ctrl.listMandatoryTraining);
router.post('/mandatory', authenticate, authorize(ROLES.HR_MANAGER), validate(schemas.createMandatoryTrainingSchema), ctrl.createMandatoryTraining);
router.delete('/mandatory/:id', authenticate, authorize(ROLES.HR_MANAGER), ctrl.deleteMandatoryTraining);
router.get('/mandatory/status/:employeeId', authenticate, ctrl.getMandatoryTrainingStatus);

export { router as learningRouter };
