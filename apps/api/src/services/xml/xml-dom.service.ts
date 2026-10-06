import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import type { EventDetail, Ticket } from '@pulsepass/shared';
import { AppError } from '../../utils/errors.js';

export interface ParsedVenue {
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  capacity: number;
}

export interface ParsedTier {
  name: string;
  description?: string;
  price_paise: number;
  capacity: number;
  sales_start?: string;
  sales_end?: string;
  currency?: string;
}

export interface ParsedEventManifest {
  title: string;
  slug: string;
  description: string;
  category: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  venue: ParsedVenue;
  tiers: ParsedTier[];
}

export class XmlDomService {
  /**
   * Helper to safely extract text content of a tag
   */
  private static getChildText(parent: Element | null | undefined, tagName: string): string {
    if (!parent) return '';
    const el = parent.getElementsByTagName(tagName)[0];
    return el?.textContent?.trim() ?? '';
  }

  /**
   * Serializes an EventDetail record to a valid Event Manifest XML document
   */
  static eventToXml(event: EventDetail): string {
    const doc = new DOMParser().parseFromString(
      '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE event SYSTEM "event.dtd">\n<event/>',
      'application/xml',
    );

    const root = doc.documentElement;
    root.setAttribute('version', '1.0');
    root.setAttribute('status', event.status || 'published');

    // Title
    const titleEl = doc.createElement('title');
    titleEl.textContent = event.title;
    root.appendChild(titleEl);

    // Slug
    const slugEl = doc.createElement('slug');
    slugEl.textContent = event.slug;
    root.appendChild(slugEl);

    // Description
    const descEl = doc.createElement('description');
    descEl.textContent = event.description;
    root.appendChild(descEl);

    // Category
    const catEl = doc.createElement('category');
    catEl.textContent = event.category;
    root.appendChild(catEl);

    // Venue
    const venueEl = doc.createElement('venue');
    const vName = doc.createElement('name');
    vName.textContent = event.venue.name;
    venueEl.appendChild(vName);

    const vAddr = doc.createElement('address');
    vAddr.textContent = event.venue.address;
    venueEl.appendChild(vAddr);

    const vCity = doc.createElement('city');
    vCity.textContent = event.venue.city;
    venueEl.appendChild(vCity);

    const vState = doc.createElement('state');
    vState.textContent = event.venue.state;
    venueEl.appendChild(vState);

    const vPostal = doc.createElement('postal_code');
    vPostal.textContent = event.venue.postal_code;
    venueEl.appendChild(vPostal);

    const vCap = doc.createElement('capacity');
    vCap.textContent = String(event.venue.capacity);
    venueEl.appendChild(vCap);

    root.appendChild(venueEl);

    // Tiers
    const tiersEl = doc.createElement('tiers');
    for (const tier of event.tiers) {
      const tierEl = doc.createElement('tier');
      tierEl.setAttribute('currency', 'INR');

      const tName = doc.createElement('name');
      tName.textContent = tier.name;
      tierEl.appendChild(tName);

      if (tier.description) {
        const tDesc = doc.createElement('description');
        tDesc.textContent = tier.description;
        tierEl.appendChild(tDesc);
      }

      const tPrice = doc.createElement('price_paise');
      tPrice.textContent = String(tier.price_paise);
      tierEl.appendChild(tPrice);

      const tCap = doc.createElement('capacity');
      tCap.textContent = String(tier.capacity);
      tierEl.appendChild(tCap);

      if (tier.sales_start) {
        const tStart = doc.createElement('sales_start');
        tStart.textContent = new Date(tier.sales_start).toISOString();
        tierEl.appendChild(tStart);
      }

      if (tier.sales_end) {
        const tEnd = doc.createElement('sales_end');
        tEnd.textContent = new Date(tier.sales_end).toISOString();
        tierEl.appendChild(tEnd);
      }

      tiersEl.appendChild(tierEl);
    }

    root.appendChild(tiersEl);

    const serializer = new XMLSerializer();
    return (
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<!DOCTYPE event SYSTEM "event.dtd">\n' +
      serializer.serializeToString(root)
    );
  }

