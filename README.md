<div align="center">

# 🏟️ Frontrow

### Your teams. One screen. Front-row seats to the only games that matter — yours.

A personal sports companion for **NFL · College Football · NHL · MLB**.
Follow your teams and players and get one broadcast-grade dashboard: live scores,
recent form, next fixtures, standings, and season stats — nothing you don't care about.

<br/>

[![CI](https://github.com/germanndarian/frontrow/actions/workflows/ci.yml/badge.svg)](https://github.com/germanndarian/frontrow/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-deployed-000000?logo=vercel&logoColor=white)

</div>

---

> **Mood:** a floodlit night game seen from the press box. Deep midnight slate,
> broadcast-grade overlays, cobalt as the brand voice, a single live-red pulse,
> amber reserved for the leaders. Color lives in the brand and the data —
> never smeared across the surface.

**Frontrow is live.** Accounts, follows, and settings persist to **Supabase Postgres**;
scores and stats stream from **ESPN's public endpoints** through server-side route
handlers. Sign in from any device and your dashboard is exactly where you left it.

<br/>

## ✨ What makes it special

|  |  |
| --- | --- |
| 🎟️ **A dashboard that's only yours** | No firehose of every game — just live & upcoming, your teams, your players, the standings around them. |
| 🔴 **Live, but quiet** | Auto-refresh polls *only while a game is actually live*. The rest of the time it sits still and fast. |
| 🎨 **Make it yours** | 7 accent themes, corner roundness, density, motion and glow toggles, a custom greeting, default league, and per-section visibility. |
| 🔐 **Real accounts** | Supabase email + password auth with confirmation, Row-Level Security, and cross-device sync. |
| 📊 **Stats with shape** | Season-trend charts, output sparklines, recent form, and league-ranked player numbers. |
| 🌒 **Considered everywhere** | Loading, empty, and error states on every surface; mobile-first; honors `prefers-reduced-motion`. |

<br/>

## 🚀 Quick start

```bash
git clone https://github.com/germanndarian/frontrow.git
cd frontrow
npm install
cp .env.example .env.local     # add the two public Supabase values (see below)
npm run dev
```

Open **http://localhost:3000**. Production build:

```bash
npm run build && npm run start
```

> Requires **Node 18.18+** (developed on Node 24).

<br/>

## 🔑 Environment

ESPN needs **no API key** — it's read through keyless public endpoints, server-side.
Accounts and saved data need **Supabase**. In production the Supabase Vercel
integration injects everything; for local dev, drop the two browser-safe values into
`.env.local`:

| Variable | Purpose | Required |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ accounts |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (RLS-guarded) | ✅ accounts |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — account deletion | optional |
| `NEXT_PUBLIC_LIVE_POLL_MS` | Live-game refresh cadence | `30000` |
| `NEXT_PUBLIC_USE_MOCK` | Run fully offline on the demo dataset | `false` |

Apply the schema once from `supabase/migrations/0001_init.sql` (Supabase → SQL Editor).
It creates the `profiles` / `preferences` / `settings` tables, Row-Level Security so a
user can only ever touch their own rows, and a trigger that seeds defaults on signup.

<br/>

## 🧱 Architecture

```
            ┌──────────────┐      ┌────────────────────┐      ┌──────────────┐
 Browser ──▶│  /api/* route │ ───▶ │  ESPN (cached, 8s    │ ───▶ │  normalizer  │ ──▶ UI
            │   handlers    │      │  timeout, retry-once)│      │ (defensive)  │
            └──────────────┘      └────────────────────┘      └──────────────┘

 Accounts ──▶ Supabase Auth (cookies, @supabase/ssr) ──▶ Postgres + RLS  ◀── follows & settings
```

Data flows **client hook → server route handler → ESPN (cached) → normalizer →
component** — the browser never calls ESPN directly. Accounts flow through Supabase
Auth; follows and settings load on sign-in and write through to Postgres.

| Route | Source |
| --- | --- |
| `GET /api/scoreboard?leagues=` | `.../{sport}/{league}/scoreboard` |
| `GET /api/team/[id]?league=` | team detail + `teams/{id}/schedule` |
| `GET /api/standings/[league]?teamId=` | `v2/.../standings?level=3` |
| `GET /api/player/[id]?league=` | `athletes/{id}` + `athletes/{id}/gamelog` |
| `GET /api/teams` · `GET /api/roster` | onboarding selectors |
| `GET /auth/confirm` · `DELETE /api/account` | Supabase email confirm · account deletion |

**Resilience.** The ESPN client retries once and times out at 8s; route handlers fall
back gracefully and TanStack Query keeps the last good data. Every normalizer is
defensive, so an upstream field change degrades to a placeholder instead of a crash.
Set `NEXT_PUBLIC_USE_MOCK=true` to run entirely offline on the bundled dataset.

<br/>

## 🛠️ Built with

<div align="center">

**Next.js 16** · **React 19** · **TypeScript** · **Tailwind CSS v4** (OKLCH tokens)
**Supabase** (Auth + Postgres + RLS) · **TanStack Query** · **Zustand** · **Motion** · **Recharts**
**Vitest** · **GitHub Actions** · **Vercel** (Analytics + Speed Insights)

</div>

<br/>

## 🗂️ Project structure

```
src/
  app/
    layout.tsx              Fonts + providers + Analytics / Speed Insights
    page.tsx                Dashboard (auth-gated)
    login/                  Email + password auth
    setup/                  Four-step onboarding
    settings/               Profile · appearance · dashboard · follows
    auth/confirm/route.ts   Email-confirmation handler
    api/                    ESPN route handlers + /api/account
    globals.css             OKLCH design tokens, base styles, keyframes
  lib/
    supabase/               Browser + server clients (@supabase/ssr)
    auth.ts                 Supabase Auth store + profile
    sync.ts                 Follows & settings ⇄ Postgres
    store.ts · settings.ts  In-memory working state (DB-backed)
    espn/                   Server-only ESPN integration (client · normalize · endpoints)
    leagues.ts · types.ts   League config + normalized domain models
  components/
    dashboard/ · setup/ · ui/ · system/ · brand/
supabase/migrations/        SQL schema + Row-Level Security
```

<br/>

## ✅ Quality

Every pull request runs the gate on GitHub Actions — and `main` is protected so nothing
merges red:

```bash
npm run lint        # ESLint
npx tsc --noEmit    # type-check
npm test            # Vitest
npm run build       # production build
```

<br/>

<div align="center">

*Frontrow · unofficial data via ESPN's public endpoints, refreshed as games unfold.*

**Built with care for the only seats worth having — front row.**

</div>
