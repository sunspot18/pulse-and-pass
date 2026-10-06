import crypto from 'crypto';
import { db } from '../config/db.js';
import { BookingService } from './booking.service.js';
import { TicketService } from './ticket.service.js';
import { AppError } from '../utils/errors.js';
import type { CheckoutInput, Order, OrderItem, Ticket } from '@pulsepass/shared';

interface ReservationWithEventDetails {
  id: string;
  user_id: string;
  tier_id: string;
  quantity: number;
  status: string;
  expires_at: string;
  event_id: string;
  price_paise: number;
  tier_name: string;
  event_title: string;
  event_start_time: string;
  venue_name: string;
  venue_city: string;
}

interface OrderSummaryRow extends Order {
  event_title: string;
  ticket_count: string;
}

interface TicketRow extends Ticket {
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string;
  unit_price_paise: number;
  tier_name: string;
}

export class OrderService {
  /**
   * Finalizes booking into an official order, marks hold completed, and issues signed QR tickets
   */
  static async checkout(userId: string, input: CheckoutInput): Promise<Order & { tickets: Ticket[] }> {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // 1. Verify reservation status and ownership
      const resSql = `
        SELECT r.id, r.user_id, r.tier_id, r.quantity, r.status, r.expires_at,
               t.event_id, t.price_paise, t.name as tier_name,
               e.title as event_title, e.start_time as event_start_time,
               v.name as venue_name, v.city as venue_city
        FROM reservations r
        JOIN ticket_tiers t ON r.tier_id = t.id
        JOIN events e ON t.event_id = e.id
        JOIN venues v ON e.venue_id = v.id
        WHERE r.id = $1 AND r.user_id = $2
        FOR UPDATE;
      `;
      const resResult = await client.query<ReservationWithEventDetails>(resSql, [input.reservation_id, userId]);

      if (resResult.rowCount === 0) {
        await client.query('ROLLBACK');
        throw new AppError('Reservation hold not found or does not belong to your account', 404, 'NOT_FOUND');
      }

      const reservation = resResult.rows[0]!;

      if (reservation.status !== 'active') {
        await client.query('ROLLBACK');
        throw new AppError(`Reservation is not active (current status: ${reservation.status})`, 400, 'INVALID_RESERVATION');
      }

      // Check if hold expired
      const isExpired = new Date(reservation.expires_at).getTime() < Date.now();
      if (isExpired) {
        await client.query('ROLLBACK');
        await BookingService.releaseHold(reservation.id, userId);
        throw new AppError(
          '5-minute reservation hold has expired. The tickets have been released back to general inventory.',
          410,
          'HOLD_EXPIRED',
        );
      }

      // 2. Validate attendee count matches held quantity
      if (input.attendees.length !== reservation.quantity) {
        await client.query('ROLLBACK');
        throw new AppError(
          `Attendee details count (${input.attendees.length}) must match the booked ticket quantity (${reservation.quantity})`,
          400,
          'ATTENDEE_COUNT_MISMATCH',
        );
      }

      // 3. Create Order
      const totalAmountPaise = reservation.price_paise * reservation.quantity;
      const orderYear = new Date().getFullYear();
      const randomRef = crypto.randomBytes(4).toString('hex').toUpperCase();
      const orderNumber = `PNP-${orderYear}-${randomRef}`;
      const paymentRef = `UPI-REF-${Date.now()}-${randomRef}`;

      const orderInsertSql = `
        INSERT INTO orders (order_number, user_id, event_id, reservation_id, total_amount_paise, status, payment_method, payment_ref)
        VALUES ($1, $2, $3, $4, $5, 'confirmed', $6, $7)
        RETURNING id, order_number, user_id, event_id, reservation_id, total_amount_paise, status, payment_method, payment_ref, created_at;
      `;
      const orderRes = await client.query<Order>(orderInsertSql, [
        orderNumber,
        userId,
        reservation.event_id,
        reservation.id,
        totalAmountPaise,
        input.payment_method || 'SIMULATED_UPI',
        paymentRef,
      ]);

      const order = orderRes.rows[0]!;

      // 4. Create Order Items & Issued Tickets
      const tickets: Ticket[] = [];

      for (const attendee of input.attendees) {
        // Insert order item
        const itemRes = await client.query<OrderItem>(
          `INSERT INTO order_items (order_id, tier_id, attendee_name, attendee_email, attendee_phone, unit_price_paise)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, order_id, tier_id, attendee_name, attendee_email, attendee_phone, unit_price_paise, created_at;`,
          [
            order.id,
            reservation.tier_id,
            attendee.name,
            attendee.email,
            attendee.phone,
            reservation.price_paise,
          ],
        );
        const orderItem = itemRes.rows[0]!;

        // Generate signed ticket
        const ticketId = crypto.randomUUID();
        const { ticketCode, securityHash, qrPayload } = TicketService.generateTicketCode(
          ticketId,
          reservation.event_id,
        );

        const ticketRes = await client.query<Ticket>(
          `INSERT INTO tickets (id, order_item_id, order_id, event_id, tier_id, ticket_code, security_hash, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'valid')
           RETURNING id, order_item_id, order_id, event_id, tier_id, ticket_code, security_hash, status, created_at;`,
          [
            ticketId,
            orderItem.id,
            order.id,
            reservation.event_id,
            reservation.tier_id,
            ticketCode,
            securityHash,
          ],
        );

        const ticket = ticketRes.rows[0]!;
        const qrDataUrl = await TicketService.generateQrDataUrl(qrPayload);

        tickets.push({
          ...ticket,
          attendee_name: attendee.name,
          attendee_email: attendee.email,
          attendee_phone: attendee.phone,
          event_title: reservation.event_title,
          event_start_time: reservation.event_start_time,
          venue_name: reservation.venue_name,
          venue_city: reservation.venue_city,
          tier_name: reservation.tier_name,
          unit_price_paise: reservation.price_paise,
          qr_code_data_url: qrDataUrl,
        });
      }

      // 5. Mark reservation status = 'completed'
      await client.query("UPDATE reservations SET status = 'completed' WHERE id = $1;", [
        reservation.id,
      ]);

      await client.query('COMMIT');

      return {
        ...order,
        event_title: reservation.event_title,
        tickets,
      };
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Ignored
      }
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Retrieves orders for an authenticated attendee
   */
  static async listUserOrders(userId: string): Promise<Order[]> {
    const res = await db.query<OrderSummaryRow>(
      `SELECT o.id, o.order_number, o.user_id, o.event_id, o.reservation_id, o.total_amount_paise,
              o.status, o.payment_method, o.payment_ref, o.created_at,
              e.title as event_title, COUNT(t.id) as ticket_count
       FROM orders o
       JOIN events e ON o.event_id = e.id
       LEFT JOIN tickets t ON o.id = t.order_id
       WHERE o.user_id = $1
       GROUP BY o.id, e.title
       ORDER BY o.created_at DESC;`,
      [userId],
    );
    return res.rows;
  }

