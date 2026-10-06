import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { reservationHoldSchema } from '@pulsepass/shared';

const router = Router();

// Atomic hold creation
router.post(
  '/',
  authenticate,
  validate(reservationHoldSchema, 'body'),
  ReservationController.createHold,
);

router.get('/:id', authenticate, ReservationController.getById);
router.delete('/:id', authenticate, ReservationController.release);

export default router;
