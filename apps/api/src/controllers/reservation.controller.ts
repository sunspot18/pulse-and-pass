import type { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service.js';

export class ReservationController {
  static async createHold(req: Request, res: Response, next: NextFunction) {
    try {
      const reservation = await BookingService.createHold(
        req.user!.userId,
        req.body.tier_id,
        req.body.quantity,
      );
      res.status(201).json({
        message: '5-minute reservation hold allocated successfully',
        reservation,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const reservation = await BookingService.getReservation(
        req.params.id as string,
        req.user!.userId,
      );
      res.status(200).json({ reservation });
    } catch (err) {
      next(err);
    }
  }

  static async release(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const released = await BookingService.releaseHold(
        req.params.id as string,
        req.user!.userId,
      );
      if (!released) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Active hold not found' });
        return;
      }
      res.status(200).json({ message: 'Reservation hold released back to inventory' });
    } catch (err) {
      next(err);
    }
  }
}
