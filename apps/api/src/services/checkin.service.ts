import { db } from '../config/db.js';
import { TicketService } from './ticket.service.js';
import type { CheckinRecord, CheckinStatus } from '@pulsepass/shared';

export interface VerifyCheckinResult {
  status: CheckinStatus;
  message: string;
  ticket?: {
    id: string;
    ticket_code: string;
    status: string;
    attendee_name: string;
    attendee_email: string;
    tier_name: string;
    event_title: string;
    used_at?: string | null;
  };
  checkin_timestamp: string;
}

interface CheckinTicketRow {
  id: string;
  ticket_code: string;
  event_id: string;
  status: string;
  used_at: string | null;
  attendee_name: string;
  attendee_email: string;
  tier_name: string;
  event_title: string;
}

export class CheckinService {
  /**
   * Scans and validates a ticket at the admission gate turnstile
   */
  static async verifyAndCheckin(
    qrPayload: string,
    eventId: string,
    scannedByUserId: string,
    deviceInfo?: string,
  ): Promise<VerifyCheckinResult> {
    const timestamp = new Date().toISOString();

    // 1. Verify HMAC cryptographic signature
    const verification = TicketService.verifyPayload(qrPayload);
    if (!verification.isValid || !verification.ticketId) {
      await this.recordScan(
        null,
        eventId,
        scannedByUserId,
        'INVALID',
        deviceInfo,
        `Cryptographic HMAC signature invalid: ${verification.reason}`,
      );

      return {
        status: 'INVALID',
        message: 'Admission pass signature could not be verified. Possible counterfeit or corrupted code.',
        checkin_timestamp: timestamp,
      };
    }

    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // 2. Fetch ticket with lock
      const ticketRes = await client.query<CheckinTicketRow>(
        `SELECT t.id, t.ticket_code, t.event_id, t.status, t.used_at,
                oi.attendee_name, oi.attendee_email,
                tt.name as tier_name, e.title as event_title
         FROM tickets t
         JOIN order_items oi ON t.order_item_id = oi.id
         JOIN ticket_tiers tt ON t.tier_id = tt.id
         JOIN events e ON t.event_id = e.id
         WHERE t.id = $1
         FOR UPDATE;`,
        [verification.ticketId],
      );

      if (ticketRes.rowCount === 0) {
        await client.query('ROLLBACK');
        await this.recordScan(null, eventId, scannedByUserId, 'INVALID', deviceInfo, 'Ticket ID not in database');
        return {
          status: 'INVALID',
          message: 'No ticket found matching the scanned identifier.',
          checkin_timestamp: timestamp,
        };
      }

      const ticket = ticketRes.rows[0];
      if (!ticket) {
        await client.query('ROLLBACK');
        await this.recordScan(null, eventId, scannedByUserId, 'INVALID', deviceInfo, 'Ticket ID not in database');
        return {
          status: 'INVALID',
          message: 'No ticket found matching the scanned identifier.',
          checkin_timestamp: timestamp,
        };
      }

      const formattedTicket = {
        id: ticket.id,
        ticket_code: ticket.ticket_code,
        status: ticket.status,
        attendee_name: ticket.attendee_name,
        attendee_email: ticket.attendee_email,
        tier_name: ticket.tier_name,
        event_title: ticket.event_title,
        used_at: ticket.used_at,
      };

      // 3. Verify event match
      if (ticket.event_id !== eventId) {
        await client.query('ROLLBACK');
        await this.recordScan(
          ticket.id,
          eventId,
          scannedByUserId,
          'WRONG_EVENT',
          deviceInfo,
          `Ticket belongs to event ${ticket.event_id}, not current event ${eventId}`,
        );
        return {
          status: 'WRONG_EVENT',
          message: `Ticket is for a different event: "${ticket.event_title}". Not valid for this gate.`,
          ticket: formattedTicket,
          checkin_timestamp: timestamp,
        };
      }

      // 4. Verify status: Already used
      if (ticket.status === 'used') {
        await client.query('ROLLBACK');
        await this.recordScan(
          ticket.id,
          eventId,
          scannedByUserId,
          'ALREADY_USED',
          deviceInfo,
          `Ticket was already admitted at ${ticket.used_at || 'unknown time'}`,
        );
        const admittedAt = ticket.used_at ? new Date(ticket.used_at).toLocaleTimeString('en-IN') : 'earlier';
        return {
          status: 'ALREADY_USED',
          message: `Pass already admitted at ${admittedAt}. One-time entry only.`,
          ticket: formattedTicket,
          checkin_timestamp: timestamp,
        };
      }

      // 5. Verify status: Void
      if (ticket.status === 'void') {
        await client.query('ROLLBACK');
        await this.recordScan(ticket.id, eventId, scannedByUserId, 'INVALID', deviceInfo, 'Ticket status is VOID');
        return {
          status: 'INVALID',
          message: 'Admission pass has been marked VOID / CANCELLED.',
          ticket: formattedTicket,
          checkin_timestamp: timestamp,
        };
      }

      // 6. Valid pass: Mark ticket as used and record successful entry
      const updateRes = await client.query<{ used_at: string }>(
        "UPDATE tickets SET status = 'used', used_at = NOW() WHERE id = $1 AND status = 'valid' RETURNING used_at;",
        [ticket.id],
      );

      const usedAt = updateRes.rows[0]?.used_at ? String(updateRes.rows[0].used_at) : timestamp;

      await client.query(
        `INSERT INTO checkins (ticket_id, event_id, scanned_by, status, scan_timestamp, device_info, notes)
         VALUES ($1, $2, $3, 'SUCCESS', NOW(), $4, $5);`,
        [ticket.id, eventId, scannedByUserId, deviceInfo || 'Gate Scanner', 'Admitted successfully'],
      );

      await client.query('COMMIT');

      return {
        status: 'SUCCESS',
        message: 'ADMISSION GRANTED. Admit one attendee.',
        ticket: {
          ...formattedTicket,
          status: 'used',
          used_at: usedAt,
        },
        checkin_timestamp: timestamp,
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

  private static async recordScan(
    ticketId: string | null,
    eventId: string,
    scannedBy: string,
    status: CheckinStatus,
    deviceInfo?: string,
    notes?: string,
  ) {
    if (!ticketId) return;
    try {
      const evCheck = await db.query('SELECT 1 FROM events WHERE id = $1;', [eventId]);
      if (evCheck.rowCount === 0) return;

      await db.query(
        `INSERT INTO checkins (ticket_id, event_id, scanned_by, status, scan_timestamp, device_info, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5, $6);`,
        [ticketId, eventId, scannedBy, status, deviceInfo || 'Gate Scanner', notes || ''],
      );
    } catch {
      // Non-fatal scan audit failure
    }
  }

  /**
   * Retrieves scan log for an event
   */
  static async getEventCheckinLog(eventId: string, page = 1, limit = 50): Promise<{ checkins: CheckinRecord[]; total: number }> {
    const offset = (page - 1) * limit;

    const countRes = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM checkins WHERE event_id = $1;',
      [eventId],
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const logRes = await db.query<CheckinRecord>(
      `SELECT c.id, c.ticket_id, c.event_id, c.scanned_by, c.status, c.scan_timestamp, c.device_info, c.notes,
              oi.attendee_name, tt.name as tier_name, u.name as scanner_name
       FROM checkins c
       LEFT JOIN tickets t ON c.ticket_id = t.id
       LEFT JOIN order_items oi ON t.order_item_id = oi.id
       LEFT JOIN ticket_tiers tt ON t.tier_id = tt.id
       LEFT JOIN users u ON c.scanned_by = u.id
       WHERE c.event_id = $1
       ORDER BY c.scan_timestamp DESC
       LIMIT $2 OFFSET $3;`,
      [eventId, limit, offset],
    );

    return {
      checkins: logRes.rows,
      total,
    };
  }
}
