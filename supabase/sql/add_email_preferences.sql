-- ============================================
-- EMAIL NOTIFICATION PREFERENCES
-- Add email notification settings to user_profiles
-- ============================================

-- Add email preference columns
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS email_messages boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_alerts boolean DEFAULT true;

-- Comment for documentation
COMMENT ON COLUMN public.user_profiles.email_messages IS 'Receive email notifications for new messages';
COMMENT ON COLUMN public.user_profiles.email_alerts IS 'Receive email notifications for search alert matches';

-- ============================================
-- FUNCTION: Get user email by ID
-- Secure function to get a user's email for notifications
-- Only callable by authenticated users for valid notification purposes
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_email(p_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT email FROM auth.users WHERE id = p_user_id;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_email(uuid) TO authenticated;
