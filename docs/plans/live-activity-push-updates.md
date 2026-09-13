# Plan — make the Lock Screen tracker update on a locked phone

**Status:** not started. The tracker itself shipped in PR #59 (`f4da79d`).
**How to use this:** point Claude at this file and say do it. Read
"Decide this first" before anything else — the answer changes the shape of
the work.

---

## Where things stand

A live baseball or football game can be tracked from its sheet. The Lock
Screen card and the Dynamic Island show the score, the inning or quarter and
the clock; baseball adds the count, the outs and the bases diamond, football
the down and distance with a possession dot.

The card updates **only while the Frontrow app is awake**. It rides the Scores
tab's thirty-second poll (`ScoresScreen` → `tracker.update(from:)`), and iOS
suspends that poll within seconds of the app leaving the foreground.

### What works today

| Scenario | Result |
|---|---|
| Tap **Track on Lock Screen** | Card appears immediately, correct score, count and bases |
| App stays open and the score changes | Card updates within 30s |
| Lock the phone, come back later and **open the app** | Card catches up about a second after the app resumes |
| Tap the card | Opens that game's detail sheet (deep link from PR #57) |
| Game ends while the app is open | Final score shows, then the activity clears itself a few minutes later |

### What doesn't

| Scenario | Result |
|---|---|
| Phone locked in a pocket for 20 minutes | Still the score from when you locked it. Dims after 4 minutes so it reads as stale, but doesn't refresh |
| Watching the Dynamic Island from another app | Frozen at the state from when Frontrow was last awake |
| Wanting a buzz when the score changes | Nothing pushes, so nothing happens |
| Game ends while the app is closed | Card sits on the last score until the app is next opened; iOS clears untouched activities on its own after several hours |

It is closer to a bookmark than a broadcast: right when you set it, right again
every time you open the app, and honest about being stale in between.

---

## Decide this first

**How fresh does a locked phone need to be?** This is the fork in the road.

- **~60 seconds is fine** → Vercel Cron on the **Pro** plan, minute granularity.
  Everything below is a weekend of work and no new infrastructure to run.
- **Live pace (10–30s) is the point** → Vercel Cron can't do it. Hobby runs at
  most once a day, Pro at most once a minute. You need something always-on: a
  small worker on Railway/Fly/Render, or a Supabase Edge Function on a
  scheduler. That is a new thing to run, pay for and monitor.

Don't start until this is answered. Building the minute-cadence version and
then wanting ten seconds means replacing the pusher, which is the largest
piece.

---

## Prerequisites (yours, not Claude's)

1. **APNs auth key.** Apple Developer portal → Certificates, Identifiers &
   Profiles → Keys → new key with **Apple Push Notification service (APNs)**
   enabled. Download the `.p8` **once** — it can't be downloaded again. Note
   the **Key ID**.
2. **Team ID:** `9N4Y5K8R9K` (already in `apple/project.yml`).
3. **Bundle ID:** `com.germanndarian.frontrow`.
4. Add to Vercel as environment variables (Sensitive):
   `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_PRIVATE_KEY` (the `.p8` contents),
   `APNS_BUNDLE_ID`.
5. **If you chose the 60s path:** upgrade the Vercel project to Pro.
6. Apply the migration this plan adds (SQL editor, as with `0004`).

The `.p8` is a real secret — same class as `SUPABASE_SERVICE_ROLE_KEY`. It goes
in Vercel's environment and nowhere near the repo or the client. See
`docs/security.md`.

---

## The work

### 1. App: ask for a push token

`apple/Frontrow/Features/Scores/GameTracker.swift`

- `Activity.request(..., pushType: .token)` instead of `pushType: nil`.
- Read `activity.pushTokenUpdates` — it's an `AsyncSequence`, and it fires
  again when the token rotates, so it must be consumed for the activity's
  whole life, not read once.
- Hex-encode the token data and `POST` it with the game id to our API.
- On `stop()` and on the game going final, tell the API to forget the token —
  otherwise the server pushes at a card that no longer exists.

Watch: the existing `nonisolated` helpers are there because `Activity` isn't
sendable (see the comment in the file). Consuming `pushTokenUpdates` has the
same constraint — do it inside a task that also fetches the activity.

### 2. App: declare frequent updates

`apple/project.yml`, app target `info.properties`:

```yaml
NSSupportsLiveActivitiesFrequentUpdates: true
```

Without it APNs applies a tighter update budget and will silently drop pushes
during a busy game. With it, the system still budgets — this is a request, not
a guarantee.

### 3. Database: somewhere to keep the tokens

New migration, `supabase/migrations/0005_live_activity_tokens.sql`:

