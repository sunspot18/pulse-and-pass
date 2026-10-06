import type { EventStatus } from '../constants/status.js';
import type { TicketTierWithAvailability } from './tier.js';

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  capacity: number;
  created_at: string;
}

export interface Event {
  id: string;
  organizer_id: string;
  venue_id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: EventStatus;
  start_time: string;
  end_time: string;
  doors_open_time?: string | null;
  age_restriction?: string | null;
  banner_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventDetail extends Event {
  venue: Venue;
  tiers: TicketTierWithAvailability[];
  organizer_name?: string | null;
  min_price_paise?: number;
  max_price_paise?: number;
  is_sold_out?: boolean;
}
