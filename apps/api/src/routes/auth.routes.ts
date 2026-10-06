import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, registerSchema } from '@pulsepass/shared';

const router = Router();

router.post('/register', validate(registerSchema, 'body'), AuthController.register);
router.post('/login', validate(loginSchema, 'body'), AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.me);

export default router;
