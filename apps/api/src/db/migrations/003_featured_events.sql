-- 003_featured_events.sql: Add is_featured flag for promotional hero carousel & homepage spotlighting
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_events_featured ON events(is_featured);
