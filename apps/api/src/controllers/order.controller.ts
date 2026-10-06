import type { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service.js';

export class OrderController {
  static async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await OrderService.checkout(req.user!.userId, req.body);
      res.status(201).json({
        message: 'Order confirmed and digital passes issued',
        order,
      });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await OrderService.listUserOrders(req.user!.userId);
      res.status(200).json({ orders });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await OrderService.getOrderById(req.params.id as string, req.user!.userId);
      if (!order) {
        res.status(404).json({ error: 'ORDER_NOT_FOUND', message: 'Order not found' });
        return;
      }
      res.status(200).json({ order });
    } catch (err) {
      next(err);
    }
  }
}
