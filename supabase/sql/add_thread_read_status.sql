-- Track when each user last read each thread
-- This enables unread message indicators

CREATE TABLE IF NOT EXISTS public.thread_read_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(thread_id, user_id)
);

-- Enable RLS
ALTER TABLE public.thread_read_status ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own read status
CREATE POLICY "Users can view own read status"
  ON public.thread_read_status FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own read status"
  ON public.thread_read_status FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own read status"
  ON public.thread_read_status FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_thread_read_status_user_thread
  ON public.thread_read_status(user_id, thread_id);

CREATE INDEX IF NOT EXISTS idx_thread_read_status_thread
  ON public.thread_read_status(thread_id);
