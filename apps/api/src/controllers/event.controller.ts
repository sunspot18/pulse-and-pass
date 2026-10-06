import type { Request, Response, NextFunction } from 'express';
import type { EventQueryInput } from '@pulsepass/shared';
import { EventService } from '../services/event.service.js';

export class EventController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await EventService.listEvents(req.query as unknown as EventQueryInput);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await EventService.getEventById(req.params.id as string);
      if (!event) {
        res.status(404).json({ error: 'EVENT_NOT_FOUND', message: 'Event not found' });
        return;
      }
      res.status(200).json({ event });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await EventService.createEvent(req.body, req.user!.userId);
      res.status(201).json({ message: 'Event published to lineup', event });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await EventService.updateEvent(
        req.params.id as string,
        req.body,
        req.user!.userId,
        req.user!.role === 'admin',
      );
      res.status(200).json({ message: 'Event dossier updated', event });
    } catch (err) {
      next(err);
    }
  }

  static async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await EventService.publishEvent(
        req.params.id as string,
        req.user!.userId,
        req.user!.role === 'admin',
      );
      res.status(200).json({ message: 'Event published live to ticket lineup', event });
    } catch (err) {
      next(err);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await EventService.cancelEvent(
        req.params.id as string,
        req.user!.userId,
        req.user!.role === 'admin',
      );
      res.status(200).json({ message: 'Event marked cancelled and tickets voided', event });
    } catch (err) {
      next(err);
    }
  }
}
