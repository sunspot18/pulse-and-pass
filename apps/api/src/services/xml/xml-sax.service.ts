import sax from 'sax';
import type { Writable, Readable } from 'stream';
import { db } from '../../config/db.js';
import { AppError } from '../../utils/errors.js';

interface TicketExportRow {
  id: string;
  ticket_code: string;
  security_hash: string;
  status: string;
  created_at: string;
  used_at: string | null;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  unit_price_paise: number;
  tier_name: string;
  order_number: string;
}

export class XmlSaxService {
  /**
   * Helper to write a chunk to a writable stream respecting backpressure
   */
  private static async writeChunk(stream: Writable, data: string): Promise<void> {
    if (!stream.write(data)) {
      await new Promise<void>((resolve) => stream.once('drain', resolve));
    }
  }

  /**
   * Helper to escape XML special characters
   */
  static escapeXml(str: string | null | undefined): string {
    if (str === null || str === undefined) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Streams ticket records for an event as XML directly into an HTTP response stream
   * using chunked output to handle high volumes with minimal memory overhead.
   */
  static async streamTicketsExport(
    eventId: string,
    outputStream: Writable,
  ): Promise<number> {
    // 1. Verify event exists
    const eventRes = await db.query<{ id: string; title: string; slug: string }>(
      'SELECT id, title, slug FROM events WHERE id = $1',
      [eventId],
    );

    if (eventRes.rowCount === 0 || !eventRes.rows[0]) {
      throw new AppError('Event not found for ticket export', 404, 'EVENT_NOT_FOUND');
    }

    const event = eventRes.rows[0];

    // 2. Write XML Declaration and Root Start Tag
    await this.writeChunk(
      outputStream,
      `<?xml version="1.0" encoding="UTF-8"?>\n<ticket_export event_id="${this.escapeXml(event.id)}" event_title="${this.escapeXml(event.title)}" event_slug="${this.escapeXml(event.slug)}" exported_at="${new Date().toISOString()}">\n  <tickets>\n`,
    );

    // 3. Query all tickets for this event
    const querySql = `
      SELECT t.id, t.ticket_code, t.security_hash, t.status, t.created_at, t.used_at,
             oi.attendee_name, oi.attendee_email, oi.attendee_phone, oi.unit_price_paise,
             tt.name as tier_name,
             o.order_number
      FROM tickets t
      JOIN order_items oi ON t.order_item_id = oi.id
      JOIN orders o ON t.order_id = o.id
      JOIN ticket_tiers tt ON t.tier_id = tt.id
      WHERE t.event_id = $1
      ORDER BY t.created_at ASC;
    `;

    const ticketsRes = await db.query<TicketExportRow>(querySql, [eventId]);
    let ticketCount = 0;

    for (const row of ticketsRes.rows) {
      ticketCount++;
      const ticketXml =
        `    <ticket id="${this.escapeXml(row.id)}">\n` +
        `      <ticket_code>${this.escapeXml(row.ticket_code)}</ticket_code>\n` +
        `      <security_hash>${this.escapeXml(row.security_hash)}</security_hash>\n` +
        `      <status>${this.escapeXml(row.status)}</status>\n` +
        `      <tier>${this.escapeXml(row.tier_name)}</tier>\n` +
        `      <unit_price_paise currency="INR">${row.unit_price_paise}</unit_price_paise>\n` +
        `      <order_number>${this.escapeXml(row.order_number)}</order_number>\n` +
        `      <attendee>\n` +
        `        <name>${this.escapeXml(row.attendee_name)}</name>\n` +
        `        <email>${this.escapeXml(row.attendee_email)}</email>\n` +
        `        <phone>${this.escapeXml(row.attendee_phone ?? '')}</phone>\n` +
        `      </attendee>\n` +
        `      <created_at>${this.escapeXml(row.created_at)}</created_at>\n` +
        (row.used_at ? `      <used_at>${this.escapeXml(row.used_at)}</used_at>\n` : '') +
        `    </ticket>\n`;

      await this.writeChunk(outputStream, ticketXml);
    }

    // 4. Write Root End Tag
    await this.writeChunk(
      outputStream,
      `  </tickets>\n  <summary total_tickets="${ticketCount}"/>\n</ticket_export>\n`,
    );

    return ticketCount;
  }

  /**
   * Validates an incoming XML stream using SAX event-driven parsing
   */
  static async validateXmlStream(
    readableStream: Readable,
  ): Promise<{ valid: boolean; elementCount: number; errors: string[] }> {
    return new Promise((resolve) => {
      const saxStream = sax.createStream(true, {
        trim: true,
        normalize: true,
        lowercase: true,
      });

      let elementCount = 0;
      const errors: string[] = [];

      saxStream.on('opentag', () => {
        elementCount++;
      });

      saxStream.on('error', (err: Error) => {
        errors.push(err.message);
        // Clear sax internal error so stream doesn't crash
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (saxStream as any)._parser.error = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (saxStream as any)._parser.resume();
      });

      saxStream.on('end', () => {
        resolve({
          valid: errors.length === 0,
          elementCount,
          errors,
        });
      });

      readableStream.pipe(saxStream);
    });
  }
}
