import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import type { Role } from '@pulsepass/shared';

// Augment Express Request interface with authenticated user payload
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: Role;
        name: string;
      };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.substring(7)
      : null) ||
    (typeof req.query.token === 'string' ? req.query.token : null);

  if (!token) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication required. No valid session token found.',
    });
    return;
  }

  try {
    const payload = AuthService.verifyToken(token);
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role as Role,
      name: payload.name,
    };
    next();
  } catch {
    res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Session token has expired or is invalid. Please sign in again.',
    });
    return;
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.substring(7)
      : null);

  if (token) {
    try {
      const payload = AuthService.verifyToken(token);
      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role as Role,
        name: payload.name,
      };
    } catch {
      // Ignored for optional auth
    }
  }
  next();
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: `Insufficient privileges. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}.`,
      });
      return;
    }

    next();
  };
}
