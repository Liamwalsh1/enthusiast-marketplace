-- Listing view tracking for seller analytics
-- Run this in your Supabase SQL editor

-- Table to track individual listing views
CREATE TABLE IF NOT EXISTS public.listing_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now() NOT NULL,
  -- Optional: track if viewer is authenticated
  is_authenticated boolean DEFAULT false
);

-- Index for fast lookups by listing
CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id ON public.listing_views(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_viewed_at ON public.listing_views(viewed_at);

-- Composite index for getting views per listing in a time range
CREATE INDEX IF NOT EXISTS idx_listing_views_listing_date ON public.listing_views(listing_id, viewed_at);

-- Add view_count column to listings for quick access (denormalized for performance)
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- Add save_count column to listings (count of saves/bookmarks)
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS save_count integer DEFAULT 0;

-- Add inquiry_count column to listings (count of message threads)
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS inquiry_count integer DEFAULT 0;

-- RLS policies for listing_views
ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a view (we track views for all visitors)
CREATE POLICY "Anyone can record a view"
  ON public.listing_views
  FOR INSERT
  WITH CHECK (true);

-- Only the listing owner can read views for their listings
CREATE POLICY "Listing owners can read their listing views"
  ON public.listing_views
  FOR SELECT
  USING (
    listing_id IN (
      SELECT id FROM public.listings WHERE owner_id = auth.uid()
    )
  );

-- Function to increment view count on listings table
CREATE OR REPLACE FUNCTION increment_listing_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.listings
  SET view_count = view_count + 1
  WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-increment view_count when a view is recorded
DROP TRIGGER IF EXISTS on_listing_view_increment ON public.listing_views;
CREATE TRIGGER on_listing_view_increment
  AFTER INSERT ON public.listing_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_listing_view_count();

-- Function to update save_count when saved_listings changes
CREATE OR REPLACE FUNCTION update_listing_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.listings
    SET save_count = save_count + 1
    WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.listings
    SET save_count = GREATEST(save_count - 1, 0)
    WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for save_count updates
DROP TRIGGER IF EXISTS on_saved_listing_change ON public.saved_listings;
CREATE TRIGGER on_saved_listing_change
  AFTER INSERT OR DELETE ON public.saved_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_save_count();

-- Function to update inquiry_count when threads are created
CREATE OR REPLACE FUNCTION update_listing_inquiry_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.listings
    SET inquiry_count = inquiry_count + 1
    WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.listings
    SET inquiry_count = GREATEST(inquiry_count - 1, 0)
    WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for inquiry_count updates (assuming threads table exists)
DROP TRIGGER IF EXISTS on_thread_change ON public.threads;
CREATE TRIGGER on_thread_change
  AFTER INSERT OR DELETE ON public.threads
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_inquiry_count();
