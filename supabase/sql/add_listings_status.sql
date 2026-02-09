-- Adds a status column so seller controls can mark items sold/active
alter table public.listings
  add column if not exists status text not null default 'active';
