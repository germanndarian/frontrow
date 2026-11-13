---
name: supabase-migration
description: Use when a Frontrow change needs a database change, such as a new table, column, constraint or RLS policy, a new file in `supabase/migrations/`, or a change to `src/lib/sync.ts` that reads or writes new Supabase columns.
---

# Supabase migration

Migrations are applied by hand. Nothing runs them in CI or on deploy.

## Steps

1. `ls supabase/migrations` and take the next number: `000N_short_name.sql` (latest today is `0004_field_limits.sql`).
2. Write idempotent SQL like `0001_init.sql`: `add column if not exists`, `drop policy if exists "name" on ...;` then `create policy`.
3. Every table keeps row level security on, and a policy so a user touches only their own rows (`auth.uid() = id` or `user_id`, see the "own profile", "own preferences", "own settings" policies in `0001_init.sql`). Never add a policy that opens rows to everyone.
4. Update the code that uses the columns (`src/lib/sync.ts`, `src/lib/types.ts`) and the matching test (`src/lib/__tests__/sync.test.ts`). Keep the code tolerant of the column not existing yet where practical, because the SQL runs before the deploy only if the maintainer does it.
5. Do not run it yourself and never use or paste the service-role key. In the PR add a **For you** line: `run supabase/migrations/000N_....sql in the SQL Editor before it deploys.`

## Gotchas

- The SQL must be run before the dependent code deploys, not after.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only (used by `DELETE /api/account`); never expose it to the client.
- e2e uses a Supabase URL that points nowhere, so tests will not catch a bad migration. Read the SQL twice.

## Check it worked

`npx vitest run src/lib/__tests__/sync.test.ts`, then the full gate from AGENTS.md. Say in the PR that the SQL itself was not run.
