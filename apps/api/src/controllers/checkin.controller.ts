import type { Request, Response, NextFunction } from 'express';
import { CheckinService } from '../services/checkin.service.js';

export class CheckinController {
  static async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const { qr_payload, event_id, device_info } = req.body;
      const result = await CheckinService.verifyAndCheckin(
        qr_payload,
        event_id,
        req.user!.userId,
        device_info,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getLog(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const data = await CheckinService.getEventCheckinLog(req.params.eventId as string, page, limit);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
}
