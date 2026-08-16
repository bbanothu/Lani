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
