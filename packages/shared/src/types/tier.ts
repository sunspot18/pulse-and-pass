export interface TicketTier {
  id: string;
  event_id: string;
  name: string;
  description?: string | null;
  price_paise: number;
  capacity: number;
  sold: number;
  sales_start: string;
  sales_end: string;
  created_at: string;
  updated_at: string;
}

export interface TicketTierWithAvailability extends TicketTier {
  available: number;
  is_sold_out: boolean;
}
