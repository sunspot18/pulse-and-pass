import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { db } from '../config/db.js';
import { AuthService } from '../services/auth.service.js';

describe('Events API Endpoints', () => {
  let attendeeToken = '';
  let organizerToken = '';
  let sampleEventId = '';

  beforeAll(async () => {
    // Generate auth tokens for testing role-based access control
    const attendeeRes = await AuthService.register({
      email: `attendee.ev.${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Event Attendee Tester',
      phone: '+919876543211',
      role: 'attendee',
    });
    attendeeToken = attendeeRes.token;

    const organizerRes = await AuthService.register({
      email: `organizer.ev.${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Event Organizer Tester',
      phone: '+919876543212',
      role: 'organizer',
    });
    organizerToken = organizerRes.token;

    // Fetch an existing seeded event
    const evRes = await db.query<{ id: string }>('SELECT id FROM events LIMIT 1;');
    if (evRes.rows[0]) {
      sampleEventId = evRes.rows[0].id;
    }
  });

  it('GET /api/v1/events returns paginated event lineup with live availability', async () => {
    const res = await request(app).get('/api/v1/events?limit=5');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('events');
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page', 1);
    expect(res.body).toHaveProperty('limit', 5);
  });

  it('GET /api/v1/events?city=Hyderabad filters events by city', async () => {
    const res = await request(app).get('/api/v1/events?city=Hyderabad');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
    for (const ev of res.body.events) {
      expect(ev.venue.city.toLowerCase()).toContain('hyderabad');
    }
  });

  it('GET /api/v1/events?category=Music filters events by category', async () => {
    const res = await request(app).get('/api/v1/events?category=Music');

    expect(res.status).toBe(200);
    for (const ev of res.body.events) {
      expect(ev.category).toBe('Music');
    }
  });

  it('GET /api/v1/events/:id returns full event dossier with venue and live tiers', async () => {
    const res = await request(app).get(`/api/v1/events/${sampleEventId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('event');
    expect(res.body.event.id).toBe(sampleEventId);
    expect(res.body.event).toHaveProperty('venue');
    expect(res.body.event).toHaveProperty('tiers');
    expect(Array.isArray(res.body.event.tiers)).toBe(true);
    expect(res.body.event.tiers.length).toBeGreaterThan(0);
    expect(res.body.event.tiers[0]).toHaveProperty('available');
  });

  it('GET /api/v1/events/:id returns 404 for unknown event identifier', async () => {
    const res = await request(app).get('/api/v1/events/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'EVENT_NOT_FOUND');
  });

  it('POST /api/v1/events rejects unauthenticated callers with 401', async () => {
    const res = await request(app).post('/api/v1/events').send({});

    expect(res.status).toBe(401);
  });

  it('POST /api/v1/events rejects attendees with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({
        title: 'Unauthorized Event',
      });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error', 'FORBIDDEN');
  });

  it('POST /api/v1/events allows organizer to publish an event with tiers', async () => {
    const newEventPayload = {
      title: `Cyber Sound Showcase ${Date.now()}`,
      description: 'An experimental synthwave & ambient audio exhibition.',
      category: 'Music',
      start_time: '2026-11-15T18:00:00Z',
      end_time: '2026-11-15T23:00:00Z',
      doors_open_time: '2026-11-15T17:30:00Z',
      venue: {
        name: 'The Soundstage',
        address: '88 Cyber Hub Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postal_code: '560001',
        capacity: 350,
      },
      tiers: [
        {
          name: 'General Admission',
          description: 'Access to main hall and standing pit',
          price_paise: 99900,
          capacity: 250,
          sales_start: '2026-01-01T00:00:00.000Z',
          sales_end: '2026-12-31T23:59:59.000Z',
        },
        {
          name: 'VIP Balcony Pass',
          description: 'Elevated viewing tier and private bar',
          price_paise: 249900,
          capacity: 100,
          sales_start: '2026-01-01T00:00:00.000Z',
          sales_end: '2026-12-31T23:59:59.000Z',
        },
      ],
    };

    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(newEventPayload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('event');
    expect(res.body.event.title).toBe(newEventPayload.title);
    expect(res.body.event.status).toBe('published');
    expect(res.body.event.tiers.length).toBe(2);
    expect(res.body.event.venue.city).toBe('Bengaluru');
  });
});
