import type { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service.js';
import type { Role } from '@pulsepass/shared';

export class AdminController {
  static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.query.role as Role | undefined;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const data = await AdminService.listUsers(role, page, limit);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  static async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.body;
      const user = await AdminService.updateUserRole(req.params.id as string, role);
      res.status(200).json({ message: 'User role updated successfully', user });
    } catch (err) {
      next(err);
    }
  }
}
