-- Add featured listings columns to listings table
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_at timestamptz;

-- Index for fast homepage query
CREATE INDEX IF NOT EXISTS idx_listings_featured
  ON listings (is_featured, status)
  WHERE is_featured = true AND status = 'active';
