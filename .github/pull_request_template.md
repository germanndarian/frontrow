<!--
Title: start with a conventional-commit type, then say what changed.
  feat: …   → "Features" in the Notion release notes
  fix: …    → "Fixes & improvements"
  anything else (chore:, docs:, ci:, refactor:, test:, perf:, style:) → "Other"
PRs are squash-merged, and the squash commit takes this title, so the title is
the line that appears in the release notes. Write it for a reader of those.

Keep the body short: up to three bullets, the preview link and the Checked
line. Add For you and Open only when needed. Nothing else.
-->

- <!-- What a person using the site will notice, in plain words. -->

**Preview:** https://frontrow-git-BRANCH-germanndarians-projects.vercel.app/
<!-- The branch name with every "/" turned into "-"; point at the route that changed. -->

**Checked:** lint, types, unit, e2e, build.

<!-- Only when the maintainer has to do something, such as a Supabase migration to run by hand:
**For you:** run `supabase/migrations/000N_….sql` in the SQL Editor before it deploys. -->

<!-- Only when something is unfinished or not checked:
**Open:** … -->

<!-- Written by Claude Code? End the body with:
🤖 Generated with [Claude Code](https://claude.com/claude-code) -->
