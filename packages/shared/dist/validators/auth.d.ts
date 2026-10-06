import { z } from 'zod';
export declare const EMAIL_REGEX: RegExp;
export declare const INDIAN_PHONE_REGEX: RegExp;
export declare const passwordSchema: z.ZodString;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodString;
    phone: z.ZodString;
    password: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["attendee", "organizer", "admin"]>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    phone: string;
    role: "attendee" | "organizer" | "admin";
    password: string;
}, {
    email: string;
    name: string;
    phone: string;
    password: string;
    role?: "attendee" | "organizer" | "admin" | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
//# sourceMappingURL=auth.d.ts.map