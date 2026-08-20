-- Domains the user flagged while deleting a product, so we know to skip them.
-- Nothing reads this yet outside the website -- the extension capture path
-- isn't wired to consult it. That's a follow-up, not done here.

create table if not exists blacklisted_domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  domain text not null,
  created_at timestamptz not null default now(),
  unique (user_id, domain)
);

alter table blacklisted_domains enable row level security;

create policy "own blacklisted domains" on blacklisted_domains for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
