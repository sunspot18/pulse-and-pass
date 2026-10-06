import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { ENV } from '../config/env.js';

const COOKIE_NAME = 'token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: ENV.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, token } = await AuthService.register(req.body);
      res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
      res.status(201).json({
        message: 'Account registered successfully',
        user,
        token,
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, token } = await AuthService.login(req.body);
      res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
      res.status(200).json({
        message: 'Signed in successfully',
        user,
        token,
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(_req: Request, res: Response) {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.status(200).json({ message: 'Signed out successfully' });
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'Not authenticated' });
        return;
      }
      const user = await AuthService.getUserById(req.user.userId);
      if (!user) {
        res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User account not found' });
        return;
      }
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  }
}
