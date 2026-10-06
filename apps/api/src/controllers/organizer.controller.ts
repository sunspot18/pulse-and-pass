import type { Request, Response, NextFunction } from 'express';
import { OrganizerService } from '../services/organizer.service.js';

export class OrganizerController {
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await OrganizerService.getStats(req.user!.userId);
      res.status(200).json({ stats });
    } catch (err) {
      next(err);
    }
  }

  static async getAttendees(req: Request, res: Response, next: NextFunction) {
    try {
      const attendees = await OrganizerService.getEventAttendees(
        req.params.id as string,
        req.user!.userId,
        req.user!.role === 'admin',
      );
      res.status(200).json({ attendees, total: attendees.length });
    } catch (err) {
      next(err);
    }
  }

  static async exportAttendeesCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await OrganizerService.getEventAttendeesCsv(
        req.params.id as string,
        req.user!.userId,
        req.user!.role === 'admin',
      );
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="attendees-${req.params.id}.csv"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }

  static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await OrganizerService.getSalesMetrics(
        req.params.id as string,
        req.user!.userId,
        req.user!.role === 'admin',
      );
      res.status(200).json(metrics);
    } catch (err) {
      next(err);
    }
  }
}
