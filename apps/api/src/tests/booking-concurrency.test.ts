import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import { db } from '../config/db.js';
import { BookingService } from '../services/booking.service.js';
import { AuthService } from '../services/auth.service.js';

describe('Booking Concurrency & Inventory Isolation Test', () => {
  let userId = '';
  let eventId = '';
  let tierId = '';
  const TOTAL_CAPACITY = 50;
  const CONCURRENT_REQUESTS = 200;

  beforeAll(async () => {
    // 1. Create a test user
    const user = await AuthService.register({
      email: `concurrency.${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Concurrency Tester',
      phone: '+919876543210',
      role: 'attendee',
    });
    userId = user.user.id;

    // 2. Fetch or create a venue
    const vRes = await db.query<{ id: string }>('SELECT id FROM venues LIMIT 1;');
    let venueId = vRes.rows[0]?.id;
    if (!venueId) {
      const newV = await db.query<{ id: string }>(
        `INSERT INTO venues (name, address, city, state, postal_code, capacity)
         VALUES ('Stress Test Arena', '1 Arena Way', 'Hyderabad', 'Telangana', '500081', 1000)
         RETURNING id;`,
      );
      venueId = newV.rows[0]!.id;
    }

    // 3. Create a dedicated test event
    eventId = crypto.randomUUID();
    await db.query(
      `INSERT INTO events (id, organizer_id, venue_id, title, slug, description, category, status, start_time, end_time)
       VALUES ($1, $2, $3, 'High-Throughput Concurrency Arena', $4, 'Concurrency Benchmark Event', 'Tech', 'published', NOW() + INTERVAL '1 day', NOW() + INTERVAL '2 days');`,
      [eventId, userId, venueId, `concurrency-arena-${Date.now()}`],
    );

    // 4. Create a dedicated test tier with EXACTLY 50 seats
    tierId = crypto.randomUUID();
    await db.query(
      `INSERT INTO ticket_tiers (id, event_id, name, description, price_paise, capacity, sold, sales_start, sales_end)
       VALUES ($1, $2, 'Limited General Admission', 'Exact 50 seats benchmark', 150000, $3, 0, NOW() - INTERVAL '1 hour', NOW() + INTERVAL '1 hour');`,
      [tierId, eventId, TOTAL_CAPACITY],
    );
  });

  it('200 parallel booking requests at 50 seats; exactly 50 succeed and 0 overbooked', async () => {
    type BookingResult =
      | { success: true; reservationId: string; idx: number }
      | { success: false; error: string; idx: number };

    // Launch 200 simultaneous hold requests across Node event loop
    const bookingPromises: Promise<BookingResult>[] = Array.from({ length: CONCURRENT_REQUESTS }, (_, idx) => {
      return BookingService.createHold(userId, tierId, 1)
        .then((reservation) => ({
          success: true as const,
          reservationId: reservation.id,
          idx,
        }))
        .catch((err: Error & { code?: string }) => ({
          success: false as const,
          error: (err.code || err.message) as string,
          idx,
        }));
    });

    const results = await Promise.all(bookingPromises);

    const successfulHolds = results.filter((r): r is { success: true; reservationId: string; idx: number } => r.success);
    const rejectedHolds = results.filter((r): r is { success: false; error: string; idx: number } => !r.success);

    // CRITICAL ASSERTION: Exactly 50 succeed
    expect(successfulHolds.length).toBe(TOTAL_CAPACITY);

    // CRITICAL ASSERTION: Exactly 150 rejected with insufficient stock
    expect(rejectedHolds.length).toBe(CONCURRENT_REQUESTS - TOTAL_CAPACITY);

    for (const rejected of rejectedHolds) {
      expect(rejected.error).toMatch(/INSUFFICIENT_STOCK|Insufficient/);
    }

    // Database verification: verify sold count in PostgreSQL
    const tierCheck = await db.query<{ sold: number; capacity: number }>(
      'SELECT sold, capacity FROM ticket_tiers WHERE id = $1;',
      [tierId],
    );

    const tierRow = tierCheck.rows[0]!;
    expect(tierRow.sold).toBe(TOTAL_CAPACITY);
    expect(tierRow.capacity).toBe(TOTAL_CAPACITY);
    // ZERO OVERBOOKING: sold MUST NEVER exceed capacity
    expect(tierRow.sold).toBeLessThanOrEqual(tierRow.capacity);
  }, 30000);

  it('Post-saturation: any further booking request is rejected immediately', async () => {
    await expect(BookingService.createHold(userId, tierId, 1)).rejects.toThrow(
      /Insufficient ticket capacity/,
    );
  });

  it('Releasing an active hold returns inventory and enables next reservation', async () => {
    // Find one active reservation for this tier
    const activeRes = await db.query<{ id: string }>(
      "SELECT id FROM reservations WHERE tier_id = $1 AND status = 'active' LIMIT 1;",
      [tierId],
    );
    expect(activeRes.rowCount).toBe(1);
    const releasedId = activeRes.rows[0]!.id;

    // Release the hold
    const released = await BookingService.releaseHold(releasedId, userId);
    expect(released).toBe(true);

    // Verify sold decremented to 49
    const tierCheck = await db.query<{ sold: number }>(
      'SELECT sold FROM ticket_tiers WHERE id = $1;',
      [tierId],
    );
    expect(tierCheck.rows[0]!.sold).toBe(TOTAL_CAPACITY - 1);

    // Now a new reservation should succeed
    const newHold = await BookingService.createHold(userId, tierId, 1);
    expect(newHold).toHaveProperty('id');

    // And sold is back to 50
    const finalTierCheck = await db.query<{ sold: number }>(
      'SELECT sold FROM ticket_tiers WHERE id = $1;',
      [tierId],
    );
    expect(finalTierCheck.rows[0]!.sold).toBe(TOTAL_CAPACITY);
  });
});
