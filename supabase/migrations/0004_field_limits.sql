-- Frontrow — bound the free-text and JSON columns.
--
-- Row-Level Security already stops a user touching anyone else's row, so the
-- gap here is size rather than access: a user holds the anon key, can call
-- PostgREST directly without going near our UI, and could put megabytes into
-- their own display name or follow list. The browser's maxLength is a
-- courtesy; a CHECK constraint is the rule.
--
-- Safe to re-run. Existing values are brought inside the limits first, so
-- adding the constraints can't fail on data already in the table.

-- ── profiles ──────────────────────────────────────────────────────────────
update public.profiles set display_name = left(display_name, 60) where char_length(display_name) > 60;
update public.profiles set avatar_emoji = left(avatar_emoji, 16) where char_length(avatar_emoji) > 16;
update public.profiles set avatar_color = left(avatar_color, 64) where char_length(avatar_color) > 64;

alter table public.profiles drop constraint if exists profiles_text_limits;
alter table public.profiles add constraint profiles_text_limits check (
  char_length(display_name) <= 60
  and char_length(avatar_emoji) <= 16
  and char_length(avatar_color) <= 64
);

-- ── settings ──────────────────────────────────────────────────────────────
update public.settings set greeting_name = left(greeting_name, 40) where char_length(greeting_name) > 40;

alter table public.settings drop constraint if exists settings_text_limits;
alter table public.settings add constraint settings_text_limits check (
  char_length(greeting_name) <= 40
  and char_length(accent) <= 32
  and char_length(radius) <= 32
  and char_length(density) <= 32
  and char_length(default_league) <= 32
  and char_length(appearance) <= 32
);

-- Anything that isn't an array can't be measured, and the app never writes
-- one — reset those before the constraint goes on.
update public.settings set hidden_sections = '[]'::jsonb where jsonb_typeof(hidden_sections) <> 'array';

alter table public.settings drop constraint if exists settings_json_limits;
alter table public.settings add constraint settings_json_limits check (
  jsonb_typeof(hidden_sections) = 'array' and jsonb_array_length(hidden_sections) <= 50
);

-- ── preferences ───────────────────────────────────────────────────────────
-- Generous caps: following 200 teams is already far more than the app offers.
update public.preferences set sports  = '[]'::jsonb where jsonb_typeof(sports)  <> 'array';
update public.preferences set leagues = '[]'::jsonb where jsonb_typeof(leagues) <> 'array';
update public.preferences set teams   = '[]'::jsonb where jsonb_typeof(teams)   <> 'array';
update public.preferences set players = '[]'::jsonb where jsonb_typeof(players) <> 'array';

alter table public.preferences drop constraint if exists preferences_json_limits;
alter table public.preferences add constraint preferences_json_limits check (
  jsonb_typeof(sports)  = 'array' and jsonb_array_length(sports)  <= 20
  and jsonb_typeof(leagues) = 'array' and jsonb_array_length(leagues) <= 50
  and jsonb_typeof(teams)   = 'array' and jsonb_array_length(teams)   <= 200
  and jsonb_typeof(players) = 'array' and jsonb_array_length(players) <= 200
);

-- Each element is small, but 200 of them could still be large if one were
-- enormous. Bound the whole column too, well above any real lineup.
alter table public.preferences drop constraint if exists preferences_size_limit;
alter table public.preferences add constraint preferences_size_limit check (
  pg_column_size(sports) + pg_column_size(leagues)
  + pg_column_size(teams) + pg_column_size(players) <= 262144
);
