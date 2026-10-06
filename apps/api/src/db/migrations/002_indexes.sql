-- 002_indexes.sql: Performance & Search Indexes

-- Events indexes for discovery filters
CREATE INDEX IF NOT EXISTS idx_events_status_start_time ON events (status, start_time);
CREATE INDEX IF NOT EXISTS idx_events_category ON events (category);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events (organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_venue_id ON events (venue_id);

-- Venues city index
CREATE INDEX IF NOT EXISTS idx_venues_city ON venues (city);

-- Ticket Tiers
CREATE INDEX IF NOT EXISTS idx_ticket_tiers_event_id ON ticket_tiers (event_id);

-- Reservations index for hold expiry sweeps
CREATE INDEX IF NOT EXISTS idx_reservations_status_expires_at ON reservations (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations (user_id);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_event_id ON orders (event_id);

-- Order Items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

-- Tickets code lookup & gate verification
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON tickets (ticket_code);
CREATE INDEX IF NOT EXISTS idx_tickets_order_id ON tickets (order_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets (event_id);

-- Checkins scan log lookup
CREATE INDEX IF NOT EXISTS idx_checkins_event_id ON checkins (event_id);
CREATE INDEX IF NOT EXISTS idx_checkins_ticket_id ON checkins (ticket_id);
