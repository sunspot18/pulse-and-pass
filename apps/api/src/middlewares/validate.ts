import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';

type RequestLocation = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, location: RequestLocation = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dataToValidate = req[location];
    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const err = result.error as ZodError;
      const issues = err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Request payload failed validation requirements',
        location,
        issues,
      });
      return;
    }

    // Replace with validated & parsed data
    Object.assign(req[location], result.data);
    next();
  };
}
