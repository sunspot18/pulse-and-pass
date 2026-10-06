import { Router } from 'express';
import authRoutes from './auth.routes.js';
import eventRoutes from './event.routes.js';
import reservationRoutes from './reservation.routes.js';
import orderRoutes from './order.routes.js';
import ticketRoutes from './ticket.routes.js';
import checkinRoutes from './checkin.routes.js';
import organizerRoutes from './organizer.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/reservations', reservationRoutes);
router.use('/orders', orderRoutes);
router.use('/tickets', ticketRoutes);
router.use('/checkin', checkinRoutes);
router.use('/organizer', organizerRoutes);
router.use('/admin', adminRoutes);

export default router;
