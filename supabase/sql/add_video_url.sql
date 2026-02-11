-- Add video_url column to listings table
-- Videos are stored as a single URL (one video per listing max)
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN public.listings.video_url IS 'Optional video URL for walkaround/overview video';
