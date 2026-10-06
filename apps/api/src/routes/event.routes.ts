import { Router } from 'express';
import { EventController } from '../controllers/event.controller.js';
import { XmlController } from '../controllers/xml.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createEventSchema, eventQuerySchema, updateEventSchema } from '@pulsepass/shared';

const router = Router();

router.get('/', validate(eventQuerySchema, 'query'), EventController.list);

// XML Import (must precede /:id)
router.post(
  '/import-xml',
  authenticate,
  requireRole('organizer', 'admin'),
  XmlController.importEventXml,
);

// XML Export
router.get('/:id/xml', XmlController.exportEventXml);

router.get('/:id', EventController.getById);

// Organizer / Admin actions
router.post(
  '/',
  authenticate,
  requireRole('organizer', 'admin'),
  validate(createEventSchema, 'body'),
  EventController.create,
);

router.put(
  '/:id',
  authenticate,
  requireRole('organizer', 'admin'),
  validate(updateEventSchema, 'body'),
  EventController.update,
);

router.patch(
  '/:id/publish',
  authenticate,
  requireRole('organizer', 'admin'),
  EventController.publish,
);

router.patch(
  '/:id/cancel',
  authenticate,
  requireRole('organizer', 'admin'),
  EventController.cancel,
);

export default router;