  /**
   * Parses an Event Manifest XML document into typed objects
   */
  static parseEventXml(xmlContent: string): ParsedEventManifest {
    const parseErrors: string[] = [];
    const parser = new DOMParser({
      errorHandler: {
        warning: () => {},
        error: (msg: string) => {
          parseErrors.push(msg);
        },
        fatalError: (msg: string) => {
          parseErrors.push(msg);
        },
      },
    });

    const doc = parser.parseFromString(xmlContent, 'application/xml');

    if (parseErrors.length > 0) {
      throw new AppError(`Malformed XML: ${parseErrors.join('; ')}`, 400, 'XML_PARSE_ERROR');
    }

    const root = doc.documentElement;
    if (!root || root.nodeName !== 'event') {
      throw new AppError('Root element must be <event>', 400, 'XML_PARSE_ERROR');
    }

    const statusAttr = root.getAttribute('status');
    const validStatuses = ['draft', 'published', 'cancelled', 'completed'] as const;
    const status = validStatuses.includes(statusAttr as (typeof validStatuses)[number])
      ? (statusAttr as (typeof validStatuses)[number])
      : 'published';

    const title = this.getChildText(root, 'title');
    const slug = this.getChildText(root, 'slug');
    const description = this.getChildText(root, 'description');
    const category = this.getChildText(root, 'category');

    if (!title || !slug || !description || !category) {
      throw new AppError(
        'Event manifest is missing required fields (title, slug, description, or category)',
        400,
        'XML_VALIDATION_ERROR',
      );
    }

    // Venue element
    const venueNode = root.getElementsByTagName('venue')[0];
    if (!venueNode) {
      throw new AppError('Event manifest missing <venue> element', 400, 'XML_VALIDATION_ERROR');
    }

    const vName = this.getChildText(venueNode, 'name');
    const vAddr = this.getChildText(venueNode, 'address');
    const vCity = this.getChildText(venueNode, 'city');
    const vState = this.getChildText(venueNode, 'state');
    const vPostal = this.getChildText(venueNode, 'postal_code');
    const vCapStr = this.getChildText(venueNode, 'capacity');
    const vCap = parseInt(vCapStr, 10);

    if (!vName || !vAddr || !vCity || !vState || !vPostal || Number.isNaN(vCap) || vCap <= 0) {
      throw new AppError(
        'Invalid or incomplete <venue> specifications in XML',
        400,
        'XML_VALIDATION_ERROR',
      );
    }

    const venue: ParsedVenue = {
      name: vName,
      address: vAddr,
      city: vCity,
      state: vState,
      postal_code: vPostal,
      capacity: vCap,
    };

    // Tiers element
    const tiersNode = root.getElementsByTagName('tiers')[0];
    if (!tiersNode) {
      throw new AppError('Event manifest missing <tiers> element', 400, 'XML_VALIDATION_ERROR');
    }

    const tierNodes = Array.from(tiersNode.getElementsByTagName('tier'));
    if (tierNodes.length === 0) {
      throw new AppError('At least one <tier> is required', 400, 'XML_VALIDATION_ERROR');
    }

    const tiers: ParsedTier[] = [];
    for (let i = 0; i < tierNodes.length; i++) {
      const tNode = tierNodes[i];
      if (!tNode) continue;

      const tName = this.getChildText(tNode, 'name');
      const tDesc = this.getChildText(tNode, 'description') || undefined;
      const tPriceStr = this.getChildText(tNode, 'price_paise');
      const tCapStr = this.getChildText(tNode, 'capacity');
      const tStart = this.getChildText(tNode, 'sales_start') || undefined;
      const tEnd = this.getChildText(tNode, 'sales_end') || undefined;
      const currency = tNode.getAttribute('currency') || 'INR';

      const pricePaise = parseInt(tPriceStr, 10);
      const capacity = parseInt(tCapStr, 10);

      if (!tName || Number.isNaN(pricePaise) || pricePaise < 0 || Number.isNaN(capacity) || capacity <= 0) {
        throw new AppError(
          `Invalid tier configuration at index ${i}: name, valid price, and capacity > 0 required`,
          400,
          'XML_VALIDATION_ERROR',
        );
      }

      tiers.push({
        name: tName,
        description: tDesc,
        price_paise: pricePaise,
        capacity,
        sales_start: tStart,
        sales_end: tEnd,
        currency,
      });
    }

    return {
      title,
      slug,
      description,
      category,
      status,
      venue,
      tiers,
    };
  }

  /**
   * Generates Ticket XML for printable pass rendering
   */
  static ticketToXml(ticket: Ticket): string {
    const doc = new DOMParser().parseFromString('<ticket/>', 'application/xml');
    const root = doc.documentElement;

    const append = (tag: string, value: string | number | undefined | null) => {
      const el = doc.createElement(tag);
      el.textContent = value !== undefined && value !== null ? String(value) : '';
      root.appendChild(el);
    };

    append('ticket_code', ticket.ticket_code);
    append('security_hash', ticket.security_hash);
    append('status', ticket.status);
    append('attendee_name', ticket.attendee_name ?? 'Valued Guest');
    append('attendee_email', ticket.attendee_email ?? '');
    append('unit_price_paise', ticket.unit_price_paise ?? 0);
    append('tier_name', ticket.tier_name ?? 'General Admission');
    append('event_title', ticket.event_title ?? 'Pulse & Pass Event');
    append('event_start_time', ticket.event_start_time ?? '');
    append('venue_name', ticket.venue_name ?? 'Main Arena');
    append('venue_city', ticket.venue_city ?? '');
    append('qr_code_data_url', ticket.qr_code_data_url ?? '');

    const serializer = new XMLSerializer();
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(root);
  }
}
