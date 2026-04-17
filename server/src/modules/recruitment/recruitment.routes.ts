import { Router } from 'express';
import { recruitmentController as ctrl } from './recruitment.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { paginate } from '../../middleware/paginate';
import { ROLES } from '@hcm/shared';
import * as schemas from './recruitment.schemas';

const router = Router();

// Requisitions
router.get('/requisitions', authenticate, paginate, ctrl.listRequisitions);
router.post('/requisitions', authenticate, authorize(ROLES.HR_MANAGER), validate(schemas.createRequisitionSchema), ctrl.createRequisition);
router.get('/requisitions/:id', authenticate, ctrl.getRequisition);
router.put('/requisitions/:id', authenticate, authorize(ROLES.HR_MANAGER), ctrl.updateRequisition);
router.post('/requisitions/:id/close', authenticate, authorize(ROLES.HR_MANAGER), ctrl.closeRequisition);

// Candidates
router.get('/candidates', authenticate, paginate, ctrl.listCandidates);
router.post('/candidates', authenticate, authorize(ROLES.HR_MANAGER), validate(schemas.createCandidateSchema), ctrl.createCandidate);
router.get('/candidates/:id', authenticate, ctrl.getCandidate);
router.put('/candidates/:id', authenticate, authorize(ROLES.HR_MANAGER), ctrl.updateCandidate);

// Applications
router.post('/applications', authenticate, authorize(ROLES.HR_MANAGER), validate(schemas.createApplicationSchema), ctrl.createApplication);
router.get('/applications/requisition/:requisitionId', authenticate, ctrl.getApplicationsByRequisition);
router.get('/applications/candidate/:candidateId', authenticate, ctrl.getApplicationsByCandidate);
router.post('/applications/:id/advance', authenticate, authorize(ROLES.HR_MANAGER), validate(schemas.advanceStageSchema), ctrl.advanceStage);
router.post('/applications/:id/convert', authenticate, authorize(ROLES.HR_MANAGER), validate(schemas.convertCandidateSchema), ctrl.convertToEmployee);

// Interviews
router.get('/applications/:id/interviews', authenticate, ctrl.listInterviews);
router.post('/applications/:id/interviews', authenticate, authorize(ROLES.HR_MANAGER), validate(schemas.createInterviewSchema), ctrl.createInterview);
router.put('/interviews/:id', authenticate, authorize(ROLES.HR_MANAGER), validate(schemas.updateInterviewSchema), ctrl.updateInterview);

// Offer Letters
router.post('/applications/:id/offer', authenticate, authorize(ROLES.HR_MANAGER), validate(schemas.createOfferSchema), ctrl.createOffer);
router.put('/offers/:id/status', authenticate, authorize(ROLES.HR_MANAGER), ctrl.updateOfferStatus);

import { generateOfferLetterPDF } from './offerLetter.pdf';
router.get('/offers/:id/pdf', asyncHandler(async (req, res) => {
  const data = await ctrl.getOfferDataForPdf(req.params.id);
  const buffer = await generateOfferLetterPDF(data);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="offer-letter-${req.params.id}.pdf"`);
  res.send(buffer);
}));

// Onboarding
router.get('/onboarding/:employeeId', authenticate, ctrl.getOnboardingChecklist);
router.patch('/onboarding/tasks/:taskId', authenticate, ctrl.updateTaskCompletion);

export { router as recruitmentRouter };
