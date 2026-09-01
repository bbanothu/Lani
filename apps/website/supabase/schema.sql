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

-- One row per (user, product URL): the extension must never scrape the same
-- page into a second row, even after a reinstall wipes its local seen-set.
create unique index if not exists products_user_url_unique on products (user_id, url);

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

-- Persists chat sessions with Nora so users can view/continue previous chats.

create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  product_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;

create policy "own chat sessions" on chat_sessions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "chat_messages via owned session" on chat_messages for all
  using (exists (select 1 from chat_sessions where chat_sessions.id = chat_messages.session_id and chat_sessions.user_id = auth.uid()))
  with check (exists (select 1 from chat_sessions where chat_sessions.id = chat_messages.session_id and chat_sessions.user_id = auth.uid()));

-- Keep session ordering (most recently active first) without a join at read time.
create or replace function public.touch_chat_session()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update chat_sessions set updated_at = now() where id = new.session_id;
  return new;
end;
$$;

drop trigger if exists touch_chat_session_trigger on chat_messages;
create trigger touch_chat_session_trigger
  after insert on chat_messages
  for each row execute procedure public.touch_chat_session();

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
