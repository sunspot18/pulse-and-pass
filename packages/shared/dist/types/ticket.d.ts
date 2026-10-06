import type { CheckinStatus, TicketStatus } from '../constants/status.js';
export interface Ticket {
    id: string;
    order_item_id: string;
    order_id: string;
    event_id: string;
    tier_id: string;
    ticket_code: string;
    security_hash: string;
    status: TicketStatus;
    used_at?: string | null;
    created_at: string;
    attendee_name?: string;
    attendee_email?: string;
    attendee_phone?: string | null;
    event_title?: string;
    event_start_time?: string;
    venue_name?: string;
    venue_city?: string;
    tier_name?: string;
    unit_price_paise?: number;
    qr_code_data_url?: string;
}
export interface CheckinRecord {
    id: string;
    ticket_id: string;
    event_id: string;
    scanned_by: string;
    status: CheckinStatus;
    scan_timestamp: string;
    device_info?: string | null;
    notes?: string | null;
    attendee_name?: string;
    tier_name?: string;
    scanner_name?: string;
}
//# sourceMappingURL=ticket.d.ts.map