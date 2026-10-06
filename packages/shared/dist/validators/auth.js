import { z } from 'zod';
import { ROLES } from '../constants/roles.js';
// RFC 5322 standard compliant email regex
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
// 10-digit Indian mobile number format (starts with 6, 7, 8, or 9)
export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter')
    .regex(/[0-9]/, 'Password must include at least one digit')
    .regex(/[^A-Za-z0-9]/, 'Password must include at least one special character');
export const registerSchema = z.object({
    email: z.string().trim().toLowerCase().regex(EMAIL_REGEX, 'Please provide a valid email address'),
    name: z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name cannot exceed 100 characters'),
    phone: z
        .string()
        .trim()
        .regex(INDIAN_PHONE_REGEX, 'Phone must be a valid 10-digit Indian mobile number (e.g. 9876543210)'),
    password: passwordSchema,
    role: z.enum(ROLES).default('attendee'),
});
export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().regex(EMAIL_REGEX, 'Please provide a valid email address'),
    password: z.string().min(1, 'Password is required'),
});
