import { Router } from 'express';
import { OrganizerController } from '../controllers/organizer.controller.js';
import { XmlController } from '../controllers/xml.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate, requireRole('organizer', 'admin'));

router.get('/stats', OrganizerController.getStats);
router.get('/events/:id/attendees', OrganizerController.getAttendees);
router.get('/events/:id/attendees/export', OrganizerController.exportAttendeesCsv);
router.get('/events/:id/export-sax', XmlController.exportTicketsSax);
router.get('/events/:id/metrics', OrganizerController.getMetrics);

export default router;
