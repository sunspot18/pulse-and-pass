import { z } from 'zod';
export const createTierSchema = z.object({
    name: z.string().trim().min(2, 'Tier name is required').max(100),
    description: z.string().trim().max(500).optional(),
    price_paise: z
        .number()
        .int('Price must be an integer (in paise)')
        .min(0, 'Price cannot be negative'),
    capacity: z
        .number()
        .int('Capacity must be an integer')
        .min(1, 'Capacity must be at least 1 seat'),
    sales_start: z.string().datetime({ message: 'Invalid sales start timestamp' }),
    sales_end: z.string().datetime({ message: 'Invalid sales end timestamp' }),
});
export const updateTierSchema = createTierSchema.partial();
export const createVenueSchema = z.object({
    name: z.string().trim().min(2, 'Venue name is required').max(200),
    address: z.string().trim().min(5, 'Address is required'),
    city: z.string().trim().min(2, 'City is required').max(100),
    state: z.string().trim().min(2, 'State is required').max(100),
    postal_code: z.string().trim().min(3).max(20),
    capacity: z.number().int().min(1, 'Venue capacity must be at least 1'),
});
export const createEventSchema = z.object({
    venue_id: z.string().uuid().optional(),
    venue: createVenueSchema.optional(),
    title: z.string().trim().min(3, 'Event title must be at least 3 characters').max(255),
    description: z.string().trim().min(10, 'Event description must be at least 10 characters'),
    category: z.string().trim().min(2).max(50),
    start_time: z.string().datetime({ message: 'Invalid start time' }),
    end_time: z.string().datetime({ message: 'Invalid end time' }),
    doors_open_time: z.string().datetime().optional().nullable(),
    age_restriction: z.string().trim().max(50).default('All Ages'),
    banner_url: z.string().url().optional().nullable(),
    is_featured: z.boolean().default(false).optional(),
    tiers: z.array(createTierSchema).min(1, 'At least one ticket tier is required'),
});
export const updateEventSchema = z.object({
    title: z.string().trim().min(3).max(255).optional(),
    description: z.string().trim().min(10).optional(),
    category: z.string().trim().min(2).max(50).optional(),
    venue_id: z.string().uuid().optional(),
    start_time: z.string().datetime().optional(),
    end_time: z.string().datetime().optional(),
    doors_open_time: z.string().datetime().optional().nullable(),
    age_restriction: z.string().trim().max(50).optional(),
    banner_url: z.string().url().optional().nullable(),
    is_featured: z.boolean().optional(),
});
export const eventQuerySchema = z.object({
    search: z.string().optional(),
    city: z.string().optional(),
    category: z.string().optional(),
    status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    min_price: z.coerce.number().optional(),
    max_price: z.coerce.number().optional(),
    is_featured: z
        .preprocess((val) => {
        if (val === 'true' || val === true)
            return true;
        if (val === 'false' || val === false)
            return false;
        return undefined;
    }, z.boolean().optional()),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
});
