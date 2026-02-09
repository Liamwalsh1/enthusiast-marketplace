-- ============================================
-- ADD CAR SPECIFICATION FIELDS TO LISTINGS
-- ============================================

-- Make (manufacturer) - e.g., "Porsche", "BMW", "Ford"
alter table public.listings
  add column if not exists make text;

-- Model - e.g., "911", "E30", "Mustang"
alter table public.listings
  add column if not exists model text;

-- Year of manufacture
alter table public.listings
  add column if not exists year integer check (year >= 1900 and year <= 2100);

-- Engine displacement in cc
alter table public.listings
  add column if not exists engine_cc integer check (engine_cc > 0);

-- Engine type - e.g., "Inline-4", "V6", "V8", "Flat-6", "Rotary"
alter table public.listings
  add column if not exists engine_type text;

-- Transmission type
alter table public.listings
  add column if not exists transmission text check (transmission in ('Manual', 'Automatic', 'Semi-Automatic', 'CVT', 'Other'));

-- Mileage in kilometers
alter table public.listings
  add column if not exists mileage_km integer check (mileage_km >= 0);

-- Vehicle Identification Number (VIN) - 17 characters for modern vehicles
alter table public.listings
  add column if not exists vin text check (char_length(vin) <= 17);

-- Indexes for common search/filter fields
create index if not exists listings_make_idx on public.listings (make);
create index if not exists listings_model_idx on public.listings (model);
create index if not exists listings_year_idx on public.listings (year);
create index if not exists listings_transmission_idx on public.listings (transmission);

-- Composite index for make + model searches
create index if not exists listings_make_model_idx on public.listings (make, model);
