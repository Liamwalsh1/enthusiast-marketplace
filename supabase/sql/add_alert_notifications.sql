-- ============================================
-- ALERT NOTIFICATIONS TABLE
-- Track which alerts have been notified about which listings
-- Prevents duplicate notifications
-- ============================================

CREATE TABLE IF NOT EXISTS public.alert_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.search_alerts(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  notified_at timestamptz NOT NULL DEFAULT now(),
  -- Track notification method (for future email vs push vs in-app)
  notification_type text NOT NULL DEFAULT 'in_app' CHECK (notification_type IN ('in_app', 'email')),
  UNIQUE(alert_id, listing_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_alert_notifications_alert_id ON public.alert_notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_listing_id ON public.alert_notifications(listing_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_notified_at ON public.alert_notifications(notified_at);

-- Enable RLS
ALTER TABLE public.alert_notifications ENABLE ROW LEVEL SECURITY;

-- Users can see notifications for their own alerts
DROP POLICY IF EXISTS "Users can view own alert notifications" ON public.alert_notifications;
CREATE POLICY "Users can view own alert notifications"
  ON public.alert_notifications
  FOR SELECT
  TO authenticated
  USING (
    alert_id IN (
      SELECT id FROM public.search_alerts WHERE user_id = auth.uid()
    )
  );

-- System can insert notifications (via service role)
-- Users cannot directly insert - only the backend can
DROP POLICY IF EXISTS "Service can insert notifications" ON public.alert_notifications;
CREATE POLICY "Service can insert notifications"
  ON public.alert_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    alert_id IN (
      SELECT id FROM public.search_alerts WHERE user_id = auth.uid()
    )
  );
