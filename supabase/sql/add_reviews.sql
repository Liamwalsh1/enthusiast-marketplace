-- ============================================
-- SELLER REVIEWS TABLE
-- Users can leave reviews for sellers after a transaction
-- ============================================
CREATE TABLE IF NOT EXISTS public.seller_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text CHECK (char_length(title) <= 100),
  body text CHECK (char_length(body) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Prevent duplicate reviews for same seller/listing combo
  UNIQUE(seller_id, reviewer_id, listing_id),
  -- Prevent self-reviews
  CHECK (seller_id != reviewer_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_seller_reviews_seller_id ON public.seller_reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_reviewer_id ON public.seller_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_listing_id ON public.seller_reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_rating ON public.seller_reviews(rating);

-- Enable RLS
ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews (public)
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.seller_reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON public.seller_reviews
  FOR SELECT
  USING (true);

-- Authenticated users can create reviews (but not for themselves)
DROP POLICY IF EXISTS "Users can create reviews" ON public.seller_reviews;
CREATE POLICY "Users can create reviews"
  ON public.seller_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_id AND auth.uid() != seller_id);

-- Users can update their own reviews
DROP POLICY IF EXISTS "Users can update own reviews" ON public.seller_reviews;
CREATE POLICY "Users can update own reviews"
  ON public.seller_reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- Users can delete their own reviews
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.seller_reviews;
CREATE POLICY "Users can delete own reviews"
  ON public.seller_reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = reviewer_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_seller_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS seller_reviews_updated_at ON public.seller_reviews;
CREATE TRIGGER seller_reviews_updated_at
  BEFORE UPDATE ON public.seller_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_reviews_updated_at();

-- ============================================
-- FUNCTION: Get seller stats (average rating, review count)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_seller_stats(p_seller_id uuid)
RETURNS TABLE (
  avg_rating numeric,
  review_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    ROUND(AVG(rating)::numeric, 1) AS avg_rating,
    COUNT(*) AS review_count
  FROM public.seller_reviews
  WHERE seller_id = p_seller_id;
$$;

-- ============================================
-- FUNCTION: Get reviews with reviewer info
-- ============================================
CREATE OR REPLACE FUNCTION public.get_seller_reviews_with_users(p_seller_id uuid)
RETURNS TABLE (
  id uuid,
  seller_id uuid,
  reviewer_id uuid,
  listing_id uuid,
  rating integer,
  title text,
  body text,
  created_at timestamptz,
  updated_at timestamptz,
  reviewer_email text,
  reviewer_display_name text,
  listing_title text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    r.id,
    r.seller_id,
    r.reviewer_id,
    r.listing_id,
    r.rating,
    r.title,
    r.body,
    r.created_at,
    r.updated_at,
    u.email AS reviewer_email,
    p.display_name AS reviewer_display_name,
    l.title AS listing_title
  FROM public.seller_reviews r
  LEFT JOIN auth.users u ON u.id = r.reviewer_id
  LEFT JOIN public.user_profiles p ON p.user_id = r.reviewer_id
  LEFT JOIN public.listings l ON l.id = r.listing_id
  WHERE r.seller_id = p_seller_id
  ORDER BY r.created_at DESC;
$$;
