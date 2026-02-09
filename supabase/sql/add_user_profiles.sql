-- User profiles table for extended user information
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name text,
  bio text,
  location text,
  social_link text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles (for showing seller info, comment authors, etc.)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.user_profiles
  FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON public.user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Function to auto-create profile on user signup (optional - can be enabled)
-- This creates a basic profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile (uncomment to enable)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Get comments with user emails AND display names
-- (Updates the existing function to include profile info)
-- ============================================
-- Drop existing function first since we're changing return type
DROP FUNCTION IF EXISTS public.get_comments_with_users(uuid);

CREATE OR REPLACE FUNCTION public.get_comments_with_users(p_listing_id uuid)
RETURNS TABLE (
  id uuid,
  listing_id uuid,
  user_id uuid,
  parent_id uuid,
  body text,
  is_deleted boolean,
  created_at timestamptz,
  updated_at timestamptz,
  user_email text,
  display_name text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    c.id,
    c.listing_id,
    c.user_id,
    c.parent_id,
    c.body,
    c.is_deleted,
    c.created_at,
    c.updated_at,
    u.email AS user_email,
    p.display_name
  FROM public.comments c
  LEFT JOIN auth.users u ON u.id = c.user_id
  LEFT JOIN public.user_profiles p ON p.user_id = c.user_id
  WHERE c.listing_id = p_listing_id
  ORDER BY c.created_at ASC;
$$;
