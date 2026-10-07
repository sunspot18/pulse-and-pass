import crypto from 'crypto';
import { db } from '../config/db.js';
import type {
  CreateEventInput,
  Event,
  EventDetail,
  EventQueryInput,
  EventStatus,
  TicketTier,
  TicketTierWithAvailability,
  UpdateEventInput,
  Venue,
} from '@pulsepass/shared';
import { AppError } from '../utils/errors.js';

interface EventListRow {
  id: string;
  organizer_id: string;
  venue_id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: EventStatus;
  start_time: string;
  end_time: string;
  doors_open_time: string | null;
  age_restriction: string | null;
  banner_url: string | null;
  is_featured?: boolean | null;
  created_at: string;
  updated_at: string;
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_state: string;
  venue_postal_code: string;
  venue_capacity: number;
  organizer_name: string | null;
  min_price_paise: string | number;
  max_price_paise: string | number;
  is_sold_out: boolean | null;
}

interface EventDetailRow {
  id: string;
  organizer_id: string;
  venue_id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: EventStatus;
  start_time: string;
  end_time: string;
  doors_open_time: string | null;
  age_restriction: string | null;
  banner_url: string | null;
  is_featured?: boolean | null;
  created_at: string;
  updated_at: string;
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_state: string;
  venue_postal_code: string;
  venue_capacity: number;
  organizer_name: string | null;
}

