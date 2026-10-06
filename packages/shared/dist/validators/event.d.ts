import { z } from 'zod';
export declare const createTierSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    price_paise: z.ZodNumber;
    capacity: z.ZodNumber;
    sales_start: z.ZodString;
    sales_end: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    price_paise: number;
    capacity: number;
    sales_start: string;
    sales_end: string;
    description?: string | undefined;
}, {
    name: string;
    price_paise: number;
    capacity: number;
    sales_start: string;
    sales_end: string;
    description?: string | undefined;
}>;
export declare const updateTierSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    price_paise: z.ZodOptional<z.ZodNumber>;
    capacity: z.ZodOptional<z.ZodNumber>;
    sales_start: z.ZodOptional<z.ZodString>;
    sales_end: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    price_paise?: number | undefined;
    capacity?: number | undefined;
    sales_start?: string | undefined;
    sales_end?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    price_paise?: number | undefined;
    capacity?: number | undefined;
    sales_start?: string | undefined;
    sales_end?: string | undefined;
}>;
export declare const createVenueSchema: z.ZodObject<{
    name: z.ZodString;
    address: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    postal_code: z.ZodString;
    capacity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    capacity: number;
    address: string;
    city: string;
    state: string;
    postal_code: string;
}, {
    name: string;
    capacity: number;
    address: string;
    city: string;
    state: string;
    postal_code: string;
}>;
export declare const createEventSchema: z.ZodObject<{
    venue_id: z.ZodOptional<z.ZodString>;
    venue: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        address: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        postal_code: z.ZodString;
        capacity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        capacity: number;
        address: string;
        city: string;
        state: string;
        postal_code: string;
    }, {
        name: string;
        capacity: number;
        address: string;
        city: string;
        state: string;
        postal_code: string;
    }>>;
    title: z.ZodString;
    description: z.ZodString;
    category: z.ZodString;
    start_time: z.ZodString;
    end_time: z.ZodString;
    doors_open_time: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    age_restriction: z.ZodDefault<z.ZodString>;
    banner_url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    tiers: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        price_paise: z.ZodNumber;
        capacity: z.ZodNumber;
        sales_start: z.ZodString;
        sales_end: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        price_paise: number;
        capacity: number;
        sales_start: string;
        sales_end: string;
        description?: string | undefined;
    }, {
        name: string;
        price_paise: number;
        capacity: number;
        sales_start: string;
        sales_end: string;
        description?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    description: string;
    title: string;
    category: string;
    start_time: string;
    end_time: string;
    age_restriction: string;
    tiers: {
        name: string;
        price_paise: number;
        capacity: number;
        sales_start: string;
        sales_end: string;
        description?: string | undefined;
    }[];
    venue_id?: string | undefined;
    venue?: {
        name: string;
        capacity: number;
        address: string;
        city: string;
        state: string;
        postal_code: string;
    } | undefined;
    doors_open_time?: string | null | undefined;
    banner_url?: string | null | undefined;
}, {
    description: string;
    title: string;
    category: string;
    start_time: string;
    end_time: string;
    tiers: {
        name: string;
        price_paise: number;
        capacity: number;
        sales_start: string;
        sales_end: string;
        description?: string | undefined;
    }[];
    venue_id?: string | undefined;
    venue?: {
        name: string;
        capacity: number;
        address: string;
        city: string;
        state: string;
        postal_code: string;
    } | undefined;
    doors_open_time?: string | null | undefined;
    age_restriction?: string | undefined;
    banner_url?: string | null | undefined;
}>;
export declare const updateEventSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    venue_id: z.ZodOptional<z.ZodString>;
    start_time: z.ZodOptional<z.ZodString>;
    end_time: z.ZodOptional<z.ZodString>;
    doors_open_time: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    age_restriction: z.ZodOptional<z.ZodString>;
    banner_url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    venue_id?: string | undefined;
    title?: string | undefined;
    category?: string | undefined;
    start_time?: string | undefined;
    end_time?: string | undefined;
    doors_open_time?: string | null | undefined;
    age_restriction?: string | undefined;
    banner_url?: string | null | undefined;
}, {
    description?: string | undefined;
    venue_id?: string | undefined;
    title?: string | undefined;
    category?: string | undefined;
    start_time?: string | undefined;
    end_time?: string | undefined;
    doors_open_time?: string | null | undefined;
    age_restriction?: string | undefined;
    banner_url?: string | null | undefined;
}>;
export declare const eventQuerySchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["draft", "published", "cancelled", "completed"]>>;
    date_from: z.ZodOptional<z.ZodString>;
    date_to: z.ZodOptional<z.ZodString>;
    min_price: z.ZodOptional<z.ZodNumber>;
    max_price: z.ZodOptional<z.ZodNumber>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: "draft" | "published" | "cancelled" | "completed" | undefined;
    city?: string | undefined;
    category?: string | undefined;
    search?: string | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
    min_price?: number | undefined;
    max_price?: number | undefined;
}, {
    status?: "draft" | "published" | "cancelled" | "completed" | undefined;
    city?: string | undefined;
    category?: string | undefined;
    search?: string | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
    min_price?: number | undefined;
    max_price?: number | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateTierInput = z.infer<typeof createTierSchema>;
export type EventQueryInput = z.infer<typeof eventQuerySchema>;
//# sourceMappingURL=event.d.ts.map