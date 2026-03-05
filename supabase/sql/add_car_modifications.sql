-- Add modification columns to listings for cars
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS is_modified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS modifications text[] DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN listings.is_modified IS 'Whether the car has been modified from stock';
COMMENT ON COLUMN listings.modifications IS 'Array of modification descriptions';
