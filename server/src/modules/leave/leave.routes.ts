import { Router } from 'express';
import { leaveController as ctrl } from './leave.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { paginate } from '../../middleware/paginate';
import { ROLES } from '@hcm/shared';
import * as schemas from './leave.schemas';

const router = Router();

// Types
router.get('/types', authenticate, ctrl.listLeaveTypes);
router.post('/types', authenticate, authorize(ROLES.HR_MANAGER), validate(schemas.createLeaveTypeSchema), ctrl.createLeaveType);
router.put('/types/:id', authenticate, authorize(ROLES.HR_MANAGER), ctrl.updateLeaveType);

// Entitlements
router.get('/entitlements/:employeeId', authenticate, ctrl.getEntitlements);
router.post('/entitlements', authenticate, authorize(ROLES.HR_MANAGER), validate(schemas.createEntitlementSchema), ctrl.createEntitlement);

// Balance
router.get('/balance/:employeeId', authenticate, ctrl.getLeaveBalance);

// Requests
router.get('/requests', authenticate, paginate, ctrl.listLeaveRequests);
router.post('/requests', authenticate, validate(schemas.createLeaveRequestSchema), ctrl.createLeaveRequest);
router.get('/requests/:id', authenticate, ctrl.getLeaveRequest);
router.post('/requests/:id/review', authenticate, authorize(ROLES.LINE_MANAGER), validate(schemas.reviewLeaveSchema), ctrl.reviewLeaveRequest);
router.post('/requests/:id/cancel', authenticate, ctrl.cancelLeaveRequest);

// Calendar
router.get('/calendar', authenticate, ctrl.getTeamCalendar);

// Holidays
router.get('/holidays', authenticate, ctrl.listPublicHolidays);
router.post('/holidays', authenticate, authorize(ROLES.HR_MANAGER), ctrl.createPublicHoliday);
router.delete('/holidays/:id', authenticate, authorize(ROLES.HR_MANAGER), ctrl.deletePublicHoliday);

// Attendance
router.post('/attendance/clock-in', authenticate, validate(schemas.clockSchema), ctrl.clockIn);
router.post('/attendance/clock-out', authenticate, ctrl.clockOut);
router.get('/attendance', authenticate, paginate, ctrl.listAttendance);
router.get('/attendance/export', authenticate, ctrl.exportAttendanceCSV);

export { router as leaveRouter };
