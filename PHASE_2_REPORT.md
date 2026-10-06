# Phase 2 Completion Report: Database, Core API & Concurrency Gate

**Project:** Pulse & Pass — Event Management & Digital Ticketing Platform  
**Phase:** Phase 2 — Database Schema, Migrations, Core API & Concurrency Isolation  
**Date:** October 5, 2026  
**Status:** PASSED (Gate Criteria Fulfilled)

---

## 1. Executive Summary

Phase 2 establishes the transactional and cryptographic backend foundation for Pulse & Pass. All 10 database tables with strict PostgreSQL constraints, atomic reservation hold mechanics (with 5-minute expiry sweeps), HMAC-SHA256 digital pass signing, turnstile admissions verification, and high-concurrency ticket locking have been implemented, tested, and validated.

Zero mock libraries were used; all database operations execute pure PostgreSQL 16 SQL with schema migrations and indexing.

---

## 2. Phase 2 Gate Deliverables & Verification

| Gate Checkpoint | Target / Requirement | Result | Status |
| :--- | :--- | :--- | :---: |
| **Database Migrations** | 10 Relational tables, CHECK constraints, FK cascades | Migrations 001 & 002 applied | **PASSED** |
| **Database Seeding** | Authentic data across 4 Indian cities (8 users, 8 venues, 20 events, 40 tiers) | Seeded successfully | **PASSED** |
| **Strict TypeScript** | Zero `any`, strict compiler options across `@pulsepass/*` | `npm run type-check` exit code 0 | **PASSED** |
| **Code Hygiene** | Strict ESLint rules, zero warnings, zero dead code | `npm run lint` exit code 0 | **PASSED** |
| **Unit & Integration Tests** | Vitest + Supertest suite across Auth, Events, Check-in, Health | 26 / 26 tests passed (100%) | **PASSED** |
| **Concurrency Benchmark** | 200 parallel booking requests at 50 seats; exactly 50 succeed, 0 overbooked | Exactly 50 succeeded, 150 rejected, 0 overbooked | **PASSED** |
| **Live API Service** | Express API running concurrently on port `4000` | HTTP 200 on `/health`, `/events`, `/auth/login`, `/tickets/wallet` | **PASSED** |
| **Live Web App** | Next.js running on port `3000` | HTTP 200 on `/` and `/styleguide` | **PASSED** |

---

## 3. Database Architecture & Schema Summary

Migrations located at `apps/api/src/db/migrations/`:
1. `001_initial_schema.sql`:
   - `users`: UUID PK, role enum (`attendee`, `organizer`, `admin`), bcrypt password hash, unique email, Indian phone format.
   - `venues`: Names, physical street addresses, Indian metro cities, PIN codes, capacity constraints.
   - `events`: Slugs, date ranges, door opening times, age restrictions, status enum (`draft`, `published`, `cancelled`, `completed`).
   - `ticket_tiers`: Event FK, capacity, sold counter, prices in paise (integers), active sale windows.
   - `reservations`: Atomic 5-minute hold records with `expires_at` timestamps.
   - `orders`: Unique order numbers (`ORD-YYYY-XXXX`), reservation FK, confirmed payment state.
   - `order_items`: Granular attendee assignment (name, email, phone) per ticket.
   - `tickets`: Cryptographically signed passes with HMAC-SHA256 token hashes, usage timestamps, turnstile status (`valid`, `used`, `void`).
   - `checkins`: Admission audit trail tracking gate turnstile, timestamp, scanner user, device info, and outcome (`SUCCESS`, `ALREADY_USED`, `INVALID`, `WRONG_EVENT`).
   - `audit_log`: System security log capturing administrative role elevations and event publishing actions.
2. `002_indexes.sql`:
   - Optimized B-Tree indexes on `events(status, start_time)`, `events(venue_id)`, `ticket_tiers(event_id)`, `tickets(security_hash)`, and `checkins(event_id, scan_timestamp)`.

---

## 4. Concurrency & Zero-Overbooking Proof

**Test File:** `apps/api/src/tests/booking-concurrency.test.ts`

### Strategy
To enforce zero overbooking without dirty reads or race conditions, `BookingService.createHold` uses a conditional atomic UPDATE:
```sql
UPDATE ticket_tiers
SET sold = sold + $1, updated_at = NOW()
WHERE id = $2 AND (sold + $1) <= capacity
RETURNING id, event_id, name, price_paise, capacity, sold;
```
If the requested quantity exceeds the remaining unallocated seats, PostgreSQL returns zero updated rows and the transaction immediately rolls back, throwing HTTP 409 (`INSUFFICIENT_STOCK`).

