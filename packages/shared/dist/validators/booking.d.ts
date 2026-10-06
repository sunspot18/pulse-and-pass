import { z } from 'zod';
export declare const reservationHoldSchema: z.ZodObject<{
    tier_id: z.ZodString;
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    tier_id: string;
    quantity: number;
}, {
    tier_id: string;
    quantity: number;
}>;
export declare const attendeeDetailSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    phone: string;
}, {
    email: string;
    name: string;
    phone: string;
}>;
export declare const checkoutSchema: z.ZodObject<{
    reservation_id: z.ZodString;
    attendees: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        phone: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        name: string;
        phone: string;
    }, {
        email: string;
        name: string;
        phone: string;
    }>, "many">;
    payment_method: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reservation_id: string;
    attendees: {
        email: string;
        name: string;
        phone: string;
    }[];
    payment_method: string;
}, {
    reservation_id: string;
    attendees: {
        email: string;
        name: string;
        phone: string;
    }[];
    payment_method?: string | undefined;
}>;
export type ReservationHoldInput = z.infer<typeof reservationHoldSchema>;
export type AttendeeDetailInput = z.infer<typeof attendeeDetailSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
//# sourceMappingURL=booking.d.ts.map