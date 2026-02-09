-- ============================================
-- ADD WHEEL SPECIFICATION FIELDS TO LISTINGS
-- For the "wheels" category
-- ============================================

-- Wheel diameter in inches (e.g., 15, 16, 17, 18, 19, 20)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS wheel_diameter numeric(4,1) CHECK (wheel_diameter >= 10 AND wheel_diameter <= 30);

-- Wheel width in inches (e.g., 7, 7.5, 8, 8.5, 9)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS wheel_width numeric(4,1) CHECK (wheel_width >= 3 AND wheel_width <= 16);

-- Bolt pattern (e.g., "5x114.3", "4x100", "5x120")
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS bolt_pattern text;

-- Offset in mm (ET value, can be negative)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS wheel_offset integer CHECK (wheel_offset >= -100 AND wheel_offset <= 100);

-- Center bore diameter in mm (for hub-centric fitment)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS center_bore numeric(5,2) CHECK (center_bore >= 50 AND center_bore <= 130);

-- Quantity of wheels
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS wheel_quantity integer CHECK (wheel_quantity >= 1 AND wheel_quantity <= 10);

-- Wheel brand (e.g., BBS, Enkei, Work, OZ Racing)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS wheel_brand text;

-- Wheel material type
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS wheel_material text CHECK (wheel_material IN ('Alloy', 'Steel', 'Forged', 'Carbon Fiber', 'Magnesium', 'Other'));

-- Wheel style/design name (e.g., "RS", "RPF1", "TE37")
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS wheel_style text;

-- Update category constraint to include 'wheels'
-- First, drop the existing constraint if it exists
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_category_check;

-- Add new constraint including 'wheels'
ALTER TABLE public.listings
  ADD CONSTRAINT listings_category_check
  CHECK (category IN ('car', 'part', 'memorabilia', 'wheels'));

-- Indexes for common wheel search/filter fields
CREATE INDEX IF NOT EXISTS listings_wheel_diameter_idx ON public.listings (wheel_diameter);
CREATE INDEX IF NOT EXISTS listings_wheel_width_idx ON public.listings (wheel_width);
CREATE INDEX IF NOT EXISTS listings_bolt_pattern_idx ON public.listings (bolt_pattern);
CREATE INDEX IF NOT EXISTS listings_wheel_brand_idx ON public.listings (wheel_brand);

-- Composite index for common wheel searches (size + bolt pattern)
CREATE INDEX IF NOT EXISTS listings_wheel_size_bolt_idx ON public.listings (wheel_diameter, wheel_width, bolt_pattern);