### Benchmark Result
- **Simultaneous Requests:** 200 concurrent requests across Node.js event loop
- **Available Tier Capacity:** Exactly 50 seats
- **Successful Allocations:** **50**
- **Rejected Holds:** **150**
- **Database Post-State:** `capacity = 50`, `sold = 50`
- **Overbooking:** **0** (Invariant `sold <= capacity` preserved)
- **Benchmark Runtime:** 429 ms

---

## 5. Automated Test Suite Results

```
 RUN  v3.2.7 C:/Rishika/sem 3/web tech/Pulse & Pass/apps/api

 ✓ src/tests/booking-concurrency.test.ts (3 tests) 1077ms
   ✓ 200 parallel booking requests at 50 seats; exactly 50 succeed and 0 overbooked (429ms)
   ✓ Post-saturation: any further booking request is rejected immediately
   ✓ Releasing an active hold returns inventory and enables next reservation
 ✓ src/tests/auth.test.ts (8 tests) 841ms
   ✓ POST /api/v1/auth/register creates a new attendee account
   ✓ POST /api/v1/auth/register rejects duplicate email with 409
   ✓ POST /api/v1/auth/register rejects invalid password schema with 400
   ✓ POST /api/v1/auth/login signs in valid user and returns JWT
   ✓ POST /api/v1/auth/login rejects incorrect password with 401
   ✓ GET /api/v1/auth/me returns authenticated user dossier with Bearer token
   ✓ GET /api/v1/auth/me rejects unauthenticated request with 401
   ✓ POST /api/v1/auth/logout clears auth session cookie
 ✓ src/tests/events.test.ts (8 tests) 863ms
   ✓ GET /api/v1/events returns paginated event lineup with live availability
   ✓ GET /api/v1/events?city=Hyderabad filters events by city
   ✓ GET /api/v1/events?category=Music filters events by category
   ✓ GET /api/v1/events/:id returns full event dossier with venue and live tiers
   ✓ GET /api/v1/events/:id returns 404 for unknown event identifier
   ✓ POST /api/v1/events rejects unauthenticated callers with 401
   ✓ POST /api/v1/events rejects attendees with 403 Forbidden
   ✓ POST /api/v1/events allows organizer to publish an event with tiers
 ✓ src/tests/checkin.test.ts (5 tests) 792ms
   ✓ Valid QR check-in grants admission and updates ticket to used
   ✓ Duplicate scan of used ticket is rejected with ALREADY_USED
   ✓ Forged QR signature is rejected with INVALID
   ✓ Valid ticket presented at wrong event gate is rejected with WRONG_EVENT
   ✓ GET /api/v1/checkin/events/:eventId/log retrieves admission scan log
 ✓ src/tests/health.test.ts (2 tests) 38ms
   ✓ GET /api/v1/health returns 200 with status ok and service identifier
   ✓ GET /api/v1/non-existent returns structured 404

Test Files:  5 passed (5)
Tests:       26 passed (26)
Duration:    10.77s
```

---

## 6. Live API Verification

Both backend (Express on port 4000) and frontend (Next.js on port 3000) are actively serving requests:

1. **`GET /api/v1/health`**
   ```json
   {
     "status": "ok",
     "service": "pulse-and-pass-api",
     "version": "1.0.0",
     "timestamp": "2026-10-05T05:58:33.611Z",
     "environment": "development"
   }
   ```
2. **`GET /api/v1/events?limit=2`**
   - Returns paginated events with live ticket tiers, min/max price in paise, sold-out indicators, and venue details.
3. **`POST /api/v1/auth/login`**
   - Successfully authenticated `rishika@pulsepass.dev` with signed JWT and `Set-Cookie: token=...`.
4. **`GET /api/v1/tickets/wallet`**
   - Successfully retrieved 4 active passes with HMAC-SHA256 signatures and QR code data URLs.

---

## 7. Next Phase: Phase 3 Gate Preparation

Phase 3 implements the **XML Processing Engine**:
- XML DOM parsing with `@xmldom/xmldom` & SAX streaming with `sax`
- DTD validation & XSD validation using `xmllint-wasm`
- XSLT transformations to generate perforated printable ticket HTML
- Event manifest export and bulk import routes
- Attack defense against XML External Entity (XXE) and billion laughs entity expansion
