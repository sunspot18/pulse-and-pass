import { Router } from 'express';
import { TicketController } from '../controllers/ticket.controller.js';
import { XmlController } from '../controllers/xml.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/wallet', authenticate, TicketController.getWallet);
router.get('/:id/print', authenticate, XmlController.printTicketHtml);
router.get('/:id', authenticate, TicketController.getById);

export default router;
