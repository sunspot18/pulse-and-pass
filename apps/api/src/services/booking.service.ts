import { db } from '../config/db.js';
import { AppError } from '../utils/errors.js';
import type { Reservation, TicketTier } from '@pulsepass/shared';

interface ReservationRow extends Reservation {
  tier_name: string;
  price_paise: number;
  event_id: string;
  event_title: string;
}

export class BookingService {
  /**
   * ATOMIC RESERVATION HOLD (Strict Transaction with Conditional UPDATE)
   * Enforces zero overbooking: stock can NEVER exceed capacity.
   */
  static async createHold(
    userId: string,
    tierId: string,
    quantity: number,
  ): Promise<Reservation & { remaining_seconds: number; tier_name: string; price_paise: number }> {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // 1. Conditional Atomic UPDATE: Only succeeds if sold + quantity <= capacity
      const updateTierSql = `
        UPDATE ticket_tiers
        SET sold = sold + $1, updated_at = NOW()
        WHERE id = $2 AND (sold + $1) <= capacity
        RETURNING id, event_id, name, price_paise, capacity, sold;
      `;
      const tierRes = await client.query<TicketTier>(updateTierSql, [quantity, tierId]);

      if (tierRes.rowCount === 0) {
        // Rollback immediately - tier is sold out or insufficient seats remain
        await client.query('ROLLBACK');
        throw new AppError(
          `Insufficient ticket capacity. Requested ${quantity} seats, but tier does not have enough remaining stock.`,
          409,
          'INSUFFICIENT_STOCK',
        );
      }

      const tier = tierRes.rows[0]!;

      // 2. Insert 5-minute reservation record
      const insertReservationSql = `
        INSERT INTO reservations (user_id, tier_id, quantity, status, expires_at)
        VALUES ($1, $2, $3, 'active', NOW() + INTERVAL '5 minutes')
        RETURNING id, user_id, tier_id, quantity, status, expires_at, created_at;
      `;
      const resResult = await client.query<Reservation>(insertReservationSql, [
        userId,
        tierId,
        quantity,
      ]);

      await client.query('COMMIT');

      const reservation = resResult.rows[0]!;
      const expiresAtMs = new Date(reservation.expires_at).getTime();
      const nowMs = Date.now();
      const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000));

      return {
        ...reservation,
        remaining_seconds: remainingSeconds,
        tier_name: tier.name,
        price_paise: tier.price_paise,
      };
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Already rolled back
      }
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Retrieves reservation with live remaining seconds; releases hold if expired
   */
  static async getReservation(id: string, userId?: string) {
    const res = await db.query<ReservationRow>(
      `SELECT r.id, r.user_id, r.tier_id, r.quantity, r.status, r.expires_at, r.created_at,
              t.name as tier_name, t.price_paise, e.id as event_id, e.title as event_title
       FROM reservations r
       JOIN ticket_tiers t ON r.tier_id = t.id
       JOIN events e ON t.event_id = e.id
       WHERE r.id = $1 ${userId ? 'AND r.user_id = $2' : ''};`,
      userId ? [id, userId] : [id],
    );

    if (res.rowCount === 0) {
      throw new AppError('Reservation not found', 404, 'NOT_FOUND');
    }

    const reservation = res.rows[0]!;

    // Check if expired
    const expiresAt = new Date(reservation.expires_at).getTime();
    const remainingSeconds = Math.floor((expiresAt - Date.now()) / 1000);

    if (reservation.status === 'active' && remainingSeconds <= 0) {
      await this.releaseHold(reservation.id);
      reservation.status = 'expired';
      return { ...reservation, remaining_seconds: 0, is_expired: true };
    }

    return {
      ...reservation,
      remaining_seconds: Math.max(0, remainingSeconds),
      is_expired: reservation.status !== 'active' || remainingSeconds <= 0,
    };
  }

  /**
   * Explicitly releases a held reservation and restores tier capacity
   */
  static async releaseHold(reservationId: string, userId?: string): Promise<boolean> {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const findSql = `
        SELECT id, tier_id, quantity, status
        FROM reservations
        WHERE id = $1 ${userId ? 'AND user_id = $2' : ''} AND status = 'active'
        FOR UPDATE;
      `;
      const findRes = await client.query<{ id: string; tier_id: string; quantity: number }>(
        findSql,
        userId ? [reservationId, userId] : [reservationId],
      );

      if (findRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const { tier_id, quantity } = findRes.rows[0]!;

      // Mark reservation cancelled / expired
      await client.query(
        "UPDATE reservations SET status = 'cancelled' WHERE id = $1;",
        [reservationId],
      );

      // Decrement tier sold stock safely
      await client.query(
        'UPDATE ticket_tiers SET sold = GREATEST(0, sold - $1), updated_at = NOW() WHERE id = $2;',
        [quantity, tier_id],
      );

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Sweeps expired reservation holds and returns tickets to inventory
   */
  static async sweepExpiredHolds(): Promise<number> {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Find all active reservations that have expired
      const expiredRes = await client.query<{ id: string; tier_id: string; quantity: number }>(
        `SELECT id, tier_id, quantity
         FROM reservations
         WHERE status = 'active' AND expires_at < NOW();`,
      );

      if (expiredRes.rowCount === 0) {
        await client.query('COMMIT');
        return 0;
      }

      for (const row of expiredRes.rows) {
        await client.query("UPDATE reservations SET status = 'expired' WHERE id = $1;", [row.id]);
        await client.query(
          'UPDATE ticket_tiers SET sold = GREATEST(0, sold - $1), updated_at = NOW() WHERE id = $2;',
          [row.quantity, row.tier_id],
        );
      }

      await client.query('COMMIT');
      return expiredRes.rowCount;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Sweep expired holds error:', err);
      return 0;
    } finally {
      client.release();
    }
  }
}
