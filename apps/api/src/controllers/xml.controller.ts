import type { Request, Response, NextFunction } from 'express';
import { db } from '../config/db.js';
import { EventService } from '../services/event.service.js';
import { TicketService } from '../services/ticket.service.js';
import {
  XmlSecurityService,
  XmlLintService,
  XmlDomService,
  XmlSaxService,
  XmlXsltService,
} from '../services/xml/index.js';
import { AppError } from '../utils/errors.js';
import type { Ticket } from '@pulsepass/shared';

interface TicketPrintRow {
  id: string;
  ticket_code: string;
  security_hash: string;
  status: Ticket['status'];
  used_at: string | null;
  created_at: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string | null;
  unit_price_paise: number;
  tier_name: string;
  event_id: string;
  event_title: string;
  event_start_time: string;
  venue_name: string;
  venue_city: string;
  user_id: string;
  organizer_id: string;
}

export class XmlController {
  /**
   * GET /api/v1/events/:id/xml
   * Exports event manifest as XML conforming to event.dtd
   */
  static async exportEventXml(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const event = await EventService.getEventById(id);

      if (!event) {
        res.status(404).json({ error: 'EVENT_NOT_FOUND', message: 'Event not found' });
        return;
      }

      const xml = XmlDomService.eventToXml(event);

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="event-${event.slug}.xml"`);
      res.status(200).send(xml);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/events/import-xml
   * Validates XML against DTD and XSD schemas, defenses against XXE, and imports event into DB
   */
  static async importEventXml(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Body can be raw text/xml or JSON { xml: string }
      let rawXml = typeof req.body === 'string' ? req.body : req.body?.xml;

      if (!rawXml && typeof req.body === 'object') {
        // In case express parsed XML into an empty object
        throw new AppError('No XML content found in request body', 400, 'VALIDATION_ERROR');
      }

      if (typeof rawXml !== 'string' || !rawXml.trim()) {
        throw new AppError('XML payload must be non-empty string', 400, 'VALIDATION_ERROR');
      }

      // Step 1: Security validation (XXE + Billion Laughs)
      XmlSecurityService.sanitizeAndValidate(rawXml);

      // Step 2: DTD Validation with xmllint WebAssembly
      const dtdResult = await XmlLintService.validateDtd(rawXml);
      if (!dtdResult.valid) {
        res.status(400).json({
          error: 'DTD_VALIDATION_ERROR',
          message: 'XML does not conform to event.dtd specification',
          details: dtdResult.errors,
        });
        return;
      }

      // Step 3: DOM Parsing
      const manifest = XmlDomService.parseEventXml(rawXml);

      // Step 4: Validate each tier with tier.xsd
      const tierXsd = XmlLintService.getTierXsd();
      for (let i = 0; i < manifest.tiers.length; i++) {
        const tier = manifest.tiers[i];
        if (!tier) continue;

        const tierXmlSnippet =
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<tier currency="${tier.currency || 'INR'}">\n` +
          `  <name>${tier.name}</name>\n` +
          (tier.description ? `  <description>${tier.description}</description>\n` : '') +
          `  <price_paise>${tier.price_paise}</price_paise>\n` +
          `  <capacity>${tier.capacity}</capacity>\n` +
          (tier.sales_start ? `  <sales_start>${tier.sales_start}</sales_start>\n` : '') +
          (tier.sales_end ? `  <sales_end>${tier.sales_end}</sales_end>\n` : '') +
          `</tier>`;

        const xsdResult = await XmlLintService.validateXsd(tierXmlSnippet, tierXsd);
        if (!xsdResult.valid) {
          res.status(400).json({
            error: 'XSD_VALIDATION_ERROR',
            message: `Tier at index ${i} ('${tier.name}') failed tier.xsd validation`,
            details: xsdResult.errors,
          });
          return;
        }
      }

      // Step 5: Persist imported event to database
      const organizerId = req.user!.userId;

      // Adjust start/end times if not present or create reasonable default event window
      const now = new Date();
      const startTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString();

