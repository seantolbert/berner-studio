alter table public.orders
  add column if not exists merchant_notified_at timestamptz;

alter table public.orders
  add column if not exists customer_notified_at timestamptz;
