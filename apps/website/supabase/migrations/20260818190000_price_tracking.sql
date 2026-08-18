-- Price tracking. `tracked_products` is deduplicated by url -- every user who
-- tracks the same product shares one row, so the daily rescrape only has to
-- fetch each distinct url once no matter how many users are tracking it.

create table if not exists tracked_products (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  domain text not null default '',
  title text not null default '',
  image text,
  price numeric,
  currency text not null default '$',
  last_checked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists price_history (
  id uuid primary key default gen_random_uuid(),
  tracked_product_id uuid not null references tracked_products(id) on delete cascade,
  price numeric,
  currency text not null default '$',
  checked_at timestamptz not null default now()
);

alter table products add column if not exists tracking boolean not null default false;
alter table products add column if not exists tracked_product_id uuid references tracked_products(id);

alter table tracked_products enable row level security;
alter table price_history enable row level security;

-- Shared metadata, not owned by one user -- any signed-in user can read it.
-- Writes only ever happen via the security-definer functions below or the
-- service-role rescrape job, so there's no insert/update/delete policy here.
create policy "read tracked products" on tracked_products for select
  using (auth.uid() is not null);

create policy "read price history for own tracked products" on price_history for select
  using (exists (
    select 1 from products
    where products.tracked_product_id = price_history.tracked_product_id
    and products.user_id = auth.uid()
  ));

-- Finds-or-creates the shared tracked_products row for this product's url,
-- links the product to it, and seeds price_history with the current price
-- so the chart has a starting point before the first rescrape runs.
create or replace function public.track_product(p_product_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_product products;
  v_tracked_id uuid;
begin
  select * into v_product from products where id = p_product_id and user_id = auth.uid();
  if v_product is null then
    raise exception 'Product not found';
  end if;

  insert into tracked_products (url, domain, title, image, price, currency)
  values (v_product.url, v_product.domain, v_product.title, v_product.image, v_product.price, v_product.currency)
  on conflict (url) do update set url = excluded.url
  returning id into v_tracked_id;

  update products set tracking = true, tracked_product_id = v_tracked_id where id = p_product_id;

  insert into price_history (tracked_product_id, price, currency)
  select v_tracked_id, v_product.price, v_product.currency
  where not exists (select 1 from price_history where tracked_product_id = v_tracked_id);
end;
$$;

create or replace function public.untrack_product(p_product_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update products set tracking = false where id = p_product_id and user_id = auth.uid();
end;
$$;

grant execute on function public.track_product(uuid) to authenticated;
grant execute on function public.untrack_product(uuid) to authenticated;

-- Daily rescrape, 8am UTC. The rescrape-prices Edge Function does its own
-- work via its service-role key -- this just has to wake it up, so the
-- request body/headers carry no secret.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'rescrape-tracked-prices',
  '0 8 * * *',
  $$
  select net.http_post(
    url := 'https://uxroeiaomhjwxmaehami.supabase.co/functions/v1/rescrape-prices',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
