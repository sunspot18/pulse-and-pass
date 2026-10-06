import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { checkoutSchema } from '@pulsepass/shared';

const router = Router();

router.post('/checkout', authenticate, validate(checkoutSchema, 'body'), OrderController.checkout);
router.get('/', authenticate, OrderController.list);
router.get('/:id', authenticate, OrderController.getById);

export default router;
