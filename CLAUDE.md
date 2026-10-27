@AGENTS.md

Before starting, read the project note in the maintainer's personal OS:
`~/Documents/Projects/personal-os/projects/Frontrow/Frontrow.md`, with the
current state, what's next and the rules. The full project guide, the security
notes, the upstream-watch runbook, plans and design specs are in the same
folder. Read `Frontrow project guide.md` when you need more than this file. New
docs go there too: this repo keeps only README.md, CLAUDE.md and AGENTS.md.
Leave the sections marked `<!-- auto -->` alone, because the sync agent
rewrites them. If you can't reach that folder, the rules that matter are below.

# Pull requests and releases

- Always open a PR after a change, and never merge without the maintainer's
  say-so. Approval of one PR is not approval of the next.
- Branch fresh off `origin/main` for every change and never reuse a merged
  branch name. Keep PRs small and single-purpose.
- Before opening: `npm run lint`, `npx tsc --noEmit`, `npm test`,
  `npm run e2e` and `npm run build`. `main` is protected; nothing merges red.
- The author is `germanndarian`, never `ia24a-germannd`. End every commit with
  a `Co-Authored-By` trailer for the Claude model that wrote it.
- The title starts with a conventional type (`feat:`, `fix:`, otherwise
  `chore:`, `docs:`, `ci:`, `refactor:`, `test:`, `perf:` or `style:`), then
  says what changed for a reader of the release notes. Squash-merge with that
  title plus the PR number:
  `gh pr merge N --squash --delete-branch --subject "feat: … (#N)"`.
- The body follows `.github/pull_request_template.md`: what changed, the
  Vercel preview URL
  (`https://frontrow-git-<branch>-germanndarians-projects.vercel.app`, every
  `/` in the branch name turned into `-`), the checks run and any Supabase
  migration to run by hand. It ends with the Claude Code line.
- Merging publishes the release notes by itself: CI green on `main` bumps the
  version from the commit types (`feat!:` or `BREAKING CHANGE:` the major,
  `feat:` the minor, anything else the patch), tags it, and adds the page to
  Notion.

# Conventions and gotchas

- Read `node_modules/next/dist/docs/` before writing Next.js code (AGENTS.md).
- Match the surrounding code: non-trivial modules start with a short
  explanatory comment block.
- Style with the OKLCH semantic tokens in `src/app/globals.css`, not hardcoded
  colours.
- Read the time from `src/lib/clock.ts`, not `Date.now()`: demo mode runs on
  the demo evening's clock. Don't call `now()` in render; seed
  `useState(now)`. Read URL params with `useSearchParams()` inside
  `<Suspense>`, not in an effect.
- ESPN's `dates=` takes a day or a month, never a range. Ask for the months a
  window touches (`dates=202609&limit=400`) and slice on the US Eastern day
  with `src/lib/espn/window.ts`.
- Supabase migrations are manual: write `supabase/migrations/000N_*.sql` and
  tell the maintainer to run it in the SQL Editor before the code deploys.
- On purpose, so don't undo them: soccer/EPL is gone; the dashboard's Home
  button signs you out and the homepage has no Dashboard link, so a shared
  screen never hands over someone's account; season stats are separate cards,
  not more lines on the trend chart.
- The upstream watch (`npm run e2e:upstream`, `.github/workflows/upstream.yml`)
  calls ESPN for real and stays out of the merge gate. Its schedule is paused;
  to turn it back on, uncomment the `schedule` block in the workflow.
