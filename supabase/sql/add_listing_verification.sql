-- Listing Verification: Admin approval workflow for listings
-- Extends the existing status field to support pending/rejected states
-- and adds review tracking fields

-- Add new columns for verification tracking
alter table public.listings
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text;

-- Update existing listings to 'active' status (they're already live, so approved)
-- New listings will default to 'pending' (handled in app code)

-- Note: The status field already exists from add_listings_status.sql
-- Valid statuses are now: 'pending', 'active', 'rejected', 'sold'

-- Create an index for efficient admin queries on pending listings
create index if not exists idx_listings_status on public.listings(status);

-- Update RLS policies to allow admins to update any listing status

-- First, create a helper function to check if user is admin
create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_roles.user_id = $1
    and role = 'admin'
  );
$$;

-- Drop existing update policy if it exists and recreate with admin support
drop policy if exists "Owners can update own listings" on public.listings;

create policy "Owners or admins can update listings"
  on public.listings for update
  using (
    owner_id = auth.uid()
    or public.is_admin(auth.uid())
  )
  with check (
    owner_id = auth.uid()
    or public.is_admin(auth.uid())
  );

-- Update the select policy to handle visibility based on status
-- Public can only see active/sold listings, owners can see their own pending/rejected
drop policy if exists "Public can read all listings" on public.listings;

create policy "Public can read active/sold listings, owners see all their own"
  on public.listings for select
  using (
    status in ('active', 'sold')
    or owner_id = auth.uid()
    or public.is_admin(auth.uid())
  );
