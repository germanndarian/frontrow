-- Frontrow — initial schema
-- Run this in the Supabase dashboard → SQL Editor (or via psql on
-- POSTGRES_URL_NON_POOLING). All data here is small text/JSON.
--
-- Three 1:1-with-user tables, each protected by Row-Level Security so a user
-- can only ever read or write their own row. A trigger seeds default rows when
-- a new auth user is created, so the app always has something to read.

-- ── profiles ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_emoji text not null default '🏈',
  avatar_color text not null default 'oklch(0.645 0.168 257)',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── preferences (who you follow) ──────────────────────────────────────────
create table if not exists public.preferences (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  sports     jsonb   not null default '[]'::jsonb,
  leagues    jsonb   not null default '[]'::jsonb,
  teams      jsonb   not null default '[]'::jsonb,
  players    jsonb   not null default '[]'::jsonb,
  onboarded  boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ── settings (appearance + dashboard) ─────────────────────────────────────
create table if not exists public.settings (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  accent          text    not null default 'cobalt',
  radius          text    not null default 'default',
  density         text    not null default 'comfortable',
  reduce_motion   boolean not null default false,
  background_glow boolean not null default true,
  greeting_name   text    not null default '',
  default_league  text    not null default 'all',
  hidden_sections jsonb   not null default '[]'::jsonb,
  updated_at      timestamptz not null default now()
);

-- ── Row-Level Security ────────────────────────────────────────────────────
alter table public.profiles    enable row level security;
alter table public.preferences enable row level security;
alter table public.settings    enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own preferences" on public.preferences;
create policy "own preferences" on public.preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own settings" on public.settings;
create policy "own settings" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Seed default rows on signup ───────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
    );
  insert into public.preferences (user_id) values (new.id);
  insert into public.settings (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
