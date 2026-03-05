-- ============================================
-- EXTEND SEARCH ALERTS FOR WHEELS & MILEAGE
-- Adds support for wheels category and additional filter fields
-- ============================================

-- Update category check constraint to include 'wheels'
ALTER TABLE public.search_alerts
  DROP CONSTRAINT IF EXISTS search_alerts_category_check;

ALTER TABLE public.search_alerts
  ADD CONSTRAINT search_alerts_category_check
  CHECK (category IN ('car', 'part', 'memorabilia', 'wheels') OR category IS NULL);

-- Add mileage range filters (for cars)
ALTER TABLE public.search_alerts
  ADD COLUMN IF NOT EXISTS mileage_min integer,
  ADD COLUMN IF NOT EXISTS mileage_max integer;

-- Add wheel-specific filters
ALTER TABLE public.search_alerts
  ADD COLUMN IF NOT EXISTS wheel_brand text,
  ADD COLUMN IF NOT EXISTS wheel_diameter numeric,
  ADD COLUMN IF NOT EXISTS bolt_pattern text;

-- Add search text filter (for keyword searches)
ALTER TABLE public.search_alerts
  ADD COLUMN IF NOT EXISTS search_text text;
