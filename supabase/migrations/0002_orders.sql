-- Orders and payments persistence

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references auth.users(id),
  email text,
  status text not null default 'pending', -- pending|authorized|paid|canceled|refunded
  amount_cents integer not null,
  currency text not null default 'usd',
  capture_method text not null default 'automatic', -- automatic|manual
  save_card boolean not null default false,
  stripe_payment_intent_id text unique,
  authorized_at timestamptz,
  paid_at timestamptz,
  canceled_at timestamptz,
  items jsonb not null, -- lightweight snapshot of cart items
  metadata jsonb
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  order_id uuid references public.orders(id) on delete set null,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null, -- requires_action|requires_capture|succeeded|canceled|processing|...
  stripe_payment_intent_id text,
  stripe_payment_method_id text,
  stripe_charge_id text,
  raw jsonb
);

-- Timestamps trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute procedure public.set_updated_at();

-- Enable RLS but no policies initially; access via service role on server
alter table public.orders enable row level security;
alter table public.payments enable row level security;

