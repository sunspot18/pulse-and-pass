import { z } from 'zod';

export const verifyCheckinSchema = z.object({
  qr_payload: z.string().min(10, 'QR payload is required'),
  event_id: z.string().uuid('Event ID is required'),
  device_info: z.string().optional().default('Web Barcode Scanner'),
});

export type VerifyCheckinInput = z.infer<typeof verifyCheckinSchema>;
