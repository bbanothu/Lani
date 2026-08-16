-- Lani schema. Run once in the Supabase SQL editor (Project > SQL Editor > New query).

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  price numeric,
  currency text not null default '$',
  image text,
  url text not null,
  domain text not null default '',
  source text not null default 'manual' check (source in ('extension', 'manual')),
  tags text[] not null default '{}',
  added_at timestamptz not null default now()
);

create table if not exists lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  visibility text not null default 'private' check (visibility in ('private', 'shared', 'public')),
  is_favorites boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists one_favorites_list_per_user
  on lists (user_id) where is_favorites;

create table if not exists list_products (
  list_id uuid not null references lists(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (list_id, product_id)
);

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table products enable row level security;
alter table lists enable row level security;
alter table list_products enable row level security;
alter table cart_items enable row level security;

create policy "own products" on products for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own lists" on lists for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own cart items" on cart_items for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "list_products via owned list" on list_products for all
  using (exists (select 1 from lists where lists.id = list_products.list_id and lists.user_id = auth.uid()))
  with check (exists (select 1 from lists where lists.id = list_products.list_id and lists.user_id = auth.uid()));

-- New user -> auto-create their Favorites list.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.lists (user_id, title, description, visibility, is_favorites)
  values (new.id, 'Favorites', 'Things I love', 'private', true);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Favorites list can never be deleted, by any client.
create or replace function public.protect_favorites_list()
returns trigger
language plpgsql
as $$
begin
  if old.is_favorites then
    raise exception 'The Favorites list cannot be deleted';
  end if;
  return old;
end;
$$;

drop trigger if exists protect_favorites_list_trigger on lists;
create trigger protect_favorites_list_trigger
  before delete on lists
  for each row execute procedure public.protect_favorites_list();
