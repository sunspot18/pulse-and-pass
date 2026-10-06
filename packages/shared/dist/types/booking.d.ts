import type { OrderStatus, ReservationStatus } from '../constants/status.js';
import type { Ticket } from './ticket.js';
export interface Reservation {
    id: string;
    user_id: string;
    tier_id: string;
    quantity: number;
    status: ReservationStatus;
    expires_at: string;
    created_at: string;
    remaining_seconds?: number;
}
export interface OrderItem {
    id: string;
    order_id: string;
    tier_id: string;
    attendee_name: string;
    attendee_email: string;
    attendee_phone: string;
    unit_price_paise: number;
    created_at: string;
}
export interface Order {
    id: string;
    order_number: string;
    user_id: string;
    event_id: string;
    reservation_id: string;
    total_amount_paise: number;
    status: OrderStatus;
    payment_method: string;
    payment_ref?: string | null;
    created_at: string;
    items?: OrderItem[];
    tickets?: Ticket[];
    event_title?: string;
}
//# sourceMappingURL=booking.d.ts.map