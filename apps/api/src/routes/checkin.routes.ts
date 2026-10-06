import { Router } from 'express';
import { CheckinController } from '../controllers/checkin.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { verifyCheckinSchema } from '@pulsepass/shared';

const router = Router();

// Only organizers and admins can verify tickets and view logs
router.post(
  '/verify',
  authenticate,
  requireRole('organizer', 'admin'),
  validate(verifyCheckinSchema, 'body'),
  CheckinController.verify,
);

router.get(
  '/events/:eventId/log',
  authenticate,
  requireRole('organizer', 'admin'),
  CheckinController.getLog,
);

export default router;
