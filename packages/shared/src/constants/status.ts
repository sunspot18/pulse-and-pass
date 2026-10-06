export const EVENT_STATUS = ['draft', 'published', 'cancelled', 'completed'] as const;
export type EventStatus = (typeof EVENT_STATUS)[number];

export const TICKET_STATUS = ['valid', 'used', 'void'] as const;
export type TicketStatus = (typeof TICKET_STATUS)[number];

export const RESERVATION_STATUS = ['active', 'completed', 'expired', 'cancelled'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUS)[number];

export const ORDER_STATUS = ['confirmed', 'cancelled', 'refunded'] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

export const CHECKIN_STATUS = ['SUCCESS', 'ALREADY_USED', 'INVALID', 'WRONG_EVENT'] as const;
export type CheckinStatus = (typeof CHECKIN_STATUS)[number];
