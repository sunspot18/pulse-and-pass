import type { Request, Response, NextFunction } from 'express';
import { db } from '../config/db.js';
import { TicketService } from '../services/ticket.service.js';
import type { Ticket } from '@pulsepass/shared';

interface TicketRow {
  id: string;
  order_item_id: string;
  order_id: string;
  event_id: string;
  tier_id: string;
  ticket_code: string;
  security_hash: string;
  status: Ticket['status'];
  used_at: string | null;
  created_at: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string | null;
  unit_price_paise: number;
  tier_name: string;
  event_title: string;
  event_start_time: string;
  event_end_time?: string;
  doors_open_time?: string | null;
  banner_url?: string | null;
  venue_name: string;
  venue_address?: string;
  venue_city: string;
}

export class TicketController {
  /**
   * Retrieves active and past tickets for attendee wallet
   */
  static async getWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticketsSql = `
        SELECT t.id, t.ticket_code, t.security_hash, t.status, t.used_at, t.created_at,
               oi.attendee_name, oi.attendee_email, oi.attendee_phone, oi.unit_price_paise,
               tt.name as tier_name,
               e.id as event_id, e.title as event_title, e.start_time as event_start_time,
               e.end_time as event_end_time, e.doors_open_time, e.banner_url,
               v.name as venue_name, v.address as venue_address, v.city as venue_city
        FROM tickets t
        JOIN order_items oi ON t.order_item_id = oi.id
        JOIN orders o ON t.order_id = o.id
        JOIN ticket_tiers tt ON t.tier_id = tt.id
        JOIN events e ON t.event_id = e.id
        JOIN venues v ON e.venue_id = v.id
        WHERE o.user_id = $1
        ORDER BY e.start_time ASC;
      `;
      const resData = await db.query<TicketRow>(ticketsSql, [req.user!.userId]);

      const active: Ticket[] = [];
      const past: Ticket[] = [];
      const now = new Date();

      for (const row of resData.rows) {
        const qrPayload = JSON.stringify({
          v: 1,
          tid: row.id,
          eid: row.event_id,
          code: row.ticket_code,
          sig: row.security_hash,
        });
        const qrDataUrl = await TicketService.generateQrDataUrl(qrPayload);

        const ticket: Ticket = {
          id: row.id,
          order_item_id: row.order_item_id,
          order_id: row.order_id,
          event_id: row.event_id,
          tier_id: row.tier_id,
          ticket_code: row.ticket_code,
          security_hash: row.security_hash,
          status: row.status,
          used_at: row.used_at,
          created_at: row.created_at,
          attendee_name: row.attendee_name,
          attendee_email: row.attendee_email,
          attendee_phone: row.attendee_phone,
          unit_price_paise: row.unit_price_paise,
          tier_name: row.tier_name,
          event_title: row.event_title,
          event_start_time: row.event_start_time,
          venue_name: row.venue_name,
          venue_city: row.venue_city,
          qr_code_data_url: qrDataUrl,
        };

        const isPast = new Date(row.event_end_time || row.event_start_time) < now || row.status === 'used';
        if (isPast) {
          past.push(ticket);
        } else {
          active.push(ticket);
        }
      }

      res.status(200).json({ active, past, total: active.length + past.length });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticketSql = `
        SELECT t.id, t.ticket_code, t.security_hash, t.status, t.used_at, t.created_at,
               oi.attendee_name, oi.attendee_email, oi.attendee_phone, oi.unit_price_paise,
               tt.name as tier_name,
               e.id as event_id, e.title as event_title, e.start_time as event_start_time,
               v.name as venue_name, v.city as venue_city
        FROM tickets t
        JOIN order_items oi ON t.order_item_id = oi.id
        JOIN orders o ON t.order_id = o.id
        JOIN ticket_tiers tt ON t.tier_id = tt.id
        JOIN events e ON t.event_id = e.id
        JOIN venues v ON e.venue_id = v.id
        WHERE t.id = $1 AND (o.user_id = $2 OR $3 = 'admin' OR e.organizer_id = $2);
      `;
      const resData = await db.query<TicketRow>(ticketSql, [
        req.params.id as string,
        req.user!.userId,
        req.user!.role,
      ]);

      if (resData.rowCount === 0 || !resData.rows[0]) {
        res.status(404).json({ error: 'TICKET_NOT_FOUND', message: 'Ticket not found' });
        return;
      }

      const row = resData.rows[0];
      const qrPayload = JSON.stringify({
        v: 1,
        tid: row.id,
        eid: row.event_id,
        code: row.ticket_code,
        sig: row.security_hash,
      });
      const qrDataUrl = await TicketService.generateQrDataUrl(qrPayload);

      res.status(200).json({
        ticket: {
          ...row,
          qr_code_data_url: qrDataUrl,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
