-- Admin policies for user management and content moderation

-- Allow admins to read all user roles
drop policy if exists "Admins can read all roles" on public.user_roles;
create policy "Admins can read all roles"
  on public.user_roles
  for select
  using (public.is_admin(auth.uid()));

-- Allow admins to insert/update user roles
drop policy if exists "Admins can manage roles" on public.user_roles;
create policy "Admins can manage roles"
  on public.user_roles
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Allow admins to read all comment flags
drop policy if exists "Admins can read all flags" on public.comment_flags;
create policy "Admins can read all flags"
  on public.comment_flags
  for select
  using (public.is_admin(auth.uid()));

-- Allow admins to update comment flags (for reviewing)
drop policy if exists "Admins can update flags" on public.comment_flags;
create policy "Admins can update flags"
  on public.comment_flags
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Allow admins to delete comments (for moderation)
drop policy if exists "Admins can delete any comment" on public.comments;
create policy "Admins can delete any comment"
  on public.comments
  for delete
  using (public.is_admin(auth.uid()));

-- Allow admins to update any comment (for soft delete via is_deleted)
drop policy if exists "Admins can update any comment" on public.comments;
create policy "Admins can update any comment"
  on public.comments
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Function to get users with their profiles and roles (admin only)
create or replace function public.get_users_for_admin()
returns table (
  user_id uuid,
  email text,
  created_at timestamptz,
  display_name text,
  location text,
  role text,
  listing_count bigint
)
language sql
security definer
as $$
  select
    u.id as user_id,
    u.email,
    u.created_at,
    p.display_name,
    p.location,
    coalesce(r.role, 'user') as role,
    (select count(*) from public.listings l where l.owner_id = u.id) as listing_count
  from auth.users u
  left join public.user_profiles p on p.user_id = u.id
  left join public.user_roles r on r.user_id = u.id
  order by u.created_at desc;
$$;

-- Function to get flagged comments with details (admin only)
create or replace function public.get_flagged_comments_for_admin()
returns table (
  flag_id uuid,
  comment_id uuid,
  comment_body text,
  comment_user_id uuid,
  comment_user_email text,
  comment_is_deleted boolean,
  listing_id uuid,
  listing_title text,
  flag_reason text,
  flag_status text,
  flagged_by uuid,
  flagger_email text,
  flagged_at timestamptz
)
language sql
security definer
as $$
  select
    f.id as flag_id,
    c.id as comment_id,
    c.body as comment_body,
    c.user_id as comment_user_id,
    cu.email as comment_user_email,
    c.is_deleted as comment_is_deleted,
    l.id as listing_id,
    l.title as listing_title,
    f.reason as flag_reason,
    f.status as flag_status,
    f.flagged_by,
    fu.email as flagger_email,
    f.created_at as flagged_at
  from public.comment_flags f
  join public.comments c on c.id = f.comment_id
  join public.listings l on l.id = c.listing_id
  left join auth.users cu on cu.id = c.user_id
  left join auth.users fu on fu.id = f.flagged_by
  where f.status = 'pending'
  order by f.created_at asc;
$$;