```
create table public.activity_tokens (
  token       text primary key,
  user_id     uuid references auth.users (id) on delete cascade,
  game_id     text not null,
  league      text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

- RLS on, policy `auth.uid() = user_id` for both `using` and `with check`, the
  same shape as every other table in `0001_init.sql`.
- The pusher reads across users, so it uses the **service-role key** and
  bypasses RLS — that's why it lives in a route handler, never the client.
- Index on `game_id`; the pusher groups by game so one ESPN read serves every
  device watching it.
- Follow `0004`'s habits: bring existing rows inside the rules first, make it
  re-runnable, and cap the text columns.

### 4. API: take tokens, and forget them

`src/app/api/activity/route.ts`

- `POST` — body `{ token, gameId, league }`. Verify the caller the way
  `/api/account/route.ts` does (cookie session on web, bearer token from the
  app), upsert on `token`.
- `DELETE` — body `{ token }`, delete the row.
- Rate-limit it with `rateLimited(req)` like every other route.
- Validate `gameId` with `isValidId` from `@/lib/espn/ids`.

### 5. API: the pusher

`src/app/api/cron/push-activities/route.ts`

1. Read the distinct `game_id`s from `activity_tokens`.
2. Fetch those games (reuse `/api/scoreboard`'s normalizer — don't write a
   second one).
3. Build the same `ContentState` shape the app builds in
   `GameActivity.ContentState.init(_ game:)`. **These two must not drift.**
   The field names are the wire format; a rename on one side silently stops
   updating the card on the other.
4. Sign an APNs JWT (ES256, `kid` = key id, `iss` = team id, cache it — it's
   valid for an hour and Apple rejects churn).
5. `POST https://api.push.apple.com/3/device/<token>` per token, with headers:
   - `apns-topic: com.germanndarian.frontrow.push-type.liveactivity`
   - `apns-push-type: liveactivity`
   - `apns-priority: 10` when the score changed, `5` otherwise
   - `apns-expiration: 0`
6. Payload:
   ```json
   {
     "aps": {
       "timestamp": 1757800000,
       "event": "update",
       "content-state": { "homeScore": 2, "awayScore": 1, "...": "..." },
       "stale-date": 1757800240
     }
   }
   ```
   `event: "end"` with a `dismissal-date` when the game goes final.
7. Delete rows on a `410 Gone` from APNs — the activity is over and the token
   is dead.

Protect it: Vercel sets `Authorization: Bearer $CRON_SECRET` on cron requests.
Check it and return 401 otherwise, or anyone can make us push.

### 6. Schedule it

- **Pro / 60s:** `vercel.json` (or `vercel.ts`) cron, `* * * * *`, pointed at
  the route.
- **Always-on / 10–30s:** the route stays as-is; something external calls it
  on a timer. Whatever runs it needs the secret and nothing else.

---

## How to know it works

1. Unit-test the `ContentState` builder on the web against the same real
   payloads `src/lib/__tests__/bases.test.ts` uses, asserting the JSON keys
   match the Swift property names exactly. This is the part most likely to rot.
2. Unit-test the APNs JWT: right `alg`, `kid`, `iss`, and a cached token reused
   inside the hour.
3. By hand, once, with a real game: track it, lock the phone, put it down for
   five minutes, and look. That is the only test that proves the whole chain.
4. Check the card **dims** if the pusher stops — `staleDate` must keep moving
   with each push, or a dead pusher looks identical to a live one.

---

## Traps

- **The wire format is shared and unversioned.** `GameActivity.ContentState`
  in Swift and the JSON the pusher sends must match key for key. Renaming a
  Swift property without changing the server stops updates silently — no
  crash, no error, just a card that never changes.
- **`pushTokenUpdates` fires more than once.** Treat it as a stream, not a
  value. A rotated token that isn't stored means a card that stops updating.
- **The push budget is real.** Even with the frequent-updates key, a game with
  a pitch every fifteen seconds can exceed it. Push on *change*, not on a
  timer: if the `ContentState` is identical to the last one sent for that
  token, skip it. This also keeps the ESPN budget honest.
- **`staleDate` is a promise.** It must be pushed forward on every update. Set
  it once and the card greys out mid-game while the data is fine.
- **410 means gone.** Don't retry; delete the row.
- **A tracked game the poll can't see.** `update(from:)` already no-ops when
  the game isn't in the batch. The server has no such luxury — a `game_id`
  that stops appearing on the scoreboard needs ending, not ignoring, or the
  card hangs around until iOS reaps it.
- **Don't push to a card the user stopped.** `stop()` has to reach the API,
  including when the app is killed right after — a token row with no activity
  behind it wastes pushes and eventually 410s.

---

## Not in scope, worth knowing

- **Starting an activity from a push** (`pushToStartToken`, iOS 17.2+) would
  let a game you follow put itself on the Lock Screen at first pitch without
  the app being opened. It's a natural follow-on once tokens exist, and a
  separate piece of work.
- **Hockey.** `GameActivity.canTrack` takes any game with a `bases` or `field`
  block, which today means baseball and football. Hockey needs a situation
  block of its own before it has anything to show.
