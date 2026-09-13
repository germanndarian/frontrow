# Security

What the app does about security, what an audit on 13 September 2026 found, and
what was deliberately left alone. Anything here that changes should change this
file with it.

## The shape of the thing

Frontrow is a Next.js app on Vercel, a native iOS app, and Supabase for
accounts. It reads a public sports feed and writes nothing to it. The data
worth protecting is small: who you are, who you follow, and how you like the
app to look.

There is no admin surface. No route grants one user power over another, no
role column exists, and nothing in the app can read another account's rows.

## Secrets

**There is no API key to hide.** ESPN's endpoints need none — that is why the
app can run with an empty `.env`.

Two Supabase values are public by design and are meant to ship inside the
client: `NEXT_PUBLIC_SUPABASE_URL` and the anon key, which appears in the web
bundle and in `apple/Frontrow/Account/SupabaseConfig.swift`. The anon key is a
signed token whose payload reads `"role": "anon"`; it grants nothing on its
own, because every table is behind Row-Level Security and the session decides
what the holder can reach. Every Supabase app on earth ships it. Treating it as
a secret would mean moving it somewhere the client couldn't read, which is to
say breaking sign-in for nothing.

One value is a real secret: `SUPABASE_SERVICE_ROLE_KEY`. It bypasses RLS, it
lives only in Vercel's environment, it is read only by `/api/account`, and it
never reaches the browser. It is not in the repository, in any build output, or
in git history.

`.env*` is git-ignored except `.env.example`, which contains no values.

## What the audit checked

**Git history** — all 75 commits scanned for service-role tokens, AWS keys,
private keys and JWTs. The only token found is the anon key described above.
Clean.

**Access control** — every table has RLS enabled with `auth.uid()` on both
`using` and `with check`, so a user reads and writes their own row and no
other. The signup trigger is `security definer` with `search_path` pinned to
empty, which is the hardening that stops a caller shadowing a function it
calls. `/api/account` deletes only the id belonging to the verified caller's
token; it cannot be aimed at anyone else.

**Passwords** — the app never sees, stores or hashes one. Sign-up, sign-in and
password changes all go to Supabase Auth, which hashes with bcrypt server-side.
There is nothing here to get right or wrong. Password strength rules belong in
the Supabase dashboard, not in this repository.

**XSS** — nothing writes user input into HTML. React escapes by default, and
the single `dangerouslySetInnerHTML` in the app is a fixed string (the
first-paint theme switch in `layout.tsx`) with no interpolation. No `innerHTML`,
no `eval`, no `new Function` anywhere in the codebase.

**CORS** — no route sets `Access-Control-Allow-Origin`, so the browser's
same-origin policy applies and no other site can read a response on a user's
behalf. That is the secure default and the correct setting; adding permissive
CORS is the mistake people make here. The iOS app is unaffected — CORS is a
browser rule.

**Debug output** — there is no `console.*` anywhere in `src/`, so nothing is
narrated into production logs. Browser source maps are off.

**Exposed files** — `public/` holds two logos and five SVGs. Nothing sensitive
is served.

**Dependencies** — every package in the manifest is imported by something, so
nothing was removed. Advisories are covered below.

## What was fixed

| | |
|---|---|
| **Open redirect** | `/auth/confirm?next=` was pasted onto our origin, and `"https://frontrow.app" + "@evil.com"` is a URL whose host is `evil.com`. A crafted link signed a user in and handed them to an attacker's site. Now only a path on this site is accepted. |
| **Unchecked ids** | The team, player, roster and schedule routes spliced a URL id into an upstream URL and a cache key. The host is a constant so nothing could leave ESPN, but `../` reached other ESPN paths and unbounded ids could flood the cache. Ids are now validated. |
| **No security headers** | `next.config` was empty. There is now a CSP, HSTS, `frame-ancestors 'none'`, nosniff, a referrer policy and a permissions policy, and `X-Powered-By` no longer announces the framework version. |
| **No rate limiting** | Every route proxies ESPN on a shared budget and nothing capped one client. 120 requests a minute per address, per instance. |
| **Unbounded columns** | RLS stopped a user touching another row but nothing stopped them filling their own with megabytes, via PostgREST and without touching our UI. Migration `0004` adds length and array-size constraints. |
| **11 advisories** | 1 critical, 7 high, 3 moderate, including Next.js itself. Now zero. |

## What was deliberately not done

**Nonce-based CSP.** Scripts are allowed `'unsafe-inline'`. A nonce must be
minted per request, which forces every page to render dynamically; these pages
are static, and the protection would be theoretical here because nothing writes
user input into HTML. The rest of the policy — no framing, no plugins, no
rewriting our base href, no posting our forms elsewhere — is doing the work. If
the app ever renders user-supplied markup, this trade must be revisited first.

**Distributed rate limiting.** Counters live in each instance's memory, so a
client spread across instances gets a multiple of the budget. Exactness needs
shared state and a network round trip on every request. What is here stops the
runaway loop, which is the case that actually happens.

**Moving the anon key out of the iOS binary.** It is public by design; see
above.

## If you are looking for the next thing

- A `Retry-After`-aware backoff in the iOS client, so a rate-limited app waits
  politely instead of retrying into the wall.
- Supabase dashboard: raise the minimum password length, and turn on leaked
  password protection.
- `preferences` rows are user-controlled JSON read by both clients. They are
  size-capped now and only ever read back by the account that wrote them, but
  they are the one place where a user's input travels furthest.
