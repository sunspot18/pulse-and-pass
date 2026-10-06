import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../app.js';
import { db } from '../config/db.js';
import { AuthService } from '../services/auth.service.js';
import { TicketService } from '../services/ticket.service.js';

describe('Turnstile Gate Check-in & QR Verification', () => {
  let organizerToken = '';
  let eventId = '';
  let ticketId = '';
  let ticketCode = '';
  let securityHash = '';
  let validQrPayload = '';

  beforeAll(async () => {
    // 1. Create an organizer user who operates the scanner gate
    const orgUser = await AuthService.register({
      email: `gatekeeper.${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Gate Scanner Staff',
      phone: '+919876543213',
      role: 'organizer',
    });
    organizerToken = orgUser.token;

    // 2. Fetch or create a test event
    const evRes = await db.query<{ id: string }>('SELECT id FROM events LIMIT 1;');
    if (evRes.rows[0]) {
      eventId = evRes.rows[0].id;
    } else {
      eventId = crypto.randomUUID();
      await db.query(
        `INSERT INTO events (id, organizer_id, venue_id, title, slug, description, category, status, start_time, end_time)
         VALUES ($1, $2, (SELECT id FROM venues LIMIT 1), 'Gate Checkin Event', 'gate-event', 'Gate test', 'Music', 'published', NOW(), NOW() + INTERVAL '1 day');`,
        [eventId, orgUser.user.id],
      );
    }

    // 3. Create a test ticket tier
    const tierId = crypto.randomUUID();
    await db.query(
      `INSERT INTO ticket_tiers (id, event_id, name, description, price_paise, capacity, sold, sales_start, sales_end)
       VALUES ($1, $2, 'Gate Test Tier', 'Test pass', 100000, 100, 1, NOW() - INTERVAL '1 hour', NOW() + INTERVAL '1 hour');`,
      [tierId, eventId],
    );

    // 4. Create a reservation, order, and order item
    const reservationId = crypto.randomUUID();
    await db.query(
      `INSERT INTO reservations (id, user_id, tier_id, quantity, status, expires_at)
       VALUES ($1, $2, $3, 1, 'completed', NOW() + INTERVAL '1 day');`,
      [reservationId, orgUser.user.id, tierId],
    );

    const orderId = crypto.randomUUID();
    await db.query(
      `INSERT INTO orders (id, user_id, event_id, reservation_id, order_number, total_amount_paise, status)
       VALUES ($1, $2, $3, $4, $5, 100000, 'confirmed');`,
      [orderId, orgUser.user.id, eventId, reservationId, `ORD-GATE-${Date.now()}`],
    );

    const orderItemId = crypto.randomUUID();
    await db.query(
      `INSERT INTO order_items (id, order_id, tier_id, attendee_name, attendee_email, attendee_phone, unit_price_paise)
       VALUES ($1, $2, $3, 'Aarav Patel', 'aarav@example.com', '9876543210', 100000);`,
      [orderItemId, orderId, tierId],
    );

    // 5. Issue cryptographic ticket signed with HMAC-SHA256
    ticketId = crypto.randomUUID();
    const tokenData = TicketService.generateTicketCode(ticketId, eventId);
    ticketCode = tokenData.ticketCode;
    securityHash = tokenData.securityHash;
    validQrPayload = tokenData.qrPayload;

    await db.query(
      `INSERT INTO tickets (id, order_item_id, order_id, event_id, tier_id, ticket_code, security_hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'valid');`,
      [ticketId, orderItemId, orderId, eventId, tierId, ticketCode, securityHash],
    );
  });

  it('Valid QR check-in grants admission and updates ticket to used', async () => {
    const res = await request(app)
      .post('/api/v1/checkin/verify')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        qr_payload: validQrPayload,
        event_id: eventId,
        device_info: 'Gate 01 Handheld Scanner',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'SUCCESS');
    expect(res.body.message).toContain('ADMISSION GRANTED');
    expect(res.body.ticket).toBeDefined();
    expect(res.body.ticket.status).toBe('used');

    // Verify in database that ticket is now marked used
    const dbTicket = await db.query<{ status: string; used_at: string }>(
      'SELECT status, used_at FROM tickets WHERE id = $1;',
      [ticketId],
    );
    expect(dbTicket.rows[0]!.status).toBe('used');
    expect(dbTicket.rows[0]!.used_at).not.toBeNull();
  });

  it('Duplicate scan of used ticket is rejected with ALREADY_USED', async () => {
    const res = await request(app)
      .post('/api/v1/checkin/verify')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        qr_payload: validQrPayload,
        event_id: eventId,
        device_info: 'Gate 01 Handheld Scanner',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ALREADY_USED');
    expect(res.body.message).toContain('already admitted');
  });

  it('Forged QR signature is rejected with INVALID', async () => {
    const tamperedPayload = JSON.stringify({
      v: 1,
      tid: ticketId,
      eid: eventId,
      code: ticketCode,
      sig: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // counterfeit HMAC
    });

    const res = await request(app)
      .post('/api/v1/checkin/verify')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        qr_payload: tamperedPayload,
        event_id: eventId,
        device_info: 'Gate 01 Handheld Scanner',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'INVALID');
    expect(res.body.message).toContain('counterfeit');
  });

  it('Valid ticket presented at wrong event gate is rejected with WRONG_EVENT', async () => {
    // Generate another valid ticket for Event A
    const anotherTicketId = crypto.randomUUID();
    const tokenData = TicketService.generateTicketCode(anotherTicketId, eventId);

    // Create order item and ticket for eventId
    const anotherOrderItemId = crypto.randomUUID();
    const orderRes = await db.query<{ id: string }>('SELECT id FROM orders LIMIT 1;');
    const tierRes = await db.query<{ id: string }>('SELECT id FROM ticket_tiers WHERE event_id = $1 LIMIT 1;', [eventId]);

    await db.query(
      `INSERT INTO order_items (id, order_id, tier_id, attendee_name, attendee_email, attendee_phone, unit_price_paise)
       VALUES ($1, $2, $3, 'Riya Sharma', 'riya@example.com', '9876543211', 100000);`,
      [anotherOrderItemId, orderRes.rows[0]!.id, tierRes.rows[0]!.id],
    );

    await db.query(
      `INSERT INTO tickets (id, order_item_id, order_id, event_id, tier_id, ticket_code, security_hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'valid');`,
      [anotherTicketId, anotherOrderItemId, orderRes.rows[0]!.id, eventId, tierRes.rows[0]!.id, tokenData.ticketCode, tokenData.securityHash],
    );

    // Now present it to an entirely different event gate
    const wrongEventId = crypto.randomUUID();

    const res = await request(app)
      .post('/api/v1/checkin/verify')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        qr_payload: tokenData.qrPayload,
        event_id: wrongEventId,
        device_info: 'Gate 02 Turnstile',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'WRONG_EVENT');
    expect(res.body.message).toContain('different event');
  });

  it('GET /api/v1/checkin/events/:eventId/log retrieves admission scan log', async () => {
    const res = await request(app)
      .get(`/api/v1/checkin/events/${eventId}/log`)
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('checkins');
    expect(Array.isArray(res.body.checkins)).toBe(true);
    expect(res.body.checkins.length).toBeGreaterThan(0);
    expect(res.body).toHaveProperty('total');
  });
});
