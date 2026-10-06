import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { z } from 'zod';
import { validate } from '../middlewares/validate.js';
import { ROLES } from '@pulsepass/shared';

const router = Router();

router.use(authenticate, requireRole('admin'));

const roleUpdateSchema = z.object({
  role: z.enum(ROLES),
});

router.get('/users', AdminController.listUsers);
router.patch('/users/:id/role', validate(roleUpdateSchema, 'body'), AdminController.updateUserRole);

export default router;