      const createdEvent = await EventService.createEvent(
        {
          title: manifest.title,
          description: manifest.description,
          category: manifest.category,
          start_time: startTime,
          end_time: endTime,
          age_restriction: 'All Ages',
          venue: {
            name: manifest.venue.name,
            address: manifest.venue.address,
            city: manifest.venue.city,
            state: manifest.venue.state,
            postal_code: manifest.venue.postal_code,
            capacity: manifest.venue.capacity,
          },
          tiers: manifest.tiers.map((t) => ({
            name: t.name,
            description: t.description,
            price_paise: t.price_paise,
            capacity: t.capacity,
            sales_start: t.sales_start ? new Date(t.sales_start).toISOString() : new Date().toISOString(),
            sales_end: t.sales_end ? new Date(t.sales_end).toISOString() : endTime,
          })),
        },
        organizerId,
      );

      res.status(201).json({
        success: true,
        message: 'Event manifest successfully validated and imported',
        event: createdEvent,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/tickets/:id/print
   * Transforms ticket record via XSLT into perforated printable HTML pass
   */
  static async printTicketHtml(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticketId = req.params.id as string;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      const ticketSql = `
        SELECT t.id, t.ticket_code, t.security_hash, t.status, t.used_at, t.created_at,
               oi.attendee_name, oi.attendee_email, oi.attendee_phone, oi.unit_price_paise,
               tt.name as tier_name,
               e.id as event_id, e.title as event_title, e.start_time as event_start_time,
               e.organizer_id,
               v.name as venue_name, v.city as venue_city,
               o.user_id
        FROM tickets t
        JOIN order_items oi ON t.order_item_id = oi.id
        JOIN orders o ON t.order_id = o.id
        JOIN ticket_tiers tt ON t.tier_id = tt.id
        JOIN events e ON t.event_id = e.id
        JOIN venues v ON e.venue_id = v.id
        WHERE t.id = $1;
      `;

      const resData = await db.query<TicketPrintRow>(ticketSql, [ticketId]);

      if (resData.rowCount === 0 || !resData.rows[0]) {
        res.status(404).json({ error: 'TICKET_NOT_FOUND', message: 'Ticket not found' });
        return;
      }

      const row = resData.rows[0];

      // Authorization check: Must be ticket purchaser, event organizer, or admin
      if (userId && userRole !== 'admin' && row.user_id !== userId && row.organizer_id !== userId) {
        res.status(403).json({ error: 'FORBIDDEN', message: 'Not authorized to print this ticket' });
        return;
      }

      // Generate QR Code data URL
      const qrPayload = JSON.stringify({
        v: 1,
        tid: row.id,
        eid: row.event_id,
        code: row.ticket_code,
        sig: row.security_hash,
      });
      const qrDataUrl = await TicketService.generateQrDataUrl(qrPayload);

      // Convert to Ticket domain model for XML serialization
      const ticket: Ticket = {
        id: row.id,
        order_item_id: '',
        order_id: '',
        event_id: row.event_id,
        tier_id: '',
        ticket_code: row.ticket_code,
        security_hash: row.security_hash,
        status: row.status,
        used_at: row.used_at,
        created_at: row.created_at,
        attendee_name: row.attendee_name,
        attendee_email: row.attendee_email,
        attendee_phone: row.attendee_phone,
        unit_price_paise: row.unit_price_paise,
        tier_name: row.tier_name,
        event_title: row.event_title,
        event_start_time: new Date(row.event_start_time).toLocaleString('en-IN', {
          dateStyle: 'full',
          timeStyle: 'short',
        }),
        venue_name: row.venue_name,
        venue_city: row.venue_city,
        qr_code_data_url: qrDataUrl,
      };

      const ticketXml = XmlDomService.ticketToXml(ticket);
      const printableHtml = await XmlXsltService.transformTicketXml(ticketXml);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(printableHtml);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/organizer/events/:id/export-sax
   * High volume streaming ticket export via SAX
   */
  static async exportTicketsSax(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.params.id as string;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Verify event existence and authorization
      const eventRes = await db.query<{ id: string; organizer_id: string }>(
        'SELECT id, organizer_id FROM events WHERE id = $1',
        [eventId],
      );

      if (eventRes.rowCount === 0 || !eventRes.rows[0]) {
        res.status(404).json({ error: 'EVENT_NOT_FOUND', message: 'Event not found' });
        return;
      }

      if (userRole !== 'admin' && eventRes.rows[0].organizer_id !== userId) {
        res.status(403).json({ error: 'FORBIDDEN', message: 'Not authorized to export tickets for this event' });
        return;
      }

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="tickets-event-${eventId}.xml"`);

      await XmlSaxService.streamTicketsExport(eventId, res);
      res.end();
    } catch (err) {
      next(err);
    }
  }
}
