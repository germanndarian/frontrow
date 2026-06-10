-- Add the light/dark appearance preference to user settings.
-- Light is the new default (the cobalt theme matching the homepage); existing
-- rows fall back to 'light' too.
alter table public.settings
  add column if not exists appearance text not null default 'light';
