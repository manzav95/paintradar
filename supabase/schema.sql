-- PaintRadar lead intelligence schema
-- Apply in the Supabase SQL editor.

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  home_city text not null default 'Brentwood',
  home_state text not null default 'CA',
  home_latitude double precision,
  home_longitude double precision,
  default_radius integer not null default 50,
  minimum_lead_score numeric not null default 0.55,
  notification_preferences jsonb not null default '{}'::jsonb,
  theme text not null default 'dark',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.settings add column if not exists home_state text not null default 'CA';
alter table public.settings add column if not exists home_latitude double precision;
alter table public.settings add column if not exists home_longitude double precision;
alter table public.settings add column if not exists minimum_lead_score numeric not null default 0.55;
alter table public.settings add column if not exists updated_at timestamptz not null default now();

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_post_id text,
  source_url text,
  customer_name text not null,
  title text not null,
  raw_text text,
  description text not null,
  city text not null,
  state text not null default 'CA',
  latitude double precision,
  longitude double precision,
  distance_miles numeric,
  category text not null,
  urgency text not null,
  intent text,
  confidence numeric,
  estimated_value_low integer,
  estimated_value_high integer,
  score integer not null default 0,
  status text not null default 'new',
  posted_at timestamptz not null,
  detected_at timestamptz not null default now(),
  has_photos boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads add column if not exists raw_text text;
alter table public.leads add column if not exists intent text;
alter table public.leads add column if not exists confidence numeric;
alter table public.leads add column if not exists source_url text;

create unique index if not exists leads_source_post_unique
  on public.leads (source, source_post_id)
  where source_post_id is not null;

create index if not exists leads_posted_at_idx on public.leads (posted_at desc);
create index if not exists leads_detected_at_idx on public.leads (detected_at desc);
create index if not exists leads_city_idx on public.leads (city);
create index if not exists leads_score_idx on public.leads (score desc);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_source_url_idx on public.leads (source_url);

create table if not exists public.lead_photos (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_activity (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text not null,
  enabled boolean not null default false,
  last_scan timestamptz,
  last_success timestamptz,
  last_error text,
  posts_checked integer not null default 0,
  qualified_leads integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source text,
  keywords text[] not null default '{}',
  excluded_keywords text[] not null default '{}',
  categories text[] not null default '{}',
  radius integer not null default 25,
  minimum_score integer not null default 0,
  enabled boolean not null default true,
  notification_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.saved_searches add column if not exists source text;

alter table public.settings enable row level security;
alter table public.leads enable row level security;
alter table public.lead_photos enable row level security;
alter table public.lead_notes enable row level security;
alter table public.lead_activity enable row level security;
alter table public.lead_sources enable row level security;
alter table public.saved_searches enable row level security;

drop policy if exists "dev read leads" on public.leads;
drop policy if exists "dev write leads" on public.leads;
create policy "dev read leads" on public.leads for select to anon, authenticated using (true);
create policy "dev write leads" on public.leads for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev read photos" on public.lead_photos;
drop policy if exists "dev write photos" on public.lead_photos;
create policy "dev read photos" on public.lead_photos for select to anon, authenticated using (true);
create policy "dev write photos" on public.lead_photos for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev read activity" on public.lead_activity;
drop policy if exists "dev write activity" on public.lead_activity;
create policy "dev read activity" on public.lead_activity for select to anon, authenticated using (true);
create policy "dev write activity" on public.lead_activity for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev read notes" on public.lead_notes;
drop policy if exists "dev write notes" on public.lead_notes;
create policy "dev read notes" on public.lead_notes for select to anon, authenticated using (true);
create policy "dev write notes" on public.lead_notes for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev read sources" on public.lead_sources;
drop policy if exists "dev write sources" on public.lead_sources;
create policy "dev read sources" on public.lead_sources for select to anon, authenticated using (true);
create policy "dev write sources" on public.lead_sources for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev read settings" on public.settings;
drop policy if exists "dev write settings" on public.settings;
create policy "dev read settings" on public.settings for select to anon, authenticated using (true);
create policy "dev write settings" on public.settings for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev read searches" on public.saved_searches;
drop policy if exists "dev write searches" on public.saved_searches;
create policy "dev read searches" on public.saved_searches for select to anon, authenticated using (true);
create policy "dev write searches" on public.saved_searches for all to anon, authenticated using (true) with check (true);
