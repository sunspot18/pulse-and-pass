import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('API Foundation & Health Check', () => {
  it('GET /api/v1/health returns 200 with status ok and service identifier', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'pulse-and-pass-api');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/v1/non-existent returns structured 404', async () => {
    const res = await request(app).get('/api/v1/non-existent');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'NOT_FOUND');
  });
});
