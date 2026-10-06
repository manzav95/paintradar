-- PaintRadar sales / estimates schema
-- Apply in the Supabase SQL editor after schema.sql.
-- Existing estimates store a pricing snapshot so later rate changes
-- do not rewrite historical documents.

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  city text not null default '',
  state text not null default 'CA',
  zip text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pricing_settings (
  id uuid primary key default gen_random_uuid(),
  snapshot jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  document_term text not null default 'Estimate',
  company_name text not null default 'Bayline Painting',
  owner_name text not null default '',
  terms text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  manufacturer text not null,
  product_name text not null,
  category text not null,
  finish text not null default '',
  cost_per_gallon_cents integer not null default 0,
  coverage numeric not null default 375,
  markup numeric not null default 0.4,
  active boolean not null default true,
  notes text not null default ''
);

create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  type text not null default 'interior',
  status text not null default 'draft',
  customer_id uuid references public.customers(id) on delete set null,
  job_name text not null default '',
  project_address text not null default '',
  project_city text not null default '',
  project_state text not null default 'CA',
  project_zip text not null default '',
  notes text not null default '',
  extra_colors integer not null default 0,
  waive_color_fee boolean not null default false,
  colors jsonb not null default '{}'::jsonb,
  discount jsonb not null default '{}'::jsonb,
  rooms jsonb not null default '[]'::jsonb,
  addons jsonb not null default '[]'::jsonb,
  rates jsonb not null,
  client_view text not null default 'bundled',
  field_mode boolean not null default true,
  signature jsonb,
  invoice_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.estimate_rooms (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  payload jsonb not null
);

create table if not exists public.estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  payload jsonb not null
);

create table if not exists public.estimate_materials (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  payload jsonb not null
);

create table if not exists public.estimate_options (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  payload jsonb not null
);

create table if not exists public.estimate_packages (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  payload jsonb not null
);

create table if not exists public.estimate_signatures (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  image_data text not null,
  printed_name text not null,
  signed_at timestamptz not null default now(),
  accepted_amount_cents integer not null
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  estimate_id uuid references public.estimates(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  status text not null default 'draft',
  job_name text not null default '',
  project_address text not null default '',
  rooms jsonb not null default '[]'::jsonb,
  addons jsonb not null default '[]'::jsonb,
  rates jsonb not null,
  extra_colors integer not null default 0,
  waive_color_fee boolean not null default false,
  colors jsonb not null default '{}'::jsonb,
  discount jsonb not null default '{}'::jsonb,
  notes text not null default '',
  signature jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  payload jsonb not null
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  kind text not null,
  label text not null,
  amount_due_cents integer not null default 0,
  amount_paid_cents integer not null default 0,
  due_date date,
  paid_at timestamptz,
  method text not null default '',
  notes text not null default ''
);

create table if not exists public.change_orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  estimate_id uuid references public.estimates(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_workspaces (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.sales_workspaces enable row level security;

drop policy if exists "sales workspace read" on public.sales_workspaces;
drop policy if exists "sales workspace write" on public.sales_workspaces;
create policy "sales workspace read" on public.sales_workspaces
  for select to anon, authenticated using (true);
create policy "sales workspace write" on public.sales_workspaces
  for all to anon, authenticated using (true) with check (true);
grant select, insert, update, delete on table public.sales_workspaces to anon, authenticated;

alter table public.customers enable row level security;
alter table public.pricing_settings enable row level security;
alter table public.business_settings enable row level security;
alter table public.materials enable row level security;
alter table public.estimates enable row level security;
alter table public.estimate_rooms enable row level security;
alter table public.estimate_items enable row level security;
alter table public.estimate_materials enable row level security;
alter table public.estimate_options enable row level security;
alter table public.estimate_packages enable row level security;
alter table public.estimate_signatures enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.change_orders enable row level security;
