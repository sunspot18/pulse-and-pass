# Phase 3 Report: XML Processing Engine

**Project:** Pulse & Pass — Event Management & Digital Ticketing Platform  
**Phase:** 3 — XML Processing Engine  
**Status:** Completed & Verified  
**Date:** October 5, 2026  

---

## 1. Executive Summary

Phase 3 delivers a complete, secure, standards-compliant XML processing subsystem for the Pulse & Pass box office platform. The engine provides bi-directional XML data exchange for event manifests and tickets, leveraging:
- **XML DOM Parsing & Generation** via `@xmldom/xmldom`
- **Streaming SAX Ticket Export & Validation** via `sax`
- **W3C XML Schema (XSD) Validation** using `xmllint-wasm` (libxml2 compiled to WebAssembly)
- **Document Type Definition (DTD) Validation** via `event.dtd` grammar and validation engine
- **XSLT 1.0 Transformation** using `xslt-processor` to render ticket passes into printable HTML
- **Comprehensive XML Security Defenses** against XML External Entity (XXE) and Billion Laughs / quadratic entity expansion attacks

All 44 test cases across the system pass with zero failures. Strict TypeScript and ESLint checks pass with 0 errors and 0 warnings.

---

## 2. Delivered Schemas & Stylesheets

All schema assets are housed in [`apps/api/src/schemas/xml/`](file:///c:/Rishika/sem%203/web%20tech/Pulse%20&%20Pass/apps/api/src/schemas/xml):

| File | Type | Purpose | Key Specifications |
| :--- | :--- | :--- | :--- |
| [`event.dtd`](file:///c:/Rishika/sem%203/web%20tech/Pulse%20&%20Pass/apps/api/src/schemas/xml/event.dtd) | DTD | Event Manifest DTD Schema | Enforces structure: `(title, slug, description, category, venue, tiers)` with strictly typed sub-elements. |
| [`tier.xsd`](file:///c:/Rishika/sem%203/web%20tech/Pulse%20&%20Pass/apps/api/src/schemas/xml/tier.xsd) | XSD | Ticket Tier XML Schema | Enforces `xs:nonNegativeInteger` for price (in paise) and `xs:positiveInteger` for capacity ($\ge 1$). |
| [`event.xsd`](file:///c:/Rishika/sem%203/web%20tech/Pulse%20&%20Pass/apps/api/src/schemas/xml/event.xsd) | XSD | Full Event Manifest Schema | Validates comprehensive event structure with string patterns and type bounds. |
| [`ticket.xslt`](file:///c:/Rishika/sem%203/web%20tech/Pulse%20&%20Pass/apps/api/src/schemas/xml/ticket.xslt) | XSLT 1.0 | Printable Ticket Layout | Transforms `<ticket>` XML into a perforated ticket layout with CSS design tokens (`--ink`, `--paper`, `--cyan`, `--amber`). |

---

## 3. Architecture & Service Layer

The XML processing pipeline is organized under [`apps/api/src/services/xml/`](file:///c:/Rishika/sem%203/web%20tech/Pulse%20&%20Pass/apps/api/src/services/xml):

### 3.1. `XmlSecurityService` ([`xml-security.service.ts`](file:///c:/Rishika/sem%203/web%20tech/Pulse%20&%20Pass/apps/api/src/services/xml/xml-security.service.ts))
- **XXE Injection Defense:** Rejects any payload defining external entities via `SYSTEM` identifiers or `PUBLIC` URIs with external protocols (`http:`, `file:`, `ftp:`, `data:`, `expect:`, `php:`).
- **Billion Laughs / Entity Expansion Defense:** Limits internal entity definitions ($\le 5$) and inspects entity values for recursive entity expansions (`&lol1;&lol1;...`), rejecting potential denial-of-service payloads.
- **Payload Size Clamping:** Rejects raw XML inputs larger than 5MB with HTTP 413.

### 3.2. `XmlLintService` ([`xmllint.service.ts`](file:///c:/Rishika/sem%203/web%20tech/Pulse%20&%20Pass/apps/api/src/services/xml/xmllint.service.ts))
- **Wasm Schema Runner:** Invokes `xmllint-wasm` directly with `--noout --schema schema.xsd --nonet`. Solves the Node 18+ Emscripten `fetch()` bug by safely stashing `globalThis.fetch` during WebAssembly execution.
- **DTD Grammar Engine:** Validates root `<event>` elements, DOCTYPE declarations, child element sequence, and attribute constraints against `event.dtd`.

### 3.3. `XmlDomService` ([`xml-dom.service.ts`](file:///c:/Rishika/sem%203/web%20tech/Pulse%20&%20Pass/apps/api/src/services/xml/xml-dom.service.ts))
- **Event Manifest Serialization:** Converts database `EventDetail` records into formatted XML conforming to `event.dtd`.
- **Manifest Parsing:** Parses XML event manifests with `@xmldom/xmldom` `DOMParser` and error collectors into typed domain models.
- **Ticket XML Generator:** Converts tickets with QR code data URLs into `<ticket>` XML payloads for XSLT rendering.

### 3.4. `XmlSaxService` ([`xml-sax.service.ts`](file:///c:/Rishika/sem%203/web%20tech/Pulse%20&%20Pass/apps/api/src/services/xml/xml-sax.service.ts))
- **Chunked Streaming Exporter:** Streams high-volume ticket records directly into HTTP response streams using backpressure-aware chunking (`write` + `drain`), preventing memory exhaustion.
- **Streaming SAX Validator:** Validates incoming XML streams using event-driven `sax.createStream` without full document buffering.

### 3.5. `XmlXsltService` ([`xml-xslt.service.ts`](file:///c:/Rishika/sem%203/web%20tech/Pulse%20&%20Pass/apps/api/src/services/xml/xml-xslt.service.ts))
- Compiles `ticket.xslt` and transforms ticket XML into a standalone, printable HTML ticket with verified HMAC signatures and gate turnstile QR codes.

---

## 4. HTTP Endpoints Delivered

The following endpoints were mounted and verified:

```
GET  /api/v1/events/:id/xml             # Download event manifest XML (conforming to event.dtd)
POST /api/v1/events/import-xml          # Validate (DTD + XSD + XXE) & import event into DB (organizer/admin)
GET  /api/v1/tickets/:id/print          # XSLT transform -> Printable HTML pass (attendee/organizer/admin)
GET  /api/v1/organizer/events/:id/export-sax # Streaming SAX export of all event tickets (organizer/admin)
```

### Verified Live Endpoints:
1. `GET /api/v1/events/e0000010-0000-0000-0000-000000000010/xml` $\rightarrow$ **HTTP 200** with `Content-Type: application/xml; charset=utf-8` and valid `<!DOCTYPE event SYSTEM "event.dtd">`.
2. `POST /api/v1/events/import-xml` $\rightarrow$ **HTTP 201 Created** with `{ success: true, event: { ... } }`, creating event, venue, and tiers in PostgreSQL.
3. `GET /api/v1/tickets/88888888-8888-8888-8888-888888888881/print` $\rightarrow$ **HTTP 200** with `Content-Type: text/html; charset=utf-8`, rendering XSLT perforated ticket stub.
4. `GET /api/v1/organizer/events/e0000010-0000-0000-0000-000000000010/export-sax` $\rightarrow$ **HTTP 200** streaming `application/xml` attachment with `<ticket_export>` root.

---

## 5. Visual Design & Printable Ticket Layout

The XSLT transformation outputs a digital perforated admission pass featuring:
- **Design System Tokens:** `--ink: #0A0D14`, `--paper: #F8F9FA`, `--cyan: #00E5FF`, `--amber: #FFB300`
- **Perforated Ticket Stub:** Dashed tear line with round circular punch-out notches on left and right edges
- **Gate Turnstile QR Code:** High-contrast QR code with embedded cryptographic HMAC signature
- **Watermark & Verification Stamp:** `VERIFIED PASS` stamp rotated $-3^\circ$
- **Print Optimization:** Print media queries (`@media print`) ensuring zero background clipping and clean black/white high-fidelity paper printing.

![Printable Perforated Ticket Mockup](file:///C:/Users/rishi/.gemini/antigravity-ide/brain/a1fc74a9-8444-4079-8002-ae6dc4591ef3/ticket_pass_mockup_1791187497016.jpg)

---

## 6. Verification & Quality Gates

### 6.1. Vitest Automated Test Suite (`npm run test`)
```
✓ src/tests/booking-concurrency.test.ts (3 tests)
  ✓ 200 parallel booking requests at 50 seats; exactly 50 succeed, 0 overbooked (433ms)
✓ src/tests/xml.test.ts (18 tests)
  ✓ Validates correct event manifest against event.dtd
  ✓ Rejects event manifest with illegal tags or broken hierarchy
  ✓ Rejects event manifest missing DOCTYPE declaration
  ✓ Validates compliant ticket tier against tier.xsd
  ✓ Rejects tier with non-integer or negative price_paise
  ✓ Rejects tier with capacity zero (capacity must be positiveInteger >= 1)
  ✓ Blocks XXE attacks with SYSTEM entity identifier
  ✓ Blocks XXE attacks with remote protocol handlers
  ✓ Blocks Billion Laughs entity expansion attack
  ✓ Parses valid event manifest into structured domain object
  ✓ Transforms ticket XML into perforated printable HTML pass via XSLT
  ✓ GET /api/v1/events/:id/xml exports event manifest XML conforming to DTD
  ✓ POST /api/v1/events/import-xml allows organizer to import valid XML manifest
  ✓ POST /api/v1/events/import-xml rejects attendee role (403 Forbidden)
  ✓ POST /api/v1/events/import-xml rejects XXE attack payload with 400
  ✓ POST /api/v1/events/import-xml rejects DTD violation with 400 DTD_VALIDATION_ERROR
  ✓ GET /api/v1/tickets/:id/print returns XSLT-rendered printable ticket HTML for admin
  ✓ GET /api/v1/organizer/events/:id/export-sax streams ticket export XML for organizer
✓ src/tests/events.test.ts (8 tests)
✓ src/tests/auth.test.ts (8 tests)
✓ src/tests/checkin.test.ts (5 tests)
✓ src/tests/health.test.ts (2 tests)

Test Files  6 passed (6)
Tests       44 passed (44)
Duration    11.53s
```

### 6.2. TypeScript Strict Type-Check (`npm run type-check`)
- `@pulsepass/shared`: Exit 0 (0 errors)
- `@pulsepass/api`: Exit 0 (0 errors)
- `@pulsepass/web`: Exit 0 (0 errors)

### 6.3. ESLint Code Quality (`npm run lint`)
- Root workspace: Exit 0 (0 errors, 0 warnings)

---

## 7. Gate Status & Next Steps

Phase 3 has passed all acceptance criteria:
- [x] Event Manifest DTD schema and validation
- [x] Ticket Tier XML Schema (XSD) and validation
- [x] XML DOM parsing & generation (`@xmldom/xmldom`)
- [x] Streaming SAX export & validation (`sax`)
- [x] XSLT printable ticket transformation (`xslt-processor`)
- [x] XXE and Billion Laughs defenses
- [x] 4 dedicated REST endpoints
- [x] 100% test pass rate across 44 tests

**Phase 4 Goal (Next):** Security, Auth & Hardening
- CSRF protection (Double Submit Cookie pattern / SameSite cookies)
- Strict Content Security Policy (CSP) & Helmet HTTP headers
- Rate limiting on sensitive endpoints (auth, reservation, XML import)
- Cryptographic ticket verification hardening
- Role-based authorization audit
