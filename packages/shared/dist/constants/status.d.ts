export declare const EVENT_STATUS: readonly ["draft", "published", "cancelled", "completed"];
export type EventStatus = (typeof EVENT_STATUS)[number];
export declare const TICKET_STATUS: readonly ["valid", "used", "void"];
export type TicketStatus = (typeof TICKET_STATUS)[number];
export declare const RESERVATION_STATUS: readonly ["active", "completed", "expired", "cancelled"];
export type ReservationStatus = (typeof RESERVATION_STATUS)[number];
export declare const ORDER_STATUS: readonly ["confirmed", "cancelled", "refunded"];
export type OrderStatus = (typeof ORDER_STATUS)[number];
export declare const CHECKIN_STATUS: readonly ["SUCCESS", "ALREADY_USED", "INVALID", "WRONG_EVENT"];
export type CheckinStatus = (typeof CHECKIN_STATUS)[number];
//# sourceMappingURL=status.d.ts.map