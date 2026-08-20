-- Connected third-party accounts (eBay, ...) for pulling order/selling history.

create table if not exists integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  provider text not null check (provider in ('ebay')),
  external_username text,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  connected_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table integrations enable row level security;

create policy "own integrations" on integrations for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
