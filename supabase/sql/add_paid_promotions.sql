-- Add paid promotion columns to listings
-- boosted_until: when boost expires (listing ranks higher in browse)
-- featured_until: when paid featured expires (appears on homepage)

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS boosted_until timestamptz,
  ADD COLUMN IF NOT EXISTS featured_until timestamptz;

-- Index for browse page ordering (boosted listings first)
CREATE INDEX IF NOT EXISTS idx_listings_boosted
  ON listings (boosted_until DESC NULLS LAST, created_at DESC)
  WHERE status = 'active';

-- Index for homepage featured query (simple index on the column)
CREATE INDEX IF NOT EXISTS idx_listings_featured_until
  ON listings (featured_until DESC NULLS LAST)
  WHERE status = 'active';

-- Comment for documentation
COMMENT ON COLUMN listings.boosted_until IS 'When paid boost expires - listing ranks higher in browse/search until this date';
COMMENT ON COLUMN listings.featured_until IS 'When paid featured expires - listing appears on homepage until this date';
