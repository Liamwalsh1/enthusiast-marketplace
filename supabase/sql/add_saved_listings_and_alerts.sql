-- ============================================
-- SAVED LISTINGS TABLE
-- Users can save/bookmark listings for later
-- ============================================
CREATE TABLE IF NOT EXISTS public.saved_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_saved_listings_user_id ON public.saved_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_listings_listing_id ON public.saved_listings(listing_id);

-- Enable RLS
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;

-- Users can see their own saved listings
DROP POLICY IF EXISTS "Users can view own saved listings" ON public.saved_listings;
CREATE POLICY "Users can view own saved listings"
  ON public.saved_listings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can save listings
DROP POLICY IF EXISTS "Users can save listings" ON public.saved_listings;
CREATE POLICY "Users can save listings"
  ON public.saved_listings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can unsave listings
DROP POLICY IF EXISTS "Users can unsave listings" ON public.saved_listings;
CREATE POLICY "Users can unsave listings"
  ON public.saved_listings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================
-- SEARCH ALERTS TABLE
-- Users can create alerts for specific search criteria
-- ============================================
CREATE TABLE IF NOT EXISTS public.search_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) <= 100),
  -- Search criteria
  category text CHECK (category IN ('car', 'part', 'memorabilia') OR category IS NULL),
  make text,
  model text,
  year_min integer,
  year_max integer,
  price_min integer,
  price_max integer,
  location text,
  transmission text,
  -- Alert settings
  is_active boolean NOT NULL DEFAULT true,
  email_notifications boolean NOT NULL DEFAULT true,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_search_alerts_user_id ON public.search_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_search_alerts_is_active ON public.search_alerts(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.search_alerts ENABLE ROW LEVEL SECURITY;

-- Users can see their own alerts
DROP POLICY IF EXISTS "Users can view own alerts" ON public.search_alerts;
CREATE POLICY "Users can view own alerts"
  ON public.search_alerts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create alerts
DROP POLICY IF EXISTS "Users can create alerts" ON public.search_alerts;
CREATE POLICY "Users can create alerts"
  ON public.search_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own alerts
DROP POLICY IF EXISTS "Users can update own alerts" ON public.search_alerts;
CREATE POLICY "Users can update own alerts"
  ON public.search_alerts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own alerts
DROP POLICY IF EXISTS "Users can delete own alerts" ON public.search_alerts;
CREATE POLICY "Users can delete own alerts"
  ON public.search_alerts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_search_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS search_alerts_updated_at ON public.search_alerts;
CREATE TRIGGER search_alerts_updated_at
  BEFORE UPDATE ON public.search_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_search_alerts_updated_at();