let featuredColumnChecked = false;
async function ensureFeaturedColumn() {
  if (featuredColumnChecked) return;
  try {
    await db.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;`);
    featuredColumnChecked = true;
  } catch {
    // Graceful fallback
  }
}

export class EventService {
  /**
   * Retrieves events matching lineup filter criteria
   */
  static async listEvents(
    query: EventQueryInput,
  ): Promise<{ events: EventDetail[]; total: number; page: number; limit: number; totalPages: number }> {
    await ensureFeaturedColumn();
    const conditions: string[] = [];
    const params: unknown[] = [];
    let pIdx = 1;

    // Default status: published (unless explicitly filtered)
    if (query.status) {
      conditions.push(`e.status = $${pIdx++}`);
      params.push(query.status);
    } else {
      conditions.push(`e.status IN ('published', 'completed')`);
    }

    if (query.search) {
      conditions.push(`(e.title ILIKE $${pIdx} OR e.description ILIKE $${pIdx})`);
      params.push(`%${query.search}%`);
      pIdx++;
    }

    if (query.city) {
      conditions.push(`v.city ILIKE $${pIdx++}`);
      params.push(query.city);
    }

    if (query.category) {
      conditions.push(`e.category = $${pIdx++}`);
      params.push(query.category);
    }

    if (query.date_from) {
      conditions.push(`e.start_time >= $${pIdx++}`);
      params.push(query.date_from);
    }

    if (query.date_to) {
      conditions.push(`e.start_time <= $${pIdx++}`);
      params.push(query.date_to);
    }

    if (query.is_featured !== undefined) {
      conditions.push(`e.is_featured = $${pIdx++}`);
      params.push(query.is_featured);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count
    const countSql = `
      SELECT COUNT(DISTINCT e.id) as count
      FROM events e
      JOIN venues v ON e.venue_id = v.id
      ${whereClause};
    `;
    const countRes = await db.query<{ count: string }>(countSql, params);
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const limit = query.limit || 12;
    const page = query.page || 1;
    const offset = (page - 1) * limit;

    // Fetch paginated events with venue info and price ranges
    const eventsSql = `
      SELECT e.id, e.organizer_id, e.venue_id, e.title, e.slug, e.description, e.category,
             e.status, e.start_time, e.end_time, e.doors_open_time, e.age_restriction, e.banner_url,
             COALESCE(e.is_featured, false) as is_featured,
             e.created_at, e.updated_at,
             v.name as venue_name, v.address as venue_address, v.city as venue_city,
             v.state as venue_state, v.postal_code as venue_postal_code, v.capacity as venue_capacity,
             u.name as organizer_name,
             COALESCE(MIN(t.price_paise), 0) as min_price_paise,
             COALESCE(MAX(t.price_paise), 0) as max_price_paise,
             BOOL_AND(t.sold >= t.capacity) as is_sold_out
      FROM events e
      JOIN venues v ON e.venue_id = v.id
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN ticket_tiers t ON e.id = t.event_id
      ${whereClause}
      GROUP BY e.id, v.id, u.name
      ORDER BY e.is_featured DESC, e.start_time ASC
      LIMIT $${pIdx++} OFFSET $${pIdx++};
    `;

    const eventsRes = await db.query<EventListRow>(eventsSql, [...params, limit, offset]);

    const events: EventDetail[] = eventsRes.rows.map((row) => ({
      id: row.id,
      organizer_id: row.organizer_id,
      venue_id: row.venue_id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      category: row.category,
      status: row.status,
      start_time: row.start_time,
      end_time: row.end_time,
      doors_open_time: row.doors_open_time,
      age_restriction: row.age_restriction,
      banner_url: row.banner_url,
      is_featured: Boolean(row.is_featured),
      created_at: row.created_at,
      updated_at: row.updated_at,
      organizer_name: row.organizer_name,
      min_price_paise: Number(row.min_price_paise),
      max_price_paise: Number(row.max_price_paise),
      is_sold_out: Boolean(row.is_sold_out),
      venue: {
        id: row.venue_id,
        name: row.venue_name,
        address: row.venue_address,
        city: row.venue_city,
        state: row.venue_state,
        postal_code: row.venue_postal_code,
        capacity: row.venue_capacity,
        created_at: row.created_at,
      },
      tiers: [] as TicketTierWithAvailability[],
    }));

    return {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves single event with venue and live ticket tiers availability
   */
  static async getEventById(id: string): Promise<EventDetail | null> {
    await ensureFeaturedColumn();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const eventSql = `
      SELECT e.id, e.organizer_id, e.venue_id, e.title, e.slug, e.description, e.category,
             e.status, e.start_time, e.end_time, e.doors_open_time, e.age_restriction, e.banner_url,
             COALESCE(e.is_featured, false) as is_featured,
             e.created_at, e.updated_at,
             v.name as venue_name, v.address as venue_address, v.city as venue_city,
             v.state as venue_state, v.postal_code as venue_postal_code, v.capacity as venue_capacity,
             u.name as organizer_name
      FROM events e
      JOIN venues v ON e.venue_id = v.id
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE ${isUuid ? 'e.id = $1' : 'e.slug = $1'};
    `;
    const eventRes = await db.query<EventDetailRow>(eventSql, [id]);
    const row = eventRes.rows[0];
    if (!row) return null;

    // Fetch live tiers with remaining available inventory
    const tiersSql = `
      SELECT id, event_id, name, description, price_paise, capacity, sold,
             sales_start, sales_end, created_at, updated_at,
             GREATEST(0, capacity - sold) as available,
             (sold >= capacity) as is_sold_out
      FROM ticket_tiers
      WHERE event_id = $1
      ORDER BY price_paise ASC;
    `;
    const tiersRes = await db.query<TicketTierWithAvailability>(tiersSql, [row.id]);

    const tiers = tiersRes.rows.map((t) => ({
      ...t,
      available: Number(t.available),
      is_sold_out: Boolean(t.is_sold_out),
    }));

    const isSoldOut = tiers.length > 0 && tiers.every((t) => t.is_sold_out);

    return {
      id: row.id,
      organizer_id: row.organizer_id,
      venue_id: row.venue_id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      category: row.category,
      status: row.status,
      start_time: row.start_time,
      end_time: row.end_time,
      doors_open_time: row.doors_open_time,
      age_restriction: row.age_restriction,
      banner_url: row.banner_url,
      is_featured: Boolean(row.is_featured),
      created_at: row.created_at,
      updated_at: row.updated_at,
      organizer_name: row.organizer_name,
      is_sold_out: isSoldOut,
      venue: {
        id: row.venue_id,
        name: row.venue_name,
        address: row.venue_address,
        city: row.venue_city,
        state: row.venue_state,
        postal_code: row.venue_postal_code,
        capacity: row.venue_capacity,
        created_at: row.created_at,
      },
      tiers,
    };
  }

  /**
   * Creates event with venue and tiers in a transaction
   */
  static async createEvent(input: CreateEventInput, organizerId: string): Promise<EventDetail> {
    await ensureFeaturedColumn();
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // 1. Resolve venue
      let venueId = input.venue_id;
      if (!venueId && input.venue) {
        const vRes = await client.query<Venue>(
          `INSERT INTO venues (name, address, city, state, postal_code, capacity)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, name, address, city, state, postal_code, capacity, created_at;`,
          [
            input.venue.name,
            input.venue.address,
            input.venue.city,
            input.venue.state,
            input.venue.postal_code,
            input.venue.capacity,
          ],
        );
        venueId = vRes.rows[0]!.id;
      }

      if (!venueId) {
        await client.query('ROLLBACK');
        throw new AppError('Venue information is required', 400, 'BAD_REQUEST');
      }

      // Generate unique slug
      const baseSlug = input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const uniqueSuffix = crypto.randomBytes(3).toString('hex');
      const slug = `${baseSlug}-${uniqueSuffix}`;

      // 2. Insert event
      const evRes = await client.query<Event>(
        `INSERT INTO events (organizer_id, venue_id, title, slug, description, category, status, start_time, end_time, doors_open_time, age_restriction, banner_url, is_featured)
         VALUES ($1, $2, $3, $4, $5, $6, 'published', $7, $8, $9, $10, $11, $12)
         RETURNING id, organizer_id, venue_id, title, slug, description, category, status, start_time, end_time, doors_open_time, age_restriction, banner_url, is_featured, created_at, updated_at;`,
        [
          organizerId,
          venueId,
          input.title,
          slug,
          input.description,
          input.category,
          input.start_time,
          input.end_time,
          input.doors_open_time || null,
          input.age_restriction || 'All Ages',
          input.banner_url || null,
          Boolean(input.is_featured),
        ],
      );

      const event = evRes.rows[0]!;

      // 3. Insert ticket tiers
      const tiers: TicketTierWithAvailability[] = [];
      for (const tier of input.tiers) {
        const tRes = await client.query<TicketTier>(
          `INSERT INTO ticket_tiers (event_id, name, description, price_paise, capacity, sold, sales_start, sales_end)
           VALUES ($1, $2, $3, $4, $5, 0, $6, $7)
           RETURNING id, event_id, name, description, price_paise, capacity, sold, sales_start, sales_end, created_at, updated_at;`,
          [
            event.id,
            tier.name,
            tier.description || null,
            tier.price_paise,
            tier.capacity,
            tier.sales_start,
            tier.sales_end,
          ],
        );
        const t = tRes.rows[0]!;
        tiers.push({
          ...t,
          available: t.capacity,
          is_sold_out: false,
        });
      }

      await client.query('COMMIT');

      const fullEvent = await this.getEventById(event.id);
      return fullEvent!;
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
   * Updates event metadata
   */
  static async updateEvent(
    id: string,
    input: UpdateEventInput,
    organizerId: string,
    isAdmin = false,
  ): Promise<EventDetail> {
    await ensureFeaturedColumn();
    const existing = await this.getEventById(id);
    if (!existing) {
      throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    }

    if (!isAdmin && existing.organizer_id !== organizerId) {
      throw new AppError('You do not have permission to modify this event', 403, 'FORBIDDEN');
    }

    const updates: string[] = [];
    const params: unknown[] = [];
    let pIdx = 1;

    if (input.title !== undefined) {
      updates.push(`title = $${pIdx++}`);
      params.push(input.title);
    }
    if (input.description !== undefined) {
      updates.push(`description = $${pIdx++}`);
      params.push(input.description);
    }
    if (input.category !== undefined) {
      updates.push(`category = $${pIdx++}`);
      params.push(input.category);
    }
    if (input.venue_id !== undefined) {
      updates.push(`venue_id = $${pIdx++}`);
      params.push(input.venue_id);
    }
    if (input.start_time !== undefined) {
      updates.push(`start_time = $${pIdx++}`);
      params.push(input.start_time);
    }
    if (input.end_time !== undefined) {
      updates.push(`end_time = $${pIdx++}`);
      params.push(input.end_time);
    }
    if (input.doors_open_time !== undefined) {
      updates.push(`doors_open_time = $${pIdx++}`);
      params.push(input.doors_open_time);
    }
    if (input.age_restriction !== undefined) {
      updates.push(`age_restriction = $${pIdx++}`);
      params.push(input.age_restriction);
    }
    if (input.banner_url !== undefined) {
      updates.push(`banner_url = $${pIdx++}`);
      params.push(input.banner_url);
    }
    if (input.is_featured !== undefined) {
      updates.push(`is_featured = $${pIdx++}`);
      params.push(Boolean(input.is_featured));
    }

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      params.push(id);
      await db.query(`UPDATE events SET ${updates.join(', ')} WHERE id = $${pIdx};`, params);
    }

    const updated = await this.getEventById(id);
    return updated!;
  }

  /**
   * Publishes a draft event
   */
  static async publishEvent(id: string, organizerId: string, isAdmin = false): Promise<EventDetail> {
    const existing = await this.getEventById(id);
    if (!existing) {
      throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    }

    if (!isAdmin && existing.organizer_id !== organizerId) {
      throw new AppError('You do not have permission to publish this event', 403, 'FORBIDDEN');
    }

    await db.query("UPDATE events SET status = 'published', updated_at = NOW() WHERE id = $1;", [id]);
    return (await this.getEventById(id))!;
  }

  /**
   * Cancels event and marks active tickets as VOID
   */
  static async cancelEvent(id: string, organizerId: string, isAdmin = false): Promise<EventDetail> {
    const existing = await this.getEventById(id);
    if (!existing) {
      throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    }

    if (!isAdmin && existing.organizer_id !== organizerId) {
      throw new AppError('You do not have permission to cancel this event', 403, 'FORBIDDEN');
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query("UPDATE events SET status = 'cancelled', updated_at = NOW() WHERE id = $1;", [id]);
      await client.query("UPDATE tickets SET status = 'void' WHERE event_id = $1 AND status = 'valid';", [id]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return (await this.getEventById(id))!;
  }
}
