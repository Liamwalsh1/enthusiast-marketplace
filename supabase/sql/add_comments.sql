-- Enable pgcrypto for gen_random_uuid (safe to run multiple times)
create extension if not exists "pgcrypto";

-- ============================================
-- COMMENTS TABLE
-- ============================================
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) <= 2000),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for query performance
create index if not exists comments_listing_id_idx on public.comments (listing_id);
create index if not exists comments_parent_id_idx on public.comments (parent_id);
create index if not exists comments_user_id_idx on public.comments (user_id);
create index if not exists comments_created_at_idx on public.comments (created_at);

-- Enable RLS
alter table public.comments enable row level security;

-- RLS Policies for comments
drop policy if exists "Comments readable by everyone" on public.comments;
create policy "Comments readable by everyone"
  on public.comments
  for select
  using (true);

drop policy if exists "Comments insert by authenticated" on public.comments;
create policy "Comments insert by authenticated"
  on public.comments
  for insert
  with check (user_id = auth.uid());

drop policy if exists "Comments update by owner" on public.comments;
create policy "Comments update by owner"
  on public.comments
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Comments delete by owner" on public.comments;
create policy "Comments delete by owner"
  on public.comments
  for delete
  using (user_id = auth.uid());

-- ============================================
-- COMMENT FLAGS TABLE (for moderation)
-- ============================================
create table if not exists public.comment_flags (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  flagged_by uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) <= 500),
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(comment_id, flagged_by)
);

create index if not exists comment_flags_comment_id_idx on public.comment_flags (comment_id);
create index if not exists comment_flags_status_idx on public.comment_flags (status);

alter table public.comment_flags enable row level security;

-- RLS Policies for flags
-- Users can insert flags for comments they didn't write
drop policy if exists "Flags insert by authenticated" on public.comment_flags;
create policy "Flags insert by authenticated"
  on public.comment_flags
  for insert
  with check (flagged_by = auth.uid());

-- Users can see their own flags
drop policy if exists "Flags readable by flagger" on public.comment_flags;
create policy "Flags readable by flagger"
  on public.comment_flags
  for select
  using (flagged_by = auth.uid());

-- ============================================
-- USER ROLES TABLE (for admin moderation)
-- ============================================
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create index if not exists user_roles_user_id_idx on public.user_roles (user_id);

alter table public.user_roles enable row level security;

drop policy if exists "Roles readable by owner" on public.user_roles;
create policy "Roles readable by owner"
  on public.user_roles
  for select
  using (user_id = auth.uid());

-- ============================================
-- FUNCTION: Get comments with user emails
-- ============================================
create or replace function public.get_comments_with_users(p_listing_id uuid)
returns table (
  id uuid,
  listing_id uuid,
  user_id uuid,
  parent_id uuid,
  body text,
  is_deleted boolean,
  created_at timestamptz,
  updated_at timestamptz,
  user_email text
)
language sql
security definer
as $$
  select
    c.id,
    c.listing_id,
    c.user_id,
    c.parent_id,
    c.body,
    c.is_deleted,
    c.created_at,
    c.updated_at,
    u.email as user_email
  from public.comments c
  left join auth.users u on u.id = c.user_id
  where c.listing_id = p_listing_id
  order by c.created_at asc;
$$;
