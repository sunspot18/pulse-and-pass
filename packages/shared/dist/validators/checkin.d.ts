import { z } from 'zod';
export declare const verifyCheckinSchema: z.ZodObject<{
    qr_payload: z.ZodString;
    event_id: z.ZodString;
    device_info: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    qr_payload: string;
    event_id: string;
    device_info: string;
}, {
    qr_payload: string;
    event_id: string;
    device_info?: string | undefined;
}>;
export type VerifyCheckinInput = z.infer<typeof verifyCheckinSchema>;
//# sourceMappingURL=checkin.d.ts.map