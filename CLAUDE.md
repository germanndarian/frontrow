@AGENTS.md

Before starting, read the project note in the maintainer's personal OS:
`~/Documents/Projects/personal-os/projects/Frontrow/Frontrow.md`, with the
current state, what's next and the rules. The full project guide, the security
notes, the upstream-watch runbook, plans and design specs are in the same
folder. Read `Frontrow project guide.md` when you need more than this file. New
docs go there too: this repo keeps only README.md, CLAUDE.md, AGENTS.md and `.claude/skills/`.
Leave the sections marked `<!-- auto -->` alone, because the sync agent
rewrites them. If you can't reach that folder, the rules that matter are in AGENTS.md.

# Pull requests and releases

- Always open a PR after a change, and never merge without the maintainer's
  say-so. Approval of one PR is not approval of the next.
- Branch fresh off `origin/main` for every change and never reuse a merged
  branch name. Keep PRs small and single-purpose.
- Before opening, run the five checks in AGENTS.md "Done means".
- The author is `germanndarian`, never `ia24a-germannd`. End every commit with
  a `Co-Authored-By` trailer for the Claude model that wrote it.
- The title starts with a conventional type (`feat:`, `fix:`, otherwise
  `chore:`, `docs:`, `ci:`, `refactor:`, `test:`, `perf:` or `style:`), then
  says what changed for a reader of the release notes. Squash-merge with that
  title plus the PR number:
  `gh pr merge N --squash --delete-branch --subject "feat: … (#N)"`.
- The body is short and follows `.github/pull_request_template.md`: up to
  three bullets of what changed, in plain words; the Vercel preview URL
  (`https://frontrow-git-<branch>-germanndarians-projects.vercel.app`, every
  `/` in the branch name turned into `-`); one **Checked** line; a **For
  you** line only when the maintainer has to do something, such as a Supabase
  migration to run by hand; an **Open** line only when something is
  unfinished or not checked. It ends with the Claude Code line. Nothing else:
  no why, no how it works, no step-by-step test plan.
- Merging publishes the release notes by itself: CI green on `main` bumps the
  version from the commit types (`feat!:` or `BREAKING CHANGE:` the major,
  `feat:` the minor, anything else the patch), tags it, and adds the page to
  Notion.
