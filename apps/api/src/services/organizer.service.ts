import { db } from '../config/db.js';
import { AppError } from '../utils/errors.js';

interface StatsRow {
  total_events: string | number;
  total_tickets_sold: string | number;
  total_capacity: string | number;
  total_revenue_paise: string | number;
}

interface CheckinCountRow {
  total_checkins: string | number;
}

interface EventCheckRow {
  organizer_id: string;
  title: string;
}

interface AttendeeRow {
  ticket_id: string;
  ticket_code: string;
  ticket_status: string;
  used_at: string | null;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  unit_price_paise: number;
  tier_name: string;
  order_number: string;
  purchase_time: string;
}

interface SalesMetricRow {
  sale_date: string;
  tickets_sold: string | number;
  revenue_paise: string | number;
}

export class OrganizerService {
  /**
   * Retrieves high-level box office analytics for an organizer
   */
  static async getStats(organizerId: string) {
    const statsSql = `
      SELECT 
        COUNT(DISTINCT e.id) as total_events,
        COALESCE(SUM(t.sold), 0) as total_tickets_sold,
        COALESCE(SUM(t.capacity), 0) as total_capacity,
        COALESCE(SUM(t.sold * t.price_paise), 0) as total_revenue_paise
      FROM events e
      LEFT JOIN ticket_tiers t ON e.id = t.event_id
      WHERE e.organizer_id = $1;
    `;
    const res = await db.query<StatsRow>(statsSql, [organizerId]);
    const row = res.rows[0];

    const checkinsRes = await db.query<CheckinCountRow>(
      `SELECT COUNT(c.id) as total_checkins
       FROM checkins c
       JOIN events e ON c.event_id = e.id
       WHERE e.organizer_id = $1 AND c.status = 'SUCCESS';`,
      [organizerId],
    );

    const totalSold = Number(row?.total_tickets_sold || 0);
    const totalCheckins = Number(checkinsRes.rows[0]?.total_checkins || 0);
    const checkinRate = totalSold > 0 ? Math.round((totalCheckins / totalSold) * 100) : 0;

    return {
      total_events: Number(row?.total_events || 0),
      total_tickets_sold: totalSold,
      total_capacity: Number(row?.total_capacity || 0),
      total_revenue_paise: Number(row?.total_revenue_paise || 0),
      total_admissions: totalCheckins,
      admission_rate_pct: checkinRate,
    };
  }

  /**
   * Retrieves the attendee roster for a specific event
   */
  static async getEventAttendees(eventId: string, organizerId: string, isAdmin = false): Promise<AttendeeRow[]> {
    const evCheck = await db.query<EventCheckRow>('SELECT organizer_id, title FROM events WHERE id = $1;', [eventId]);
    const eventRow = evCheck.rows[0];
    if (!eventRow) {
      throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    }
    if (!isAdmin && eventRow.organizer_id !== organizerId) {
      throw new AppError('You do not have access to this event roster', 403, 'FORBIDDEN');
    }

    const attendeesSql = `
      SELECT t.id as ticket_id, t.ticket_code, t.status as ticket_status, t.used_at,
             oi.attendee_name, oi.attendee_email, oi.attendee_phone, oi.unit_price_paise,
             tt.name as tier_name, o.order_number, o.created_at as purchase_time
      FROM tickets t
      JOIN order_items oi ON t.order_item_id = oi.id
      JOIN orders o ON t.order_id = o.id
      JOIN ticket_tiers tt ON t.tier_id = tt.id
      WHERE t.event_id = $1
      ORDER BY oi.attendee_name ASC;
    `;
    const res = await db.query<AttendeeRow>(attendeesSql, [eventId]);
    return res.rows;
  }

  /**
   * Generates CSV string of attendee roster
   */
  static async getEventAttendeesCsv(eventId: string, organizerId: string, isAdmin = false): Promise<string> {
    const attendees = await this.getEventAttendees(eventId, organizerId, isAdmin);

    const headers = [
      'Ticket Code',
      'Attendee Name',
      'Attendee Email',
      'Attendee Phone',
      'Ticket Tier',
      'Price (INR)',
      'Status',
      'Admitted At',
      'Order Number',
      'Purchase Time',
    ];

    const rows = attendees.map((a: AttendeeRow) => [
      `"${a.ticket_code}"`,
      `"${a.attendee_name.replace(/"/g, '""')}"`,
      `"${a.attendee_email}"`,
      `"${a.attendee_phone || ''}"`,
      `"${a.tier_name}"`,
      (a.unit_price_paise / 100).toFixed(2),
      a.ticket_status.toUpperCase(),
      a.used_at ? new Date(a.used_at).toISOString() : 'NOT_CHECKED_IN',
      `"${a.order_number}"`,
      new Date(a.purchase_time).toISOString(),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Aggregates sales metrics timeline for SVG charts
   */
  static async getSalesMetrics(eventId: string, organizerId: string, isAdmin = false) {
    const evCheck = await db.query<EventCheckRow>('SELECT organizer_id, title FROM events WHERE id = $1;', [eventId]);
    const eventRow = evCheck.rows[0];
    if (!eventRow) {
      throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    }
    if (!isAdmin && eventRow.organizer_id !== organizerId) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    // Daily breakdown of orders and revenue
    const metricsSql = `
      SELECT 
        DATE(o.created_at) as sale_date,
        COUNT(t.id) as tickets_sold,
        SUM(oi.unit_price_paise) as revenue_paise
      FROM orders o
      JOIN tickets t ON o.id = t.order_id
      JOIN order_items oi ON t.order_item_id = oi.id
      WHERE o.event_id = $1 AND o.status = 'confirmed'
      GROUP BY DATE(o.created_at)
      ORDER BY sale_date ASC;
    `;
    const res = await db.query<SalesMetricRow>(metricsSql, [eventId]);
    return {
      event_id: eventId,
      event_title: eventRow.title,
      timeline: res.rows.map((r: SalesMetricRow) => ({
        date: r.sale_date,
        tickets_sold: Number(r.tickets_sold),
        revenue_paise: Number(r.revenue_paise),
        revenue_inr: Number(r.revenue_paise) / 100,
      })),
    };
  }
}
