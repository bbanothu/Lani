-- Public read access for shared/public lists (anonymous visitors included --
-- these policies don't check auth.uid(), they check the list's own
-- visibility column), plus a table of emails a list has been shared with.

create policy "read shared or public lists" on lists for select
  using (visibility in ('shared', 'public'));

create policy "read list_products for shared or public lists" on list_products for select
  using (exists (
    select 1 from lists
    where lists.id = list_products.list_id
    and lists.visibility in ('shared', 'public')
  ));

create policy "read products in shared or public lists" on products for select
  using (exists (
    select 1 from list_products
    join lists on lists.id = list_products.list_id
    where list_products.product_id = products.id
    and lists.visibility in ('shared', 'public')
  ));

create table if not exists list_shares (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references lists(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  unique (list_id, email)
);

alter table list_shares enable row level security;

-- Owners manage who a list is shared with.
create policy "owner manages list shares" on list_shares for all
  using (exists (select 1 from lists where lists.id = list_shares.list_id and lists.user_id = auth.uid()))
  with check (exists (select 1 from lists where lists.id = list_shares.list_id and lists.user_id = auth.uid()));

-- An invited user can see the invite rows naming their own email, so the
-- "Shared with me" tab can find which lists to show.
create policy "read own invites" on list_shares for select
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
