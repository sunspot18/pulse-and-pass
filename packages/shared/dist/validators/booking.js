import { z } from 'zod';
import { EMAIL_REGEX, INDIAN_PHONE_REGEX } from './auth.js';
export const reservationHoldSchema = z.object({
    tier_id: z.string().uuid('Invalid ticket tier identifier'),
    quantity: z
        .number()
        .int('Quantity must be an integer')
        .min(1, 'You must book at least 1 ticket')
        .max(10, 'Maximum 10 tickets per single reservation hold'),
});
export const attendeeDetailSchema = z.object({
    name: z.string().trim().min(2, 'Attendee name must be at least 2 characters').max(100),
    email: z.string().trim().toLowerCase().regex(EMAIL_REGEX, 'Valid attendee email is required'),
    phone: z
        .string()
        .trim()
        .regex(INDIAN_PHONE_REGEX, 'Attendee phone must be a valid 10-digit Indian mobile number'),
});
export const checkoutSchema = z.object({
    reservation_id: z.string().uuid('Valid reservation ID is required'),
    attendees: z.array(attendeeDetailSchema).min(1, 'At least one attendee is required'),
    payment_method: z.string().default('SIMULATED_UPI'),
});
