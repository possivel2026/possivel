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
create index if not exists revenue_events_status_idx on public.revenue_events(status);
create index if not exists withdrawal_requests_created_at_idx on public.withdrawal_requests(created_at desc);
create index if not exists withdrawal_requests_creator_idx on public.withdrawal_requests(creator_user_id);
create index if not exists withdrawal_requests_status_idx on public.withdrawal_requests(status);

alter table public.revenue_events enable row level security;
alter table public.withdrawal_requests enable row level security;

-- Totals are calculated in the database over the complete ledger, not over
-- the paginated rows displayed in the dashboard.
create or replace function public.wayne_financial_summary()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with r as (
    select coalesce(sum(amount) filter (where status = 'approved'), 0)::numeric(14,2) as gross
    from public.revenue_events
  ), w as (
    select
      coalesce(sum(amount) filter (where status in ('requested','processing','paid')), 0)::numeric(14,2) as reserved,
      coalesce(sum(amount) filter (where status = 'paid'), 0)::numeric(14,2) as paid
    from public.withdrawal_requests
  )
  select jsonb_build_object(
    'gross', r.gross,
    'requested', w.reserved,
    'paid', w.paid,
    'available', greatest(0::numeric, r.gross - w.reserved)
  )
  from r cross join w;
$$;

-- Atomic withdrawal request. The advisory transaction lock prevents two
-- simultaneous requests from reserving the same balance.
create or replace function public.request_wayne_withdrawal(
  p_creator_user_id uuid,
  p_amount numeric
)
returns public.withdrawal_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gross numeric(14,2);
  v_reserved numeric(14,2);
  v_available numeric(14,2);
  v_row public.withdrawal_requests;
begin
  if p_creator_user_id is null then
    raise exception 'creator_required';
  end if;
  if p_amount is null or p_amount < 1 then
    raise exception 'invalid_amount';
  end if;

  perform pg_advisory_xact_lock(hashtext('wayne-corporation-withdrawal-ledger'));

  select coalesce(sum(amount),0)::numeric(14,2)
    into v_gross
    from public.revenue_events
   where status = 'approved';

  select coalesce(sum(amount),0)::numeric(14,2)
    into v_reserved
    from public.withdrawal_requests
   where status in ('requested','processing','paid');

  v_available := greatest(0::numeric, v_gross - v_reserved);
  if p_amount > v_available then
    raise exception using
      message = 'insufficient_available_balance',
      detail = v_available::text;
  end if;

  insert into public.withdrawal_requests (
    creator_user_id, amount, currency, status, destination_label
  ) values (
    p_creator_user_id, round(p_amount,2), 'BRL', 'requested', 'Wayne Corporation'
  ) returning * into v_row;

  return v_row;
end;
$$;

-- Server-only execution. The browser never calls these functions directly.
revoke all on function public.wayne_financial_summary() from public, anon, authenticated;
revoke all on function public.request_wayne_withdrawal(uuid,numeric) from public, anon, authenticated;
grant execute on function public.wayne_financial_summary() to service_role;
grant execute on function public.request_wayne_withdrawal(uuid,numeric) to service_role;

-- No browser-facing policies are intentionally created.
-- The dashboard reads/writes through Vercel server functions using the
-- Supabase service-role key, after validating the logged-in creator UUID.

comment on table public.revenue_events is 'Server-only ledger of confirmed provider revenue events.';
comment on table public.withdrawal_requests is 'Server-only withdrawal request ledger for the authorized creator.';
comment on function public.request_wayne_withdrawal(uuid,numeric) is 'Atomically reserves an available Wayne Corporation ledger balance.';
