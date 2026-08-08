-- Possível Labs / Wayne Corporation financial admin schema
-- Execute once in Supabase SQL Editor before launch.

create table if not exists public.revenue_events (
  id bigint generated always as identity primary key,
  external_payment_id text unique,
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null default 'BRL',
  status text not null,
  source text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.withdrawal_requests (
  id bigint generated always as identity primary key,
  creator_user_id uuid not null,
  amount numeric(14,2) not null check (amount >= 1),
  currency text not null default 'BRL',
  status text not null default 'requested' check (status in ('requested','processing','paid','rejected','cancelled')),
  destination_label text not null default 'Wayne Corporation',
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  notes text
);

create index if not exists revenue_events_created_at_idx on public.revenue_events(created_at desc);
create index if not exists withdrawal_requests_created_at_idx on public.withdrawal_requests(created_at desc);
create index if not exists withdrawal_requests_creator_idx on public.withdrawal_requests(creator_user_id);

alter table public.revenue_events enable row level security;
alter table public.withdrawal_requests enable row level security;

-- No browser-facing policies are intentionally created.
-- The dashboard reads/writes through Vercel server functions using the
-- Supabase service-role key, after validating the logged-in creator UUID.

comment on table public.revenue_events is 'Server-only ledger of confirmed provider revenue events.';
comment on table public.withdrawal_requests is 'Server-only withdrawal request ledger for the authorized creator.';
