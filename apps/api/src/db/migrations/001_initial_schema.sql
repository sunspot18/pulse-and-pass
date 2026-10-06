-- 001_initial_schema.sql: Core Relational Tables & Invariant Constraints

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'attendee' CHECK (role IN ('attendee', 'organizer', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Venues Table
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    doors_open_time TIMESTAMPTZ,
    age_restriction VARCHAR(50) DEFAULT 'All Ages',
    banner_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ticket Tiers Table (Strict capacity and sold check)
CREATE TABLE IF NOT EXISTS ticket_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_paise INT NOT NULL CHECK (price_paise >= 0),
    capacity INT NOT NULL CHECK (capacity > 0),
    sold INT NOT NULL DEFAULT 0 CHECK (sold >= 0 AND sold <= capacity),
    sales_start TIMESTAMPTZ NOT NULL,
    sales_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reservations Table (Atomic 5-minute hold)
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES ticket_tiers(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(32) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT UNIQUE,
    total_amount_paise INT NOT NULL CHECK (total_amount_paise >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'refunded')),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'SIMULATED_UPI',
    payment_ref VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Items Table (One per allocated seat)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES ticket_tiers(id) ON DELETE RESTRICT,
    attendee_name VARCHAR(120) NOT NULL,
    attendee_email VARCHAR(255) NOT NULL,
    attendee_phone VARCHAR(20) NOT NULL,
    unit_price_paise INT NOT NULL CHECK (unit_price_paise >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tickets Table (Cryptographically signed pass)
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE UNIQUE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    tier_id UUID NOT NULL REFERENCES ticket_tiers(id) ON DELETE RESTRICT,
    ticket_code VARCHAR(64) NOT NULL UNIQUE,
    security_hash VARCHAR(128) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'void')),
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Gate Check-in Audit Table
CREATE TABLE IF NOT EXISTS checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    scanned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'ALREADY_USED', 'INVALID', 'WRONG_EVENT')),
    scan_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_info TEXT,
    notes TEXT
);

-- System Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    payload JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
