-- Supabase database-linter fixes. None of these change behaviour:
--   • Same RLS guarantees (a user still only sees/writes their own row).
--   • The signup trigger still fires and seeds the default rows.
--
-- 1) auth_rls_initplan (PERFORMANCE) — wrap auth.uid() in a scalar subquery so
--    Postgres evaluates it once per statement instead of once per row.
-- 2) {anon,authenticated}_security_definer_function_executable (SECURITY) —
--    handle_new_user() is only ever meant to run from the auth.users trigger,
--    but the default PUBLIC execute grant also exposes it over the REST API as
--    an RPC. Revoke EXECUTE; trigger invocation does not require it, so the
--    signup flow is unaffected.

-- ── 1) Re-create RLS policies with (select auth.uid()) ─────────────────────
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "own preferences" on public.preferences;
create policy "own preferences" on public.preferences
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own settings" on public.settings;
create policy "own settings" on public.settings
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ── 2) Take the trigger function out of the exposed API ────────────────────
revoke execute on function public.handle_new_user() from public, anon, authenticated;
