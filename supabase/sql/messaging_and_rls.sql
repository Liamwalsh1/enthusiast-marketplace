-- Enable pgcrypto for gen_random_uuid (safe to run multiple times)
create extension if not exists "pgcrypto";

-- Listings ownership
alter table public.listings
  add column if not exists owner_id uuid references auth.users(id);

-- Backfill owner_id manually for existing rows before enforcing NOT NULL.
-- Example:
-- update public.listings set owner_id = '<some-user-uuid>' where owner_id is null;

alter table public.listings
  alter column owner_id set not null;

alter table public.listings enable row level security;

drop policy if exists "Public listings read" on public.listings;
create policy "Public listings read"
  on public.listings
  for select
  using (true);

drop policy if exists "Listings insert must match owner" on public.listings;
create policy "Listings insert must match owner"
  on public.listings
  for insert
  with check (owner_id = auth.uid());

drop policy if exists "Listings update by owner" on public.listings;
create policy "Listings update by owner"
  on public.listings
  for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Listings delete by owner" on public.listings;
create policy "Listings delete by owner"
  on public.listings
  for delete
  using (owner_id = auth.uid());

-- Threads + messages
create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references auth.users(id),
  seller_id uuid not null references auth.users(id),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Ensure inbox ordering works even if the column predates this script
alter table public.threads
  add column if not exists last_message_at timestamptz not null default now();

create index if not exists threads_listing_id_idx on public.threads (listing_id);
create index if not exists threads_participants_idx on public.threads (buyer_id, seller_id);
create index if not exists threads_last_message_at_idx on public.threads (last_message_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_thread_id_idx on public.messages (thread_id);

alter table public.threads enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Threads readable by participants" on public.threads;
create policy "Threads readable by participants"
  on public.threads
  for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists "Threads insert by participants" on public.threads;
create policy "Threads insert by participants"
  on public.threads
  for insert
  with check (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists "Threads update by participants" on public.threads;
create policy "Threads update by participants"
  on public.threads
  for update
  using (buyer_id = auth.uid() or seller_id = auth.uid())
  with check (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists "Threads delete by participants" on public.threads;
create policy "Threads delete by participants"
  on public.threads
  for delete
  using (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists "Messages readable by participants" on public.messages;
create policy "Messages readable by participants"
  on public.messages
  for select
  using (
    exists (
      select 1 from public.threads t
      where t.id = messages.thread_id
        and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    )
  );

drop policy if exists "Messages insert by participants" on public.messages;
create policy "Messages insert by participants"
  on public.messages
  for insert
  with check (
    exists (
      select 1 from public.threads t
      where t.id = messages.thread_id
        and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    )
  );

drop policy if exists "Messages delete by sender" on public.messages;
create policy "Messages delete by sender"
  on public.messages
  for delete
  using (sender_id = auth.uid());
