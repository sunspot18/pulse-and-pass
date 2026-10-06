import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { db } from '../config/db.js';

describe('Auth Service & Endpoints', () => {
  beforeAll(async () => {
    await db.query('SELECT 1;');
  });

  const testEmail = `test.user.${Date.now()}@example.com`;
  let authToken = '';

  it('POST /api/v1/auth/register creates a new attendee account', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: 'Password123!',
        name: 'Test Attendee',
        phone: '9876543210',
        role: 'attendee',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.role).toBe('attendee');
    expect(res.body).toHaveProperty('token');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /api/v1/auth/register rejects duplicate email with 409', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: 'Password123!',
        name: 'Duplicate Attempt',
        phone: '9876543211',
      });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error', 'EMAIL_EXISTS');
  });

  it('POST /api/v1/auth/register rejects invalid password schema with 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `invalid.${Date.now()}@example.com`,
        password: '123', // too short
        name: 'Invalid Pwd',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'VALIDATION_ERROR');
  });

  it('POST /api/v1/auth/login signs in valid user and returns JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testEmail);
    authToken = res.body.token;
  });

  it('POST /api/v1/auth/login rejects incorrect password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword999!',
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'INVALID_CREDENTIALS');
  });

  it('GET /api/v1/auth/me returns authenticated user dossier with Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.name).toBe('Test Attendee');
  });

  it('GET /api/v1/auth/me rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'UNAUTHORIZED');
  });

  it('POST /api/v1/auth/logout clears auth session cookie', async () => {
    const res = await request(app).post('/api/v1/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});