  /**
   * Retrieves full order details with tickets
   */
  static async getOrderById(orderId: string, userId?: string): Promise<Order | null> {
    const orderRes = await db.query<Order & { event_start_time: string; venue_name: string; venue_city: string }>(
      `SELECT o.id, o.order_number, o.user_id, o.event_id, o.reservation_id, o.total_amount_paise,
              o.status, o.payment_method, o.payment_ref, o.created_at,
              e.title as event_title, e.start_time as event_start_time,
              v.name as venue_name, v.city as venue_city
       FROM orders o
       JOIN events e ON o.event_id = e.id
       JOIN venues v ON e.venue_id = v.id
       WHERE o.id = $1 ${userId ? 'AND o.user_id = $2' : ''};`,
      userId ? [orderId, userId] : [orderId],
    );

    if (orderRes.rowCount === 0) return null;
    const order = orderRes.rows[0]!;

    // Fetch items & tickets
    const ticketsRes = await db.query<TicketRow>(
      `SELECT t.id, t.ticket_code, t.security_hash, t.status, t.used_at, t.created_at,
              oi.attendee_name, oi.attendee_email, oi.attendee_phone, oi.unit_price_paise,
              tt.name as tier_name
       FROM tickets t
       JOIN order_items oi ON t.order_item_id = oi.id
       JOIN ticket_tiers tt ON t.tier_id = tt.id
       WHERE t.order_id = $1
       ORDER BY t.created_at ASC;`,
      [orderId],
    );

    const tickets: Ticket[] = [];
    for (const row of ticketsRes.rows) {
      const qrPayload = JSON.stringify({
        v: 1,
        tid: row.id,
        eid: order.event_id,
        code: row.ticket_code,
        sig: row.security_hash,
      });
      const qrDataUrl = await TicketService.generateQrDataUrl(qrPayload);

      tickets.push({
        ...row,
        event_title: order.event_title,
        event_start_time: order.event_start_time,
        venue_name: order.venue_name,
        venue_city: order.venue_city,
        qr_code_data_url: qrDataUrl,
      });
    }

    return {
      ...order,
      tickets,
    };
  }
}
