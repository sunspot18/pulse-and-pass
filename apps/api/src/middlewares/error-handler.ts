import type { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env.js';
import { AppError } from '../utils/errors.js';

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const errorCode = err instanceof AppError ? err.code : 'INTERNAL_SERVER_ERROR';

  if (statusCode === 500 && ENV.NODE_ENV !== 'test') {
    console.error('🔥 Server Error:', err);
  }

  res.status(statusCode).json({
    error: errorCode,
    message: err.message || 'An unexpected internal server error occurred',
    ...(ENV.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
